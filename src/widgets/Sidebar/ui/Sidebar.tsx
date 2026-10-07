'use client';

import Typography from '@mui/material/Typography';
import { FileTree } from './FileTree';
import { PromptComposer } from './PromptComposer';
import { SessionLog } from './SessionLog';

export function Sidebar() {
  return (
    <aside className="flex h-full w-full flex-col bg-[#10161d]">
      <div className="flex h-10 shrink-0 items-center border-b border-[rgba(158,186,214,0.14)] px-3">
        <Typography
          component="h2"
          sx={{
            color: '#8b9aab',
            fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: '0.16em',
          }}
        >
          PROJECT
        </Typography>
      </div>
      <FileTree />
      <SessionLog />
      <PromptComposer />
    </aside>
  );
}
