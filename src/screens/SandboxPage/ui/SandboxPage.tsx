'use client';

import { useUnit } from 'effector-react';
import { $activeFilePath } from '@/entities/FileSystem';
import { CodeWorkspace } from '@/widgets/CodeWorkspace';
import { Sidebar } from '@/widgets/Sidebar';
import { TopBar } from '@/widgets/TopBar';

export function SandboxPage() {
  const activeFilePath = useUnit($activeFilePath);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="h-14 shrink-0 border-b border-zinc-800">
        <TopBar />
      </div>
      <div className="flex h-[calc(100vh-3.5rem)] min-h-0">
        <div className="w-80 shrink-0 flex-shrink-0 border-r border-zinc-800">
          <Sidebar />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <p
            className="shrink-0 truncate border-b border-zinc-800 px-4 py-2 font-mono text-[11px] text-zinc-500"
            data-testid="active-file-path"
          >
            {activeFilePath ?? 'No file selected'}
          </p>
          <div className="min-h-0 flex-1">
            <CodeWorkspace />
          </div>
        </div>
      </div>
    </div>
  );
}
