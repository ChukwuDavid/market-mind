import { NextRequest, NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/market-data/quotes";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json(
      { error: "symbols parameter is required" },
      { status: 400 },
    );
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (symbols.length === 0 || symbols.length > 50) {
    return NextResponse.json(
      { error: "between 1 and 50 symbols required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TWELVE_DATA_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const quotes = await fetchQuotes(symbols, apiKey);
    return NextResponse.json({
      quotes,
      count: Object.keys(quotes).length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/quotes] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
