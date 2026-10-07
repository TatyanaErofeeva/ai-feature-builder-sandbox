import Skeleton from '@mui/material/Skeleton';

const LINE_WIDTHS = ['46%', '72%', '38%', '81%', '55%', '64%', '33%', '76%', '48%', '69%', '42%', '58%'];

export function EditorSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-[#0e141b] p-4" aria-hidden="true">
      {LINE_WIDTHS.map((width, index) => (
        <Skeleton
          key={width}
          variant="rounded"
          animation="wave"
          height={12}
          width={width}
          sx={{ bgcolor: index % 4 === 0 ? 'rgba(62,224,176,0.12)' : 'rgba(213,222,232,0.08)' }}
        />
      ))}
    </div>
  );
}
