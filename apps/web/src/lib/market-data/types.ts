/**
 * Canonical timeframes — match the database CHECK constraint.
 */
export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D" | "1W";

/**
 * Chart-ready candle.
 * `time` is Unix seconds (TradingView Lightweight Charts native format).
 */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface CandleQuery {
  symbol: string;
  timeframe: Timeframe;
  limit?: number;
}

export interface CandleResponse {
  symbol: string;
  timeframe: Timeframe;
  data: Candle[];
  source: string;
  fetchedAt: string;
}
