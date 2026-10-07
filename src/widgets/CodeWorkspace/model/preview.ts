import type { ComponentType } from 'react';
import { combine, createEffect, createEvent, createStore, sample } from 'effector';
import { throttle } from 'patronum';
import { $status } from '@/entities/AiSession';
import { $activeFile, $activeFilePath } from '@/entities/FileSystem';
import { $editorValue } from '@/features/EditCodeInline';
import { compileComponent, type CompileResult } from '../lib/compileComponent';

export type PreviewModel =
  | { phase: 'skeleton' }
  | { phase: 'unsupported'; path: string }
  | { phase: 'empty' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; Component: ComponentType; revision: number };

interface CompilePayload {
  serial: number;
  revision: number;
  source: string;
  result: CompileResult;
}

let compileSerial = 0;
let readyRevision = 0;

export const previewActivated = createEvent();
const unsupportedSelected = createEvent<string>();
const previewEmptied = createEvent();

export const $previewSource = combine($activeFile, $editorValue, (file, value) =>
  file && (file.id.endsWith('.tsx') || file.id.endsWith('.jsx')) ? value : null,
);

export const compilePreviewFx = createEffect(async (source: string): Promise<CompilePayload> => {
  const serial = ++compileSerial;
  const [babelModule, reactModule] = await Promise.all([
    import('@babel/standalone'),
    import('react'),
  ]);
  const result = compileComponent(babelModule, source, reactModule);
  const revision = result.ok ? ++readyRevision : 0;

  return { serial, revision, source, result };
});

export const $preview = createStore<PreviewModel>({ phase: 'skeleton' })
  .on(compilePreviewFx.doneData, (state, payload) => {
    if (payload.serial !== compileSerial || $previewSource.getState() !== payload.source) {
      return state;
    }

    if (!payload.result.ok) {
      return { phase: 'error', message: payload.result.message };
    }

    return {
      phase: 'ready',
      Component: payload.result.Component,
      revision: payload.revision,
    };
  })
  .on(unsupportedSelected, (_, path) => ({ phase: 'unsupported', path }))
  .on(previewEmptied, () => ({ phase: 'empty' }));

const throttledSource = throttle({
  source: $previewSource,
  timeout: 140,
});

sample({
  clock: throttledSource,
  filter: (source): source is string => source !== null && source.trim().length > 0,
  target: compilePreviewFx,
});

sample({
  clock: previewActivated,
  source: $previewSource,
  filter: (source): source is string => source !== null && source.trim().length > 0,
  target: compilePreviewFx,
});

sample({
  clock: $status.updates,
  source: $previewSource,
  filter: (source, status) => status !== 'generating' && source !== null && source.trim().length > 0,
  fn: (source) => source ?? '',
  target: compilePreviewFx,
});

sample({
  clock: $previewSource.updates,
  source: $activeFilePath,
  filter: (_, source) => source === null,
  fn: (path) => path ?? 'файл',
  target: unsupportedSelected,
});

sample({
  clock: $previewSource.updates,
  filter: (source) => source !== null && source.trim().length === 0,
  target: previewEmptied,
});
