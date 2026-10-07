'use client';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useUnit } from 'effector-react';
import {
  $isGenerating,
  $selectedModelId,
  $status,
  $streamedChars,
  $tokensPerSecond,
  AI_MODELS,
  isModelId,
  modelSelected,
  type SessionStatus,
} from '@/entities/AiSession';

const STATUS_DOT: Record<SessionStatus, string> = {
  idle: 'bg-zinc-500',
  ready: 'bg-green-500',
  generating: 'animate-pulse bg-violet-500',
  error: 'bg-red-500',
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  idle: 'Ожидание',
  ready: 'Готово',
  generating: 'Генерация',
  error: 'Ошибка',
};

export function TopBar() {
  const [status, tokensPerSecond, streamedChars, modelId, generating, selectModel] = useUnit([
    $status,
    $tokensPerSecond,
    $streamedChars,
    $selectedModelId,
    $isGenerating,
    modelSelected,
  ]);

  return (
    <header className="flex h-full w-full items-center justify-between bg-zinc-900/30 px-6">
      <div className="flex min-w-0 items-center gap-3">
        <p className="truncate text-sm font-medium tracking-tight text-zinc-100">
          AI Feature Builder Sandbox
        </p>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`}
          title={STATUS_LABEL[status]}
          aria-label={STATUS_LABEL[status]}
        />
        <Select
          size="small"
          value={modelId}
          disabled={generating}
          aria-label="Модель генерации"
          onChange={(event) => {
            const next = event.target.value;
            if (isModelId(next)) {
              selectModel(next);
            }
          }}
          sx={{ minWidth: 148, fontSize: 13 }}
        >
          {AI_MODELS.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </div>

      <div className="flex shrink-0 items-center gap-6">
        <Metric label="Tokens/sec" value={tokensPerSecond.toFixed(1)} width="5.5ch" />
        <Metric label="Characters Generated" value={String(streamedChars)} width="6ch" />
      </div>
    </header>
  );
}

function Metric({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] tracking-wide text-zinc-400">{label}</span>
      <span
        className="text-right font-mono text-sm tabular-nums text-zinc-100"
        style={{ minWidth: width }}
      >
        {value}
      </span>
    </div>
  );
}
