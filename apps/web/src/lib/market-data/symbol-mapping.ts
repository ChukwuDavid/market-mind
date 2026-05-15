/**
 * Map our canonical symbols to Twelve Data's expected format.
 * Used by both REST (server) and WebSocket (browser).
 */
export function toTwelveDataSymbol(symbol: string): string {
  // Forex pairs (6 letters, e.g. EURUSD → EUR/USD)
  if (
    /^[A-Z]{6}$/.test(symbol) &&
    !["BTCUSD", "ETHUSD", "SOLUSD"].includes(symbol)
  ) {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  // Crypto
  if (symbol === "BTCUSD") return "BTC/USD";
  if (symbol === "ETHUSD") return "ETH/USD";
  if (symbol === "SOLUSD") return "SOL/USD";
  // Gold
  if (symbol === "XAUUSD") return "XAU/USD";
  // Oil
  if (symbol === "WTIUSD") return "USOIL";
  // Indices, Stocks — pass through
  return symbol;
}
