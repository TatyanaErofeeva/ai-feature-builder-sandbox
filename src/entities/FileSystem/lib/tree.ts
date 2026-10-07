import type { FileNode, FileSystemState, FolderNode } from '../model/types';

export interface NewFilePayload {
  path: string;
  language: FileNode['language'];
  content: string;
}

export function insertFiles(state: FileSystemState, files: NewFilePayload[]): FileSystemState {
  return files.reduce(insertFileNode, state);
}

export function insertFileNode(state: FileSystemState, file: NewFilePayload): FileSystemState {
  const segments = file.path.split('/').filter((segment) => segment.length > 0);
  const fileName = segments[segments.length - 1];

  if (!fileName || segments.length < 2) {
    throw new Error(`Invalid file path: ${file.path}`);
  }

  let next = state;
  let parentId: string | null = null;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const name = segments[index];
    if (!name) {
      continue;
    }

    const id = segments.slice(0, index + 1).join('/');
    const current = next[id];

    if (current?.type === 'file') {
      throw new Error(`Path is already a file: ${id}`);
    }

    if (!current) {
      next = placeNode(next, parentId, {
        id,
        name,
        type: 'folder',
        parentId,
        childrenIds: [],
      });
    }

    parentId = id;
  }

  return placeNode(next, parentId, {
    id: file.path,
    name: fileName,
    type: 'file',
    parentId,
    content: file.content,
    language: file.language,
  });
}

export function replaceFileContent(
  state: FileSystemState,
  path: string,
  content: string,
): FileSystemState {
  const node = state[path];
  if (!node || node.type !== 'file' || node.content === content) {
    return state;
  }

  return {
    ...state,
    [path]: { ...node, content },
  };
}

export function appendFileContent(
  state: FileSystemState,
  path: string,
  chunk: string,
): FileSystemState {
  const node = state[path];
  if (!node || node.type !== 'file' || chunk.length === 0) {
    return state;
  }

  return {
    ...state,
    [path]: { ...node, content: node.content + chunk },
  };
}

export function findFileByPath(state: FileSystemState, path: string): FileNode | null {
  const node = state[path];
  return node?.type === 'file' ? node : null;
}

export function findNode(state: FileSystemState, path: string): FileNode | FolderNode | null {
  return state[path] ?? null;
}

export function folderExists(state: FileSystemState, path: string): boolean {
  return state[path]?.type === 'folder';
}

export function countFiles(state: FileSystemState): number {
  return Object.values(state).reduce((sum, node) => sum + (node.type === 'file' ? 1 : 0), 0);
}

export function rootIds(state: FileSystemState): string[] {
  return sortChildIds(
    state,
    Object.values(state)
      .filter((node) => node.parentId === null)
      .map((node) => node.id),
  );
}

export function ancestorPaths(filePath: string): string[] {
  const parts = filePath.split('/').filter((part) => part.length > 0);
  const paths: string[] = [];

  for (let index = 1; index < parts.length; index += 1) {
    paths.push(parts.slice(0, index).join('/'));
  }

  return paths;
}

function placeNode(
  state: FileSystemState,
  parentId: string | null,
  node: FileNode | FolderNode,
): FileSystemState {
  const existing = state[node.id];
  const keepExistingFolder = existing?.type === 'folder' && node.type === 'folder';
  const nextState: FileSystemState = keepExistingFolder ? state : { ...state, [node.id]: node };

  if (parentId === null) {
    return nextState;
  }

  const parent = nextState[parentId];
  if (!parent || parent.type !== 'folder' || parent.childrenIds.includes(node.id)) {
    return nextState;
  }

  return {
    ...nextState,
    [parentId]: {
      ...parent,
      childrenIds: sortChildIds(nextState, [...parent.childrenIds, node.id]),
    },
  };
}

function sortChildIds(state: FileSystemState, ids: string[]): string[] {
  return [...ids].sort((leftId, rightId) => {
    const left = state[leftId];
    const right = state[rightId];

    if (!left || !right) {
      return leftId.localeCompare(rightId, 'en');
    }

    if (left.type !== right.type) {
      return left.type === 'folder' ? -1 : 1;
    }

    return left.name.localeCompare(right.name, 'en');
  });
}
