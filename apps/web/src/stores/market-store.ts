import { create } from "zustand";
import type { Timeframe } from "@/lib/market-data";

interface MarketState {
  symbol: string;
  timeframe: Timeframe;
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  symbol: "EURUSD",
  timeframe: "1H",
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
}));
