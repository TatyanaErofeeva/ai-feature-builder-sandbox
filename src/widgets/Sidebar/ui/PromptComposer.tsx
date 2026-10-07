'use client';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { useUnit } from 'effector-react';
import { $isGenerating } from '@/entities/AiSession';
import {
  $prompt,
  PROMPT_EXAMPLES,
  exampleSelected,
  generationStopRequested,
  promptChanged,
  promptSubmitted,
} from '@/features/TriggerAiGeneration';

export function PromptComposer() {
  const prompt = useUnit($prompt);
  const generating = useUnit($isGenerating);
  const changePrompt = useUnit(promptChanged);
  const submitPrompt = useUnit(promptSubmitted);
  const pickExample = useUnit(exampleSelected);
  const stop = useUnit(generationStopRequested);
  const trimmed = prompt.trim();

  return (
    <form
      className="flex shrink-0 flex-col gap-2 border-t border-[rgba(158,186,214,0.14)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!generating) {
          submitPrompt();
        }
      }}
    >
      <div className="flex flex-wrap gap-1.5">
        {PROMPT_EXAMPLES.map((example) => (
          <Chip
            key={example.id}
            label={example.label}
            size="small"
            variant="outlined"
            clickable
            disabled={generating}
            onClick={() => pickExample(example.prompt)}
          />
        ))}
      </div>
      <TextField
        value={prompt}
        onChange={(event) => changePrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            if (!generating) {
              submitPrompt();
            }
          }
        }}
        placeholder="Опишите FSD-фичу: форма входа, список задач, панель метрик"
        multiline
        minRows={3}
        maxRows={5}
        fullWidth
        size="small"
        disabled={generating}
        aria-label="Промпт для генерации фичи"
      />
      {generating ? (
        <Button type="button" variant="outlined" color="warning" onClick={() => stop()}>
          Остановить
        </Button>
      ) : (
        <Button type="submit" variant="contained" disabled={trimmed.length === 0}>
          Сгенерировать
        </Button>
      )}
    </form>
  );
}
