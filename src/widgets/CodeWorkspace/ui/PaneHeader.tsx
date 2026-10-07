interface PaneHeaderProps {
  title: string;
  hint: string;
}

export function PaneHeader({ title, hint }: PaneHeaderProps) {
  return (
    <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[rgba(158,186,214,0.14)] bg-[#10161d] px-3">
      <span className="shrink-0 font-mono text-[11px] tracking-[0.16em] text-[#8b9aab]">{title}</span>
      <span className="truncate font-mono text-[12px] text-[#d5dee8]">{hint}</span>
    </header>
  );
}
