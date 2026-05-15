"use client";

import { TimeframeBar } from "./timeframe-bar";
import { CandlestickChart } from "@/components/chart/candlestick-chart";
import { useMarketStore } from "@/stores/market-store";
import { INSTRUMENT_GROUPS } from "@/lib/constants/instruments";
import {
  formatPrice,
  formatChange,
  formatChangePct,
} from "@/lib/market-data/price-format";
import { cn } from "@/lib/utils";

export function MainArea() {
  const symbol = useMarketStore((s) => s.symbol);
  const price = useMarketStore((s) => s.latestPrice);
  const change = useMarketStore((s) => s.latestChange);
  const changePct = useMarketStore((s) => s.latestChangePct);

  const instrument = INSTRUMENT_GROUPS.flatMap((g) => g.items).find(
    (i) => i.symbol === symbol,
  );

  const tone =
    price == null
      ? "text-foreground-dim"
      : change != null && change >= 0
        ? "text-bull"
        : "text-bear";

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b border-border px-6">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-medium tracking-tight">
              {instrument?.display ?? symbol}
            </h1>
            <span className="text-xs text-foreground-muted">
              {instrument?.name ?? "—"}
            </span>
          </div>

          <div className="mt-0.5 flex items-baseline gap-2.5">
            <span className="font-mono text-sm tabular-nums text-foreground">
              {formatPrice(symbol, price)}
            </span>
            <span className={cn("font-mono text-[11px] tabular-nums", tone)}>
              {formatChange(symbol, change)}
            </span>
            <span className={cn("font-mono text-[11px] tabular-nums", tone)}>
              {formatChangePct(changePct)}
            </span>
          </div>
        </div>

        <TimeframeBar />
      </div>

      <CandlestickChart />
    </main>
  );
}
