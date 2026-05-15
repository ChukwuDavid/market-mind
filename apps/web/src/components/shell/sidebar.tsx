"use client";

import { useMarketStore } from "@/stores/market-store";
import { INSTRUMENT_GROUPS } from "@/lib/constants/instruments";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const symbol = useMarketStore((s) => s.symbol);
  const setSymbol = useMarketStore((s) => s.setSymbol);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-12 items-center border-b border-border px-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
          Watchlist
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {INSTRUMENT_GROUPS.map((group) => (
          <div
            key={group.id}
            className="border-b border-border last:border-b-0"
          >
            <div className="sticky top-0 z-10 flex h-7 items-center bg-background px-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
                {group.label}
              </span>
            </div>
            <div>
              {group.items.map((item) => {
                const active = item.symbol === symbol;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => setSymbol(item.symbol)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                      active
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground-muted hover:bg-surface hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-0.5 rounded-full transition-colors",
                        active ? "bg-primary" : "bg-transparent",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-medium">
                        {item.display}
                      </span>
                      <span className="truncate text-[11px] text-foreground-dim">
                        {item.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
