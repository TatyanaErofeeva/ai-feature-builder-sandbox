import { combine, createEvent, createStore } from 'effector';
import { defaultModelId, modelById, type ModelId } from './models';
import type { LogDraft, SessionLog, SessionMetrics, SessionStatus } from './types';

let logSequence = 0;

export const statusChanged = createEvent<SessionStatus>();
export const modelSelected = createEvent<ModelId>();
export const metricsUpdated = createEvent<SessionMetrics>();
export const metricsReset = createEvent();
export const logAppended = createEvent<LogDraft>();
export const streamingFileChanged = createEvent<string | null>();

export const $status = createStore<SessionStatus>('idle').on(
  statusChanged,
  (_, status) => status,
);

export const $selectedModelId = createStore<ModelId>(defaultModelId).on(
  modelSelected,
  (_, modelId) => modelId,
);

export const $charsPerSecond = combine($selectedModelId, (modelId) => modelById(modelId).charsPerSecond);

export const $tokensPerSecond = createStore(0)
  .on(metricsUpdated, (_, metrics) => metrics.tokensPerSecond)
  .on(metricsReset, () => 0);

export const $streamedChars = createStore(0)
  .on(metricsUpdated, (_, metrics) => metrics.streamedChars)
  .on(metricsReset, () => 0);

export const $streamingFilePath = createStore<string | null>(null).on(
  streamingFileChanged,
  (_, path) => path,
);

export const $logs = createStore<SessionLog[]>([]).on(logAppended, (logs, draft) => {
  logSequence += 1;
  const next: SessionLog = {
    id: `log-${logSequence}`,
    at: Date.now(),
    level: draft.level,
    message: draft.message,
  };

  return [...logs, next].slice(-80);
});

export const $isGenerating = combine($status, (status) => status === 'generating');
