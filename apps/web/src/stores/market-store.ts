import { create } from "zustand";
import type { Timeframe } from "@/lib/market-data";

export interface Quote {
  price: number;
  change: number;
  changePct: number;
}

interface MarketState {
  symbol: string;
  timeframe: Timeframe;

  // Main chart's live readout
  latestPrice: number | null;
  latestChange: number | null;
  latestChangePct: number | null;

  // Sidebar — all symbols, refreshed via REST polling
  quotes: Record<string, Quote>;
  quotesUpdatedAt: number | null; // Unix ms

  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setLatest: (price: number, change: number, changePct: number) => void;
  setQuotes: (quotes: Record<string, Quote>) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  symbol: "EURUSD",
  timeframe: "1H",
  latestPrice: null,
  latestChange: null,
  latestChangePct: null,
  quotes: {},
  quotesUpdatedAt: null,

  setSymbol: (symbol) =>
    set({
      symbol,
      latestPrice: null,
      latestChange: null,
      latestChangePct: null,
    }),

  setTimeframe: (timeframe) => set({ timeframe }),

  setLatest: (latestPrice, latestChange, latestChangePct) =>
    set({ latestPrice, latestChange, latestChangePct }),

  setQuotes: (newQuotes) =>
    set((state) => ({
      // Merge so partial failures don't wipe known quotes
      quotes: { ...state.quotes, ...newQuotes },
      quotesUpdatedAt: Date.now(),
    })),
}));
