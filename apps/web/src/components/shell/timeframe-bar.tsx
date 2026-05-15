"use client";

import { cn } from "@/lib/utils";
import { useMarketStore } from "@/stores/market-store";
import type { Timeframe } from "@/lib/market-data";

const TIMEFRAMES: Timeframe[] = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1H",
  "4H",
  "1D",
  "1W",
];

export function TimeframeBar() {
  const timeframe = useMarketStore((s) => s.timeframe);
  const setTimeframe = useMarketStore((s) => s.setTimeframe);

  return (
    <div className="flex items-center gap-px rounded-md border border-border bg-surface p-0.5">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => setTimeframe(tf)}
          className={cn(
            "rounded-sm px-2.5 py-1 font-mono text-[11px] transition-colors",
            timeframe === tf
              ? "bg-white/8 text-foreground"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
