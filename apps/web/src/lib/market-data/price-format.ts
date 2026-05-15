const FOREX_4D = new Set([
  "EURUSD",
  "GBPUSD",
  "USDCHF",
  "AUDUSD",
  "USDCAD",
  "NZDUSD",
  "EURGBP",
  "EURCHF",
  "GBPCAD",
]);
const JPY_PAIRS = new Set(["USDJPY", "EURJPY", "GBPJPY", "AUDJPY"]);

/**
 * Decimal precision and minimum move per symbol.
 * Forex non-JPY: 4 (pip), JPY pairs: 2 (pip), everything else: 2.
 */
export function getPriceFormat(symbol: string) {
  if (JPY_PAIRS.has(symbol)) return { precision: 2, minMove: 0.01 };
  if (FOREX_4D.has(symbol)) return { precision: 4, minMove: 0.0001 };
  return { precision: 2, minMove: 0.01 };
}

export function formatPrice(
  symbol: string,
  price: number | null | undefined,
): string {
  if (price == null) return "—";
  return price.toFixed(getPriceFormat(symbol).precision);
}

export function formatChange(
  symbol: string,
  change: number | null | undefined,
): string {
  if (change == null) return "—";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(getPriceFormat(symbol).precision)}`;
}

export function formatChangePct(pct: number | null | undefined): string {
  if (pct == null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}
