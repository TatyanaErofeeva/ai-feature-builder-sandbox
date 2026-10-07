import { combine, createEffect } from 'effector';
import {
  logAppended,
  metricsReset,
  metricsUpdated,
  statusChanged,
  streamingFileChanged,
} from '@/entities/AiSession';
import {
  $activeFilePath,
  $fileSystem,
  ancestorPaths,
  appendFileOrFolder,
  folderExists,
  foldersExpanded,
  selectActiveFile,
  updateFileContent,
} from '@/entities/FileSystem';
import { wait } from '../lib/wait';

export const FSD_LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'] as const;

export type FsdLayer = (typeof FSD_LAYERS)[number];

export interface GenerateSliceParams {
  layer: FsdLayer;
  sliceName: string;
}

const SERVER_DELAY_MS = 700;
const STREAM_INTERVAL_MS = 30;

let streamToken = 0;

export const streamTextIntoActiveFile = createEffect(async (text: string): Promise<boolean> => {
  const token = ++streamToken;
  const path = $activeFilePath.getState();

  if (!path) {
    throw new Error('No active file selected for streaming');
  }

  statusChanged('generating');
  streamingFileChanged(path);
  metricsReset();

  const startedAt = performance.now();
  let written = '';
  let streamed = 0;

  for (const char of text) {
    if (token !== streamToken) {
      return false;
    }

    written += char;
    streamed += 1;
    updateFileContent({ path, content: written });

    if (streamed % 12 === 0) {
      publishSpeed(streamed, startedAt);
    }

    await wait(STREAM_INTERVAL_MS);
  }

  if (token !== streamToken) {
    return false;
  }

  publishSpeed(streamed, startedAt);
  streamingFileChanged(null);
  statusChanged('ready');
  return true;
});

export const generateSliceFx = createEffect(async ({ layer, sliceName }: GenerateSliceParams) => {
  const name = assertSliceName(sliceName);
  const root = `src/${layer}/${name}`;

  if (folderExists($fileSystem.getState(), root)) {
    throw new Error(`Slice ${root} already exists in the project`);
  }

  const componentPath = `${root}/ui/${name}.tsx`;
  const componentSource = componentTemplate(name, layer);

  statusChanged('generating');
  logAppended({
    level: 'info',
    message: `Assembling slice ${root}`,
  });

  await wait(SERVER_DELAY_MS);

  appendFileOrFolder({
    path: `${root}/index.ts`,
    content: indexTemplate(name),
  });
  appendFileOrFolder({
    path: `${root}/model/store.ts`,
    content: storeTemplate(name),
  });
  appendFileOrFolder({
    path: componentPath,
    content: '',
  });

  foldersExpanded([
    ...ancestorPaths(componentPath),
    `${root}/ui`,
    `${root}/model`,
  ]);
  selectActiveFile(componentPath);
  logAppended({
    level: 'info',
    message: `Streaming: ${componentPath}`,
  });

  let finished = false;

  try {
    finished = await streamTextIntoActiveFile(componentSource);
  } catch (error) {
    streamingFileChanged(null);
    statusChanged('error');
    logAppended({
      level: 'error',
      message: error instanceof Error ? error.message : 'Generation failed',
    });
    throw error;
  }

  if (!finished) {
    return;
  }

  logAppended({
    level: 'success',
    message: `Slice ${name} successfully assembled`,
  });
});

export const $isGenerating = combine(
  generateSliceFx.pending,
  streamTextIntoActiveFile.pending,
  (slicePending, streamPending) => slicePending || streamPending,
);

function assertSliceName(sliceName: string): string {
  const name = sliceName.trim();

  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    throw new Error('Slice name must be in PascalCase, without paths or special characters');
  }

  return name;
}

function indexTemplate(sliceName: string): string {
  return `export { default as ${sliceName} } from "./ui/${sliceName}";\n`;
}

function storeTemplate(sliceName: string): string {
  return `import { createEvent, createStore } from "effector";

export const ${camel(sliceName)}Mounted = createEvent();

export const $isMounted = createStore(false).on(${camel(sliceName)}Mounted, () => true);
`;
}

function componentTemplate(sliceName: string, layer: FsdLayer): string {
  return `import React from "react";

const shell = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: "100%",
  padding: 24,
  boxSizing: "border-box",
  color: "#d5dee8",
  fontFamily: "Manrope, Segoe UI, sans-serif",
};

export default function ${sliceName}() {
  return (
    <section style={shell}>
      <h1 style={{ margin: 0, fontSize: 28 }}>${sliceName}</h1>
      <p style={{ margin: 0, color: "#8ea0b5" }}>FSD Layer: ${layer} | Slice: ${sliceName}</p>
    </section>
  );
}
`;
}

function camel(sliceName: string): string {
  return sliceName.charAt(0).toLowerCase() + sliceName.slice(1);
}

function publishSpeed(streamed: number, startedAt: number): void {
  const seconds = (performance.now() - startedAt) / 1000;

  metricsUpdated({
    streamedChars: streamed,
    tokensPerSecond: seconds > 0 ? streamed / 4 / seconds : 0,
  });
}
