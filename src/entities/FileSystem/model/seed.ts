import type { FileSystemState } from './types';

export const INITIAL_FILE_SYSTEM_SEED: FileSystemState = {
  src: {
    id: 'src',
    name: 'src',
    type: 'folder',
    parentId: null,
    childrenIds: ['src/app', 'src/entities'],
  },
  'src/app': {
    id: 'src/app',
    name: 'app',
    type: 'folder',
    parentId: 'src',
    childrenIds: ['src/app/page.tsx', 'src/app/layout.tsx'],
  },
  'src/app/page.tsx': {
    id: 'src/app/page.tsx',
    name: 'page.tsx',
    type: 'file',
    parentId: 'src/app',
    language: 'typescript',
    content: `// Welcome to AI Feature Builder Sandbox\nexport default function SandboxApp() {\n  return (\n    <div className="p-8">\n      <h1 className="text-2xl font-bold">Live Compilation Screen</h1>\n    </div>\n  );\n}`,
  },
  'src/app/layout.tsx': {
    id: 'src/app/layout.tsx',
    name: 'layout.tsx',
    type: 'file',
    parentId: 'src/app',
    language: 'typescript',
    content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}`,
  },
  'src/entities': {
    id: 'src/entities',
    name: 'entities',
    type: 'folder',
    parentId: 'src',
    childrenIds: [],
  },
};

export const initialActivePath = 'src/app/page.tsx';

const activeNode = INITIAL_FILE_SYSTEM_SEED[initialActivePath];

export const initialActiveContent = activeNode?.type === 'file' ? activeNode.content : '';
