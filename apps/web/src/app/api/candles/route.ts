import { NextRequest, NextResponse } from "next/server";
import { fetchCandles, type Timeframe } from "@/lib/market-data";

const VALID_TIMEFRAMES: Timeframe[] = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1H",
  "4H",
  "1D",
  "1W",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") as Timeframe | null;
  const limitParam = searchParams.get("limit");

  // ─── Validation ──────────────────────────────────────
  if (!symbol) {
    return NextResponse.json(
      { error: "symbol parameter is required" },
      { status: 400 },
    );
  }

  if (!timeframe || !VALID_TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json(
      { error: `timeframe must be one of: ${VALID_TIMEFRAMES.join(", ")}` },
      { status: 400 },
    );
  }

  const limit = limitParam
    ? Math.min(Math.max(1, parseInt(limitParam, 10)), 1000)
    : 200;

  // ─── Fetch ───────────────────────────────────────────
  try {
    const result = await fetchCandles({ symbol, timeframe, limit });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
