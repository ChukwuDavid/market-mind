"use client";

import { getPriceFormat } from "@/lib/market-data/price-format";
import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  createSeriesMarkers,
  TickMarkType,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { Maximize2 } from "lucide-react";
import { useMarketStore } from "@/stores/market-store";
import type { Candle, Timeframe } from "@/lib/market-data";
import {
  MarketWebSocket,
  type TickEvent,
  type WSStatus,
} from "@/lib/market-data/websocket";

type Status = "idle" | "loading" | "ready" | "empty" | "error";

function getRecentBars(tf: Timeframe): number {
  switch (tf) {
    case "1m":
      return 240;
    case "5m":
      return 144;
    case "15m":
      return 96;
    case "30m":
      return 48;
    case "1H":
      return 48;
    case "4H":
      return 42;
    case "1D":
      return 30;
    case "1W":
      return 13;
  }
}

function getTimeframeSeconds(tf: Timeframe): number {
  switch (tf) {
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    case "30m":
      return 1800;
    case "1H":
      return 3600;
    case "4H":
      return 14400;
    case "1D":
      return 86400;
    case "1W":
      return 604800;
  }
}

function formatTimeTick(
  time: Time,
  tickMarkType: TickMarkType,
  locale: string,
): string {
  if (typeof time !== "number") return "";
  const d = new Date(time * 1000);

  switch (tickMarkType) {
    case TickMarkType.Year:
      return d.getFullYear().toString();
    case TickMarkType.Month:
      return d.toLocaleDateString(locale, { month: "short" });
    case TickMarkType.DayOfMonth:
      return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    case TickMarkType.Time:
    case TickMarkType.TimeWithSeconds: {
      // Use Date's local-time methods directly — guaranteed user-local timezone
      const h = d.getHours().toString().padStart(2, "0");
      const m = d.getMinutes().toString().padStart(2, "0");
      return `${h}:${m}`;
    }
    default:
      return "";
  }
}

