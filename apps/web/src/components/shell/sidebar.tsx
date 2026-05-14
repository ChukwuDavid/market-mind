"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  INSTRUMENT_GROUPS,
  DEFAULT_SYMBOL,
  type Instrument,
} from "@/lib/constants/instruments";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [selected, setSelected] = useState<string>(DEFAULT_SYMBOL);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
          Watchlist
        </h2>
        <button
          aria-label="Add asset"
          className="text-foreground-dim transition-colors hover:text-foreground"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Groups */}
      <div className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        {INSTRUMENT_GROUPS.map((group) => (
          <Group
            key={group.id}
            label={group.label}
            items={group.items}
            selected={selected}
            onSelect={setSelected}
          />
        ))}
      </div>
    </aside>
  );
}

interface GroupProps {
  label: string;
  items: Instrument[];
  selected: string;
  onSelect: (symbol: string) => void;
}

function Group({ label, items, selected, onSelect }: GroupProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
          {label}
        </span>
        <span className="font-mono text-[10px] text-foreground-dim/60">
          {items.length}
        </span>
      </div>
      <div>
        {items.map((item) => (
          <Row
            key={item.symbol}
            item={item}
            active={selected === item.symbol}
            onClick={() => onSelect(item.symbol)}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  item,
  active,
  onClick,
}: {
  item: Instrument;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors",
        active
          ? "bg-primary-soft/40 ring-1 ring-primary/30"
          : "hover:bg-white/4",
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium tracking-tight">
          {item.display}
        </div>
        <div className="truncate text-[11px] text-foreground-dim">
          {item.name}
        </div>
      </div>
      <div className="ml-3 shrink-0 text-right">
        <div className="font-mono text-[11px] text-foreground-dim">—</div>
        <div className="font-mono text-[10px] text-foreground-dim">—</div>
      </div>
    </button>
  );
}
