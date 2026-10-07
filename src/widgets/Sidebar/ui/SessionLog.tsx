'use client';

import { useEffect, useRef } from 'react';
import Typography from '@mui/material/Typography';
import { useUnit } from 'effector-react';
import { $logs, type LogLevel } from '@/entities/AiSession';

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: '#8eb6ff',
  success: '#3ee0b0',
  error: '#ff6b81',
};

export function SessionLog() {
  const logs = useUnit($logs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [logs]);

  return (
    <section className="flex h-36 shrink-0 flex-col border-t border-[rgba(158,186,214,0.14)]" aria-label="Session log">
      <Typography
        component="h2"
        sx={{
          px: 1.5,
          pt: 1,
          pb: 0.5,
          color: '#8b9aab',
          fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: '0.16em',
        }}
      >
        LOG
      </Typography>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-2">
        {logs.length === 0 ? (
          <p className="m-0 font-mono text-[12px] text-[#6d7d90]">No events yet</p>
        ) : (
          logs.map((entry) => (
            <p key={entry.id} className="m-0 mb-1 font-mono text-[11px] leading-4 text-[#c5d0dc]">
              <span className="text-[#6d7d90]">{formatTime(entry.at)} </span>
              <span style={{ color: LEVEL_COLOR[entry.level] }}>{entry.message}</span>
            </p>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
