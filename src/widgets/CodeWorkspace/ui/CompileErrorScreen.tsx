import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface CompileErrorScreenProps {
  title: string;
  message: string;
}

export function CompileErrorScreen({ title, message }: CompileErrorScreenProps) {
  return (
    <Box className="flex h-full min-h-0 flex-col gap-3 p-4">
      <Typography
        component="p"
        sx={{
          m: 0,
          color: '#ff6b81',
          fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
          fontSize: 12,
          letterSpacing: '0.14em',
        }}
      >
        {title}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          flex: 1,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: '1px solid rgba(255,107,129,0.35)',
          borderRadius: 1,
          backgroundColor: '#140d12',
          color: '#ffd0d8',
          fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
          fontSize: 13,
          lineHeight: 1.55,
          p: 2,
        }}
      >
        {message}
      </Box>
    </Box>
  );
}