export function CandlestickChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const dataRef = useRef<CandlestickData<UTCTimestamp>[]>([]);
  const updateMarkersRef = useRef<() => void>(() => {});
  const wsRef = useRef<MarketWebSocket | null>(null);

  const symbol = useMarketStore((s) => s.symbol);
  const timeframe = useMarketStore((s) => s.timeframe);

  // Refs let non-reactive callbacks see the latest values
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);

  // Keep refs in sync with the latest values — used by the WS tick handler
  // and the markers updater, which both run outside of React's render cycle.
  useEffect(() => {
    symbolRef.current = symbol;
    timeframeRef.current = timeframe;
  });

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WSStatus>("idle");

  const fitToRecent = () => {
    const chart = chartRef.current;
    if (!chart || dataRef.current.length === 0) return;
    const bars = getRecentBars(timeframe);
    const total = dataRef.current.length;
    chart.timeScale().setVisibleLogicalRange({
      from: Math.max(0, total - bars),
      to: total + 3,
    });
  };

  // ─── 1. Initialize chart (once) ───────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9aa0a6",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255, 255, 255, 0.18)",
          labelBackgroundColor: "#16191d",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.18)",
          labelBackgroundColor: "#16191d",
        },
      },
      rightPriceScale: { borderColor: "rgba(255, 255, 255, 0.05)" },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.05)",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: formatTimeTick,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c486",
      downColor: "#ff6f6f",
      wickUpColor: "#22c486",
      wickDownColor: "#ff6f6f",
      borderVisible: false,
    });

    const markers = createSeriesMarkers<Time>(series, []);

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = markers;

    const updateMarkers = () => {
      const range = chart.timeScale().getVisibleRange();
      const api = markersRef.current;
      if (!range || !api) return;

      const fromT = range.from as UTCTimestamp;
      const toT = range.to as UTCTimestamp;
      const visible = dataRef.current.filter(
        (c) => c.time >= fromT && c.time <= toT,
      );

      if (visible.length === 0) {
        api.setMarkers([]);
        return;
      }

      let highBar = visible[0];
      let lowBar = visible[0];
      for (const c of visible) {
        if (c.high > highBar.high) highBar = c;
        if (c.low < lowBar.low) lowBar = c;
      }

      const fmt = getPriceFormat(symbolRef.current);
      api.setMarkers([
        {
          time: highBar.time,
          position: "aboveBar",
          color: "#22c486",
          shape: "arrowDown",
          text: `H ${highBar.high.toFixed(fmt.precision)}`,
        },
        {
          time: lowBar.time,
          position: "belowBar",
          color: "#ff6f6f",
          shape: "arrowUp",
          text: `L ${lowBar.low.toFixed(fmt.precision)}`,
        },
      ] as SeriesMarker<Time>[]);
    };

    updateMarkersRef.current = updateMarkers;
    chart.timeScale().subscribeVisibleTimeRangeChange(updateMarkers);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(updateMarkers);
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // ─── 2. Per-symbol price format ───────────────────────────────
  useEffect(() => {
    if (!seriesRef.current) return;
    const fmt = getPriceFormat(symbol);
    seriesRef.current.applyOptions({
      priceFormat: {
        type: "price",
        precision: fmt.precision,
        minMove: fmt.minMove,
      },
    });
  }, [symbol]);

  // ─── 3. Fetch + load data ─────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current) return;

    let cancelled = false;
    setStatus("loading");
    setError(null);

    fetch(`/api/candles?symbol=${symbol}&timeframe=${timeframe}&limit=300`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        return body as { data: Candle[] };
      })
      .then((response) => {
        if (cancelled || !seriesRef.current) return;

        if (response.data.length === 0) {
          seriesRef.current.setData([]);
          dataRef.current = [];
          setStatus("empty");
          return;
        }

        const data: CandlestickData<UTCTimestamp>[] = response.data.map(
          (c) => ({
            time: c.time as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }),
        );

        dataRef.current = data;
        seriesRef.current.setData(data);

        // Push initial price + change to the store
        const firstOpen = data[0].open;
        const lastClose = data[data.length - 1].close;
        const change = lastClose - firstOpen;
        const changePct = firstOpen !== 0 ? (change / firstOpen) * 100 : 0;
        useMarketStore.getState().setLatest(lastClose, change, changePct);

        const bars = getRecentBars(timeframe);
        chartRef.current?.timeScale().setVisibleLogicalRange({
          from: Math.max(0, data.length - bars),
          to: data.length + 3,
        });

        setStatus("ready");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe]);

  // ─── 4. WebSocket: connect once ──────────────────────────────
  useEffect(() => {
    const wsKey = process.env.NEXT_PUBLIC_TWELVE_DATA_WS_KEY;
    if (!wsKey) {
      console.warn(
        "[chart] NEXT_PUBLIC_TWELVE_DATA_WS_KEY not set — live ticks disabled",
      );
      return;
    }

    const ws = new MarketWebSocket({
      apiKey: wsKey,
      onStatusChange: setWsStatus,
      onTick: (tick: TickEvent) => {
        const series = seriesRef.current;
        if (!series || dataRef.current.length === 0) return;

        const last = dataRef.current[dataRef.current.length - 1];
        const tfSec = getTimeframeSeconds(timeframeRef.current);
        const nextOpen = (last.time as number) + tfSec;

        if (tick.timestamp >= nextOpen) {
          // New candle for next period
          const fresh: CandlestickData<UTCTimestamp> = {
            time: nextOpen as UTCTimestamp,
            open: tick.price,
            high: tick.price,
            low: tick.price,
            close: tick.price,
          };
          dataRef.current.push(fresh);
          series.update(fresh);
        } else {
          // Update existing candle
          const newHigh = Math.max(last.high, tick.price);
          const newLow = Math.min(last.low, tick.price);
          const updated: CandlestickData<UTCTimestamp> = {
            ...last,
            close: tick.price,
            high: newHigh,
            low: newLow,
          };
          dataRef.current[dataRef.current.length - 1] = updated;
          series.update(updated);

          if (newHigh > last.high || newLow < last.low) {
            updateMarkersRef.current();
          }
        }

        // Update the header's live price + change with this tick
        const firstOpen = dataRef.current[0]?.open;
        if (firstOpen !== undefined && firstOpen !== 0) {
          const change = tick.price - firstOpen;
          const changePct = (change / firstOpen) * 100;
          useMarketStore.getState().setLatest(tick.price, change, changePct);
        }
      },
    });

    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, []);

  // ─── 5. WebSocket: switch subscription on symbol change ──────
  useEffect(() => {
    wsRef.current?.subscribe(symbol);
  }, [symbol]);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top-right controls cluster */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <LiveIndicator status={wsStatus} />

        <button
          type="button"
          onClick={fitToRecent}
          aria-label="Fit chart to recent window"
          title="Fit to recent window"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface/80 text-foreground-muted backdrop-blur transition-colors hover:bg-surface hover:text-foreground"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Loading {symbol} · {timeframe}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="max-w-sm px-6 text-center">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bear">
              Chart Error
            </div>
            <div className="text-sm leading-relaxed text-foreground-muted">
              {error}
            </div>
            <div className="mt-4 font-mono text-[10px] text-foreground-dim">
              {symbol} · {timeframe}
            </div>
          </div>
        </div>
      )}

      {status === "empty" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
              No data available
            </div>
            <div className="text-sm text-foreground-muted">
              {symbol} · {timeframe} returned no candles
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveIndicator({ status }: { status: WSStatus }) {
  const config = {
    connected: { dot: "bg-bull", text: "LIVE", pulse: true },
    connecting: { dot: "bg-warning", text: "CONNECTING", pulse: true },
    disconnected: { dot: "bg-foreground-dim", text: "OFFLINE", pulse: false },
    error: { dot: "bg-bear", text: "ERROR", pulse: false },
    idle: { dot: "bg-foreground-dim", text: "IDLE", pulse: false },
  }[status];

  return (
    <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface/80 px-2.5 backdrop-blur">
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} ${config.pulse ? "animate-pulse" : ""}`}
        aria-hidden
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground-muted">
        {config.text}
      </span>
    </div>
  );
}
