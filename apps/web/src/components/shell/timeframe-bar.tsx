"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export function TimeframeBar() {
  const [active, setActive] = useState<Timeframe>("1H");

  return (
    <div className="flex items-center gap-px rounded-md border border-border bg-surface p-0.5">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => setActive(tf)}
          className={cn(
            "rounded-sm px-2.5 py-1 font-mono text-[11px] transition-colors",
            active === tf
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
