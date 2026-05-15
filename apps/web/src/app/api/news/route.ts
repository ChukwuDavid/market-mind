import { NextRequest, NextResponse } from "next/server";
import { fetchFinnhubNews, type NewsCategory } from "@/lib/news/finnhub";

const VALID: NewsCategory[] = ["general", "forex", "crypto", "merger"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") ?? "general") as NewsCategory;

  if (!VALID.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID.join(", ")}` },
      { status: 400 },
    );
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const news = await fetchFinnhubNews(category, apiKey);
    return NextResponse.json({
      news: news.slice(0, 30), // Cap at 30 items
      category,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/news] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
