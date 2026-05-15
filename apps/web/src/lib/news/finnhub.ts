export type NewsCategory = "general" | "forex" | "crypto" | "merger";

export interface NewsItem {
  id: string;
  source: string;
  headline: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  publishedAt: number; // Unix seconds
  category: string;
  relatedSymbols: string[];
}

interface FinnhubRaw {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export async function fetchFinnhubNews(
  category: NewsCategory,
  apiKey: string,
): Promise<NewsItem[]> {
  const url = new URL("https://finnhub.io/api/v1/news");
  url.searchParams.set("category", category);
  url.searchParams.set("token", apiKey);

  const res = await fetch(url, {
    next: { revalidate: 600 }, // Cache for 10 min — news isn't real-time-critical
  });

  if (!res.ok) {
    throw new Error(`Finnhub HTTP ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as FinnhubRaw[];

  return data.map((item) => ({
    id: String(item.id),
    source: item.source,
    headline: item.headline,
    summary: item.summary,
    url: item.url,
    imageUrl: item.image || null,
    publishedAt: item.datetime,
    category: item.category,
    relatedSymbols: item.related ? item.related.split(",").filter(Boolean) : [],
  }));
}
