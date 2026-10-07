export type FileNodeType = 'file' | 'folder';

export interface BaseNode {
  id: string; // Полный путь, например, 'src/features/AuthForm/ui/AuthForm.tsx'
  name: string; // Название, например, 'AuthForm.tsx'
  type: FileNodeType;
  parentId: string | null;
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: string; // Код внутри файла
  language: 'typescript' | 'javascript' | 'css' | 'json';
}

export interface FolderNode extends BaseNode {
  type: 'folder';
  childrenIds: string[]; // Массив ID дочерних элементов для оптимизации рендеринга
}

// Плоская структура дерева (Map) в сторе для мгновенного поиска O(1) и иммутабельных апдейтов
export type FileSystemState = Record<string, FileNode | FolderNode>;
