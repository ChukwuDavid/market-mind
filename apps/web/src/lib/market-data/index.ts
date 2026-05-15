import { fetchTwelveDataCandles } from "./twelve-data";
import type { CandleQuery, CandleResponse } from "./types";

export type { Candle, CandleQuery, CandleResponse, Timeframe } from "./types";

/**
 * Fetch candles for a symbol. Routes to the appropriate provider.
 * (Currently only Twelve Data — Alpha Vantage fallback comes in Part 2.)
 */
export async function fetchCandles(
  query: CandleQuery,
): Promise<CandleResponse> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY is not set in .env.local");
  }

  const data = await fetchTwelveDataCandles(query, apiKey);

  return {
    symbol: query.symbol,
    timeframe: query.timeframe,
    data,
    source: "twelvedata",
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Lightweight reachability check for Twelve Data.
 * Hits the /quote endpoint with EUR/USD — costs 1 credit per ping.
 */
export async function pingTwelveData(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return { ok: false, latencyMs: 0, error: "API key not set" };
  }

  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=EUR/USD&apikey=${apiKey}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    const latencyMs = Date.now() - start;

    if (data.status === "error") {
      return { ok: false, latencyMs, error: data.message };
    }

    return { ok: true, latencyMs };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
