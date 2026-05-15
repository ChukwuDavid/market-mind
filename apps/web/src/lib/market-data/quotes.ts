import { toTwelveDataSymbol } from "./symbol-mapping";

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  previousClose: number;
}

interface RawQuote {
  status?: string;
  close?: string;
  change?: string;
  percent_change?: string;
  previous_close?: string;
}

/**
 * Fetch quotes for many symbols in one batched call.
 * Twelve Data accepts comma-separated symbols — 1 credit per symbol.
 */
export async function fetchQuotes(
  symbols: string[],
  apiKey: string,
): Promise<Record<string, Quote>> {
  if (symbols.length === 0) return {};

  // Build reverse mapping so we can convert TD symbols back to ours
  const tdToOurs = new Map<string, string>();
  for (const s of symbols) tdToOurs.set(toTwelveDataSymbol(s), s);

  const tdSymbols = symbols.map(toTwelveDataSymbol).join(",");

  const url = new URL("https://api.twelvedata.com/quote");
  url.searchParams.set("symbol", tdSymbols);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Quotes HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const result: Record<string, Quote> = {};

  // For >1 symbol, response is keyed by Twelve Data symbol.
  // For 1 symbol, response IS the quote (no wrapper).
  if (symbols.length === 1) {
    const ours = symbols[0];
    if (data.status !== "error" && data.close) {
      result[ours] = parseQuote(ours, data);
    }
  } else {
    for (const [tdSymbol, raw] of Object.entries(data) as [
      string,
      RawQuote,
    ][]) {
      const ours = tdToOurs.get(tdSymbol);
      if (!ours || raw.status === "error" || !raw.close) continue;
      result[ours] = parseQuote(ours, raw);
    }
  }

  return result;
}

function parseQuote(symbol: string, raw: RawQuote): Quote {
  return {
    symbol,
    price: parseFloat(raw.close ?? "0"),
    change: parseFloat(raw.change ?? "0"),
    changePct: parseFloat(raw.percent_change ?? "0"),
    previousClose: parseFloat(raw.previous_close ?? "0"),
  };
}
