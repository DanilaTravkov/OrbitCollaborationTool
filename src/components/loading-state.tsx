type LoadingStateProps = {
  mode: "list" | "board";
};

export function LoadingState({ mode }: LoadingStateProps) {
  if (mode === "board") {
    return (
      <div className="h-full overflow-x-auto overflow-y-hidden px-4 py-4">
        <div className="flex h-full min-w-max gap-3">
          {[3, 2, 1, 3, 2, 1].map((cards, idx) => (
            <div
              key={`column-${idx}`}
              className="h-full w-[272px] shrink-0 rounded-xl border p-3"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="mb-3 h-6 w-32 animate-pulse rounded bg-[#1d2030]" />
              <div className="space-y-2">
                {Array.from({ length: cards }).map((_, cardIdx) => (
                  <div
                    key={`card-${idx}-${cardIdx}`}
                    className="rounded-lg border p-3"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-base)" }}
                  >
                    <div className="mb-2 h-3 w-24 animate-pulse rounded bg-[#1d2030]" />
                    <div className="mb-1 h-3 w-full animate-pulse rounded bg-[#1d2030]" />
                    <div className="mb-3 h-3 w-4/5 animate-pulse rounded bg-[#1d2030]" />
                    <div className="h-3 w-16 animate-pulse rounded bg-[#1d2030]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden px-3 pb-4">
      <div
        className="grid h-8 grid-cols-[68px_minmax(0,1fr)_110px_90px_34px] items-center gap-2 border-b px-3 text-[10px] uppercase tracking-[0.08em]"
        style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
      >
        <span className="font-mono">ID</span>
        <span className="font-mono">Title</span>
        <span className="font-mono">Label</span>
        <span className="font-mono">Due</span>
        <span />
      </div>
      <div className="flex-1 overflow-auto">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={`skeleton-row-${idx}`}
            className="grid h-[38px] grid-cols-[20px_68px_20px_minmax(0,1fr)_110px_90px_34px] items-center gap-2 border-b px-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="h-3 w-3 animate-pulse rounded bg-[#1d2030]" />
            <div className="h-3 w-12 animate-pulse rounded bg-[#1d2030]" />
            <div className="h-3 w-3 animate-pulse rounded bg-[#1d2030]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#1d2030]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[#1d2030]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[#1d2030]" />
            <div className="h-5 w-5 animate-pulse rounded-full bg-[#1d2030]" />
          </div>
        ))}
      </div>
    </div>
  );
}