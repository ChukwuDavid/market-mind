"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/time-ago";
import { cn } from "@/lib/utils";

type Tab = "news" | "signals";
type FinnhubCategory = "general" | "forex" | "crypto";

interface NewsItem {
  id: string;
  source: string;
  headline: string;
  url: string;
  publishedAt: number;
  imageUrl: string | null;
  relatedSymbols: string[];
}

export function RightRail() {
  const [tab, setTab] = useState<Tab>("news");
  const category: FinnhubCategory = "general";

  // Single resolved-data holder. setState only ever runs inside fetch callbacks.
  const [resolved, setResolved] = useState<{
    tick: number;
    news: NewsItem[];
    error: string | null;
  } | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const tick = refreshTick;

    fetch(`/api/news?category=${category}`, { cache: "no-store" })
      .then((res) =>
        res.json().then((body) => ({ ok: res.ok, status: res.status, body })),
      )
      .then(({ ok, status, body }) => {
        if (cancelled) return;
        if (!ok) {
          setResolved({
            tick,
            news: [],
            error: body.error ?? `HTTP ${status}`,
          });
        } else {
          setResolved({ tick, news: body.news, error: null });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setResolved({ tick, news: [], error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  // Loading is DERIVED — true until the most recent refresh tick resolves.
  const loading = resolved === null || resolved.tick !== refreshTick;
  const news = resolved?.news ?? [];
  const error = loading ? null : (resolved?.error ?? null);

  return (
    <aside className="flex w-90 shrink-0 flex-col border-l border-border bg-background">
      <div className="flex h-12 border-b border-border">
        <TabButton
          active={tab === "news"}
          onClick={() => setTab("news")}
          icon={<Newspaper size={14} />}
          label="News"
          count={loading ? "…" : news.length > 0 ? String(news.length) : "—"}
        />
        <TabButton
          active={tab === "signals"}
          onClick={() => setTab("signals")}
          icon={<Sparkles size={14} />}
          label="Signals"
          count="0"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "news" ? (
          <NewsPanel
            news={news}
            loading={loading}
            error={error}
            category={category}
            onRefresh={refresh}
          />
        ) : (
          <SignalsPanel />
        )}
      </div>
    </aside>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: string;
}

function TabButton({ active, onClick, icon, label, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 border-b-2 text-xs font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-foreground-muted hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
      <span className="font-mono text-[10px] text-foreground-dim">{count}</span>
    </button>
  );
}

interface NewsPanelProps {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  category: FinnhubCategory;
  onRefresh: () => void;
}

function NewsPanel({
  news,
  loading,
  error,
  category,
  onRefresh,
}: NewsPanelProps) {
  return (
    <div>
      <div className="flex h-9 items-center justify-between border-b border-border px-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
          {category}
        </span>
        <button
          onClick={onRefresh}
          aria-label="Refresh news"
          disabled={loading}
          className="text-foreground-dim transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="p-4">
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-bear">
              Failed to load
            </div>
            <div className="text-xs text-foreground-muted">{error}</div>
          </div>
        </div>
      )}

      {loading && news.length === 0 && (
        <div className="space-y-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="mb-2 h-3 w-32 animate-pulse rounded bg-white/4" />
              <div className="mb-1 h-4 animate-pulse rounded bg-white/8" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/8" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="p-4">
          <div className="rounded-lg border border-border bg-surface p-6 text-center text-xs text-foreground-muted">
            No headlines right now.
          </div>
        </div>
      )}

      <div className="space-y-2.5 px-4 py-3">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border border-border bg-surface p-3.5 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-foreground-muted">
            {item.source}
          </span>
          <span className="text-foreground-dim/40">·</span>
          <span className="shrink-0 font-mono text-[10px] text-foreground-dim">
            {formatTimeAgo(item.publishedAt)}
          </span>
        </div>
        <ExternalLink
          size={11}
          className="shrink-0 text-foreground-dim transition-colors group-hover:text-foreground-muted"
        />
      </div>
      <h3 className="text-[13px] leading-snug text-foreground transition-colors group-hover:text-primary">
        {item.headline}
      </h3>
    </a>
  );
}

function SignalsPanel() {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <Sparkles size={20} className="mx-auto mb-3 text-foreground-dim" />
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
          No signals yet
        </div>
        <div className="mx-auto max-w-60 text-xs leading-relaxed text-foreground-muted">
          Click <span className="text-foreground">Analyze</span> in the top bar
          to generate signals for a market group.
        </div>
      </div>
    </div>
  );
}
