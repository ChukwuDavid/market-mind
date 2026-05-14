"use client";

import { useState } from "react";
import { Newspaper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "news" | "signals";

export function RightRail() {
  const [tab, setTab] = useState<Tab>("news");

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-border bg-background">
      <div className="flex h-12 border-b border-border">
        <TabButton
          active={tab === "news"}
          onClick={() => setTab("news")}
          icon={<Newspaper size={14} />}
          label="News"
          count="—"
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
        {tab === "news" ? <NewsPanel /> : <SignalsPanel />}
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

function NewsPanel() {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
          Phase 7
        </div>
        <div className="text-xs leading-relaxed text-foreground-muted">
          News feed wires up here — Finnhub headlines, FinBERT sentiment,
          filtered by category.
        </div>
      </div>
    </div>
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
        <div className="mx-auto max-w-[240px] text-xs leading-relaxed text-foreground-muted">
          Click <span className="text-foreground">Analyze</span> in the top bar
          to generate signals for a market group.
        </div>
      </div>
    </div>
  );
}
