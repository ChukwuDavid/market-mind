import type { Candle, CandleQuery, Timeframe } from "./types";

/**
 * Map our canonical timeframes to Twelve Data's interval names.
 */
const TIMEFRAME_MAP: Record<Timeframe, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1H": "1h",
  "4H": "4h",
  "1D": "1day",
  "1W": "1week",
};

/**
 * Normalize canonical symbols to Twelve Data's expected format.
 * Twelve Data uses "EUR/USD" not "EURUSD", "BTC/USD" not "BTCUSD", etc.
 */
function toTwelveDataSymbol(symbol: string): string {
  // Forex pairs (6 letters, e.g. EURUSD → EUR/USD)
  if (/^[A-Z]{6}$/.test(symbol)) {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  // Gold
  if (symbol === "XAUUSD") return "XAU/USD";
  // Oil (WTI) — Twelve Data symbol
  if (symbol === "WTIUSD") return "USOIL";
  // Indices, Stocks — pass through (SPX, NDX, DJI, AAPL, etc.)
  return symbol;
}

interface TwelveDataResponse {
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
  }>;
  status?: string;
  message?: string;
}

export async function fetchTwelveDataCandles(
  query: CandleQuery,
  apiKey: string,
): Promise<Candle[]> {
  const interval = TIMEFRAME_MAP[query.timeframe];
  const symbol = toTwelveDataSymbol(query.symbol);
  const limit = query.limit ?? 200;

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(limit));
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url, {
    next: { revalidate: 30 }, // Cache identical requests for 30s
  });

  if (!res.ok) {
    throw new Error(`Twelve Data HTTP ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as TwelveDataResponse;

  if (data.status === "error" || !data.values) {
    throw new Error(`Twelve Data: ${data.message ?? "no data returned"}`);
  }

  // Twelve Data returns newest-first. Reverse to chronological (oldest-first).
  return data.values
    .map((v) => ({
      time: Math.floor(new Date(`${v.datetime}Z`).getTime() / 1000),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
      volume: v.volume ? Number(v.volume) : null,
    }))
    .reverse();
}
