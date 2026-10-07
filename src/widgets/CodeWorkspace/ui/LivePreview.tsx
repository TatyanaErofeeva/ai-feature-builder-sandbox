'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useUnit } from 'effector-react';
import { $isGenerating } from '@/entities/AiSession';
import { CompileErrorScreen } from './CompileErrorScreen';
import { PaneHeader } from './PaneHeader';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { $preview, previewActivated, type PreviewModel } from '../model/preview';

export function LivePreview() {
  const [preview, generating] = useUnit([$preview, $isGenerating]);

  useEffect(() => {
    previewActivated();
  }, []);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col" aria-label="Изолированное превью">
      <PaneHeader title="ПРЕВЬЮ" hint={hintFor(preview)} />
      <div className="relative min-h-0 flex-1 overflow-auto bg-[#0c1218] bg-[radial-gradient(circle_at_top,rgba(62,224,176,0.08),transparent_42%)]">
        <PreviewBody preview={preview} generating={generating} />
      </div>
    </section>
  );
}

function PreviewBody({ preview, generating }: { preview: PreviewModel; generating: boolean }) {
  if (preview.phase === 'skeleton') {
    return <PreviewSkeleton />;
  }

  if (preview.phase === 'unsupported') {
    return (
      <Message
        title="Превью ждёт TSX"
        text={`Сейчас открыт ${preview.path}. Компонент рисуется из default-экспорта активного TSX-файла.`}
      />
    );
  }

  if (preview.phase === 'empty' || (preview.phase === 'error' && generating)) {
    return (
      <Message
        title="Сборка потока"
        text="Код ещё не собрался в валидный модуль. Превью обновится, когда компонент закроется."
      />
    );
  }

  if (preview.phase === 'error') {
    return <CompileErrorScreen title="ОШИБКА КОМПИЛЯЦИИ" message={preview.message} />;
  }

  const View = preview.Component;

  return (
    <PreviewErrorBoundary resetKey={preview.revision}>
      <View />
    </PreviewErrorBoundary>
  );
}

function PreviewSkeleton() {
  return (
    <Box className="flex h-full flex-col gap-3 p-5" aria-busy="true" aria-label="Скелет превью">
      <Skeleton variant="rounded" animation="wave" height={18} width="28%" sx={{ bgcolor: 'rgba(62,224,176,0.14)' }} />
      <Skeleton variant="rounded" animation="wave" height={148} sx={{ bgcolor: 'rgba(213,222,232,0.06)' }} />
      <Skeleton variant="rounded" animation="wave" height={36} width="34%" sx={{ bgcolor: 'rgba(142,182,255,0.12)' }} />
    </Box>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <Box className="flex h-full flex-col justify-center gap-2 p-6">
      <Typography sx={{ color: '#3ee0b0', fontSize: 12, letterSpacing: '0.14em' }}>{title}</Typography>
      <Typography sx={{ color: '#93a4b8', maxWidth: 460, lineHeight: 1.5 }}>{text}</Typography>
    </Box>
  );
}

function hintFor(preview: PreviewModel): string {
  if (preview.phase === 'ready') {
    return 'runtime isolated';
  }

  if (preview.phase === 'error') {
    return 'compile error';
  }

  if (preview.phase === 'unsupported') {
    return preview.path;
  }

  return 'sandbox';
}
