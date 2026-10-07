import { createEffect, createEvent, createStore, sample } from 'effector';
import {
  $charsPerSecond,
  $isGenerating,
  logAppended,
  metricsReset,
  metricsUpdated,
  statusChanged,
  streamingFileChanged,
} from '@/entities/AiSession';
import {
  $fileSystem,
  ancestorPaths,
  appendFileOrFolder,
  foldersExpanded,
  selectActiveFile,
  updateFileContent,
} from '@/entities/FileSystem';
import { planGeneration } from '../lib/planGeneration';
import { wait } from '../lib/wait';

export interface GenerationRequest {
  prompt: string;
  charsPerSecond: number;
}

export const promptChanged = createEvent<string>();
export const promptSubmitted = createEvent();
export const exampleSelected = createEvent<string>();
export const generationStopRequested = createEvent();

export const $prompt = createStore('')
  .on(promptChanged, (_, prompt) => prompt)
  .on(exampleSelected, (_, prompt) => prompt);

let runId = 0;
let activeRunId = 0;

export const streamGenerationFx = createEffect(async (request: GenerationRequest) => {
  const id = ++runId;
  activeRunId = id;
  const prompt = request.prompt.trim();
  const plan = planGeneration(prompt, $fileSystem.getState());
  const charsPerSecond = Math.max(request.charsPerSecond, 1);
  const delay = 1000 / charsPerSecond;

  statusChanged('generating');
  metricsReset();
  logAppended({
    level: 'info',
    message: `Промпт принят: ${prompt}`,
  });

  for (const file of plan.files) {
    appendFileOrFolder({ path: file.path, content: '' });
  }
  foldersExpanded(plan.files.flatMap((file) => ancestorPaths(file.path)));
  logAppended({
    level: 'info',
    message: `В дерево добавлен слайс src/features/${plan.featureName}`,
  });

  let streamed = 0;
  const startedAt = performance.now();

  try {
    for (const file of plan.files) {
      if (id !== runId) {
        return;
      }

      selectActiveFile(file.path);
      streamingFileChanged(file.path);
      logAppended({ level: 'info', message: `Поток: ${file.path}` });

      let written = '';

      for (const char of file.content) {
        if (id !== runId) {
          return;
        }

        written += char;
        updateFileContent({ path: file.path, content: written });
        streamed += 1;

        if (streamed % 12 === 0) {
          publishSpeed(streamed, startedAt);
        }

        await wait(delay);
      }
    }

    if (id !== runId) {
      return;
    }

    if (activeRunId === id) {
      activeRunId = 0;
    }

    publishSpeed(streamed, startedAt);
    streamingFileChanged(null);
    statusChanged('ready');
    logAppended({
      level: 'success',
      message: `Слайс ${plan.featureName} собран`,
    });
  } catch (error) {
    if (id !== runId) {
      return;
    }

    streamingFileChanged(null);
    statusChanged('error');
    logAppended({
      level: 'error',
      message: error instanceof Error ? error.message : 'Сбой генерации',
    });
    throw error;
  }
});

sample({
  clock: promptSubmitted,
  source: { prompt: $prompt, charsPerSecond: $charsPerSecond, generating: $isGenerating },
  filter: ({ prompt, generating }) => !generating && prompt.trim().length > 0,
  fn: ({ prompt, charsPerSecond }) => ({
    prompt: prompt.trim(),
    charsPerSecond,
  }),
  target: streamGenerationFx,
});

sample({
  clock: exampleSelected,
  source: { charsPerSecond: $charsPerSecond, generating: $isGenerating },
  filter: ({ generating }, prompt) => !generating && prompt.trim().length > 0,
  fn: ({ charsPerSecond }, prompt) => ({
    prompt: prompt.trim(),
    charsPerSecond,
  }),
  target: streamGenerationFx,
});

generationStopRequested.watch(() => {
  if (activeRunId === 0) {
    return;
  }

  runId += 1;
  activeRunId = 0;
  streamingFileChanged(null);
  statusChanged('idle');
  logAppended({ level: 'info', message: 'Генерация остановлена' });
});

function publishSpeed(streamed: number, startedAt: number): void {
  const seconds = (performance.now() - startedAt) / 1000;
  metricsUpdated({
    streamedChars: streamed,
    tokensPerSecond: seconds > 0 ? streamed / 4 / seconds : 0,
  });
}
