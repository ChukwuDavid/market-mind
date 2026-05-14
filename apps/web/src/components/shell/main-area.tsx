import { CandlestickChart } from "lucide-react";
import { TimeframeBar } from "./timeframe-bar";

export function MainArea() {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-6">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-medium tracking-tight">EUR/USD</h1>
            <span className="text-xs text-foreground-muted">
              Euro / US Dollar
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-[11px] text-foreground-dim">—</span>
            <span className="font-mono text-[10px] text-foreground-dim">—</span>
          </div>
        </div>

        <TimeframeBar />
      </div>

      {/* Chart placeholder */}
      <div className="relative flex flex-1 items-center justify-center">
        <div
          aria-hidden
          className="bg-chart-grid absolute inset-0 opacity-40"
        />

        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface">
            <CandlestickChart size={20} className="text-foreground-dim" />
          </div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
            Phase 6
          </div>
          <div className="text-sm text-foreground-muted">
            Chart engine wires up here
          </div>
        </div>
      </div>
    </main>
  );
}
