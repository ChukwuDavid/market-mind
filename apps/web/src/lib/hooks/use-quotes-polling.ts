"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/stores/market-store";
import { INSTRUMENT_GROUPS } from "@/lib/constants/instruments";

const REFRESH_MS = 3_600_000; // 1 hour

/**
 * Polls /api/quotes for all watchlist symbols on a fixed interval.
 * Pauses when the tab is hidden, kicks off an immediate refresh on return.
 */
export function useQuotesPolling() {
  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    const symbols = INSTRUMENT_GROUPS.flatMap((g) =>
      g.items.map((i) => i.symbol),
    );

    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/quotes?symbols=${symbols.join(",")}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          quotes: Record<
            string,
            { price: number; change: number; changePct: number }
          >;
        };
        if (cancelled) return;
        useMarketStore.getState().setQuotes(body.quotes);
      } catch {
        // Silent fail — next cycle will retry
      }
    };

    const start = () => {
      if (intervalId !== null) return;
      intervalId = window.setInterval(fetchAll, REFRESH_MS);
    };

    const stop = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchAll(); // immediate refresh on return
        start();
      } else {
        stop();
      }
    };

    // Initial fetch + start if visible
    fetchAll();
    if (document.visibilityState === "visible") start();

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
