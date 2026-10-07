import { combine, createEvent, createStore, sample } from 'effector';
import { debounce } from 'patronum';
import { $isGenerating, $status } from '@/entities/AiSession';
import {
  $activeFileContent,
  $activeFilePath,
  $fileSystem,
  findFileByPath,
  initialActiveContent,
  selectActiveFile,
  updateFileContent,
} from '@/entities/FileSystem';

export const editorTextChanged = createEvent<{ path: string; content: string }>();
export const fileOpenRequested = createEvent<string>();

const userEdit = sample({
  clock: editorTextChanged,
  source: $isGenerating,
  filter: (generating) => !generating,
  fn: (_, payload) => payload,
});

export const $editorBuffer = createStore(initialActiveContent).on(
  userEdit,
  (_, payload) => payload.content,
);

const debouncedEdit = debounce({
  source: userEdit,
  timeout: 320,
});

sample({
  clock: debouncedEdit,
  source: { tree: $fileSystem, generating: $isGenerating },
  filter: ({ tree, generating }, payload) => {
    if (generating) {
      return false;
    }

    const file = findFileByPath(tree, payload.path);
    return file !== null && file.content !== payload.content;
  },
  fn: (_, payload) => payload,
  target: updateFileContent,
});

sample({
  clock: fileOpenRequested,
  source: {
    path: $activeFilePath,
    buffer: $editorBuffer,
    tree: $fileSystem,
    generating: $isGenerating,
  },
  filter: ({ path, buffer, tree, generating }, nextPath) => {
    if (generating || path === null || path === nextPath) {
      return false;
    }

    const file = findFileByPath(tree, path);
    return file !== null && file.content !== buffer;
  },
  fn: ({ path, buffer }) => ({
    path: path ?? '',
    content: buffer,
  }),
  target: updateFileContent,
});

sample({
  clock: fileOpenRequested,
  source: $activeFilePath,
  filter: (current, nextPath) => current !== nextPath,
  fn: (_, nextPath) => nextPath,
  target: selectActiveFile,
});

sample({
  clock: selectActiveFile,
  source: $fileSystem,
  filter: (_, path) => path !== null,
  fn: (tree, path) => (path ? findFileByPath(tree, path)?.content ?? '' : ''),
  target: $editorBuffer,
});

sample({
  clock: $status.updates,
  source: $activeFileContent,
  filter: (_, status) => status !== 'generating',
  fn: (content) => content,
  target: $editorBuffer,
});

export const $editorValue = combine(
  $isGenerating,
  $activeFileContent,
  $editorBuffer,
  (generating, content, buffer) => (generating ? content : buffer),
);
