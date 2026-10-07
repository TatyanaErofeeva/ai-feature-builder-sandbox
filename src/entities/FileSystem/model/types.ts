export type FileNodeType = 'file' | 'folder';

export interface BaseNode {
  id: string; // Full path, for example 'src/features/AuthForm/ui/AuthForm.tsx'
  name: string; // Display name, for example 'AuthForm.tsx'
  type: FileNodeType;
  parentId: string | null;
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: string; // Source code stored in the file
  language: 'typescript' | 'javascript' | 'css' | 'json';
}

export interface FolderNode extends BaseNode {
  type: 'folder';
  childrenIds: string[]; // Child ids, used to render the tree without scanning the map
}

// Flat filesystem map for O(1) lookup and immutable updates
export type FileSystemState = Record<string, FileNode | FolderNode>;
