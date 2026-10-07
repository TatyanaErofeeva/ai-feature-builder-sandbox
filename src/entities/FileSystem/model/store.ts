import { combine, createEvent, createStore, sample } from 'effector';
import { countFiles } from '../lib/tree';
import { INITIAL_FILE_SYSTEM_SEED, initialActivePath } from './seed';

export { ancestorPaths, findFileByPath, folderExists, rootIds } from '../lib/tree';
export { initialActiveContent } from './seed';
import type { FileNode, FileSystemState, FolderNode } from './types';

export interface AppendFilePayload {
  path: string;
  content: string;
}

export const appendFileOrFolder = createEvent<AppendFilePayload>();
export const updateFileContent = createEvent<{ path: string; content: string }>();
export const selectActiveFile = createEvent<string | null>();
export const folderToggled = createEvent<string>();
export const foldersExpanded = createEvent<string[]>();

export const $fileSystem = createStore<FileSystemState>(INITIAL_FILE_SYSTEM_SEED)
  .on(updateFileContent, (state, { path, content }) => {
    const node = state[path];
    if (!node || node.type !== 'file' || node.content === content) {
      return state;
    }

    return {
      ...state,
      [path]: { ...node, content },
    };
  })
  .on(appendFileOrFolder, (state, payload) => appendFileOrFolderToState(state, payload));

export const $activeFilePath = createStore<string | null>(initialActivePath).on(
  selectActiveFile,
  (_, path) => path,
);

export const $activeFile = createStore<FileNode | null>(
  readActiveFile(INITIAL_FILE_SYSTEM_SEED, initialActivePath),
);

sample({
  clock: [$fileSystem, $activeFilePath],
  source: { fs: $fileSystem, activePath: $activeFilePath },
  fn: ({ fs, activePath }) => readActiveFile(fs, activePath),
  target: $activeFile,
});

export const $activeFileContent = combine($activeFile, (file) => file?.content ?? '');

export const $fileCount = combine($fileSystem, (state) => countFiles(state));

export const $expandedPaths = createStore<string[]>(['src', 'src/app'])
  .on(folderToggled, (paths, path) =>
    paths.includes(path) ? paths.filter((item) => item !== path) : [...paths, path],
  )
  .on(foldersExpanded, (paths, extra) => [...new Set([...paths, ...extra])]);

function readActiveFile(fs: FileSystemState, activePath: string | null): FileNode | null {
  if (!activePath) {
    return null;
  }

  const node = fs[activePath];
  return node?.type === 'file' ? node : null;
}

function appendFileOrFolderToState(state: FileSystemState, payload: AppendFilePayload): FileSystemState {
  const segments = payload.path.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return state;
  }

  let next = state;
  let currentPath = '';

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment) {
      continue;
    }

    const isLast = index === segments.length - 1;
    const parentPath = currentPath.length > 0 ? currentPath : null;
    currentPath = currentPath.length > 0 ? `${currentPath}/${segment}` : segment;

    if (next[currentPath]) {
      continue;
    }

    const created: FileNode | FolderNode = isLast
      ? {
          id: currentPath,
          name: segment,
          type: 'file',
          parentId: parentPath,
          content: payload.content,
          language: languageFromName(segment),
        }
      : {
          id: currentPath,
          name: segment,
          type: 'folder',
          parentId: parentPath,
          childrenIds: [],
        };

    next = {
      ...next,
      [currentPath]: created,
    };

    if (!parentPath) {
      continue;
    }

    const parent = next[parentPath];
    if (!parent || parent.type !== 'folder' || parent.childrenIds.includes(currentPath)) {
      continue;
    }

    next = {
      ...next,
      [parentPath]: {
        ...parent,
        childrenIds: [...parent.childrenIds, currentPath],
      },
    };
  }

  return next;
}

function languageFromName(name: string): FileNode['language'] {
  if (name.endsWith('.json')) {
    return 'json';
  }

  if (name.endsWith('.css')) {
    return 'css';
  }

  if (name.endsWith('.js') || name.endsWith('.jsx')) {
    return 'javascript';
  }

  return 'typescript';
}
