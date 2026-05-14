import { Search, Settings, ChevronDown } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-6 border-b border-border bg-background/80 px-5 backdrop-blur-md">
      {/* Logo block */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/4 ring-1 ring-white/8">
          <LogoMark size={18} />
        </div>
        <span className="text-sm font-medium tracking-tight">Market Mind</span>
      </div>

      {/* Search */}
      <div className="ml-2 flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground-muted">
        <Search size={14} className="text-foreground-dim" />
        <span className="flex-1">Search markets...</span>
        <kbd className="rounded-sm border border-border-strong px-1.5 py-0.5 font-mono text-[10px] text-foreground-dim">
          ⌘K
        </kbd>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        <AnalyzeButton />
        <button
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-white/4 hover:text-foreground"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}

function AnalyzeButton() {
  return (
    <button
      type="button"
      className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_rgb(245_185_66/0.4),0_8px_24px_-8px_rgb(245_185_66/0.5)] transition-colors hover:bg-primary/90"
    >
      <span>Analyze</span>
      <ChevronDown size={14} className="opacity-70" />
    </button>
  );
}
