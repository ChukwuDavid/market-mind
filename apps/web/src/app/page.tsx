export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-ambient-glow"
      />

      {/* Top bar */}
      <header className="relative flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/4 ring-1 ring-white/8">
            <span className="font-mono text-[11px] font-medium tracking-tight">
              MM
            </span>
          </div>
          <span className="text-sm font-medium tracking-tight">
            Market Mind
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-foreground-dim">
          <span className="text-foreground-muted">BUILD</span>
          <span>0.1.0</span>
          <span className="text-foreground-dim/40">·</span>
          <span className="flex items-center gap-1.5 text-bull">
            <span className="h-1.5 w-1.5 rounded-full bg-bull shadow-[0_0_8px_currentColor]" />
            ONLINE
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto flex max-w-3xl flex-col items-center px-8 pt-28 pb-16 text-center">
        <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Phase 3 · Frontend Foundation
        </span>

        <h1 className="text-balance text-7xl font-medium tracking-[-0.04em]">
          Market Mind
        </h1>

        <p className="mt-7 max-w-xl text-balance text-lg leading-relaxed text-foreground-muted">
          AI-powered market intelligence for forex, crypto, stocks, indices, and
          commodities — with structured reasoning, confidence scores, and clear
          invalidation conditions.
        </p>
      </section>

      {/* Status grid */}
      <section className="relative mx-auto max-w-3xl px-8 pb-32">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <StatusCell label="Foundation" value="Ready" tone="bull" />
          <StatusCell label="Data Pipeline" value="Pending" tone="dim" />
          <StatusCell label="Intelligence" value="Pending" tone="dim" />
        </div>

        <footer className="mt-12 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
          <span>Next.js 15</span>
          <Dot />
          <span>Tailwind v4</span>
          <Dot />
          <span>Supabase</span>
          <Dot />
          <span>RunPod</span>
        </footer>
      </section>
    </main>
  );
}

function StatusCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "bull" | "dim";
}) {
  return (
    <div className="bg-background px-6 py-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium">
        <span
          className={
            tone === "bull"
              ? "h-1.5 w-1.5 rounded-full bg-bull shadow-[0_0_8px_currentColor]"
              : "h-1.5 w-1.5 rounded-full bg-foreground-dim"
          }
        />
        <span
          className={
            tone === "bull" ? "text-foreground" : "text-foreground-muted"
          }
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-foreground-dim/40">
      ·
    </span>
  );
}
