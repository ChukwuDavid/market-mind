"use client";

import { toTwelveDataSymbol } from "./symbol-mapping";

export type WSStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface TickEvent {
  symbol: string; // Canonical symbol (e.g., "EURUSD")
  price: number; // Current price
  timestamp: number; // Unix seconds
}

interface MarketWebSocketOptions {
  apiKey: string;
  onTick: (tick: TickEvent) => void;
  onStatusChange?: (status: WSStatus) => void;
  onError?: (message: string) => void;
}

/**
 * Persistent WebSocket to Twelve Data's price stream.
 * Manages subscribe/unsubscribe, heartbeat, and exponential reconnect.
 */
export class MarketWebSocket {
  private ws: WebSocket | null = null;
  private currentSymbol: string | null = null; // canonical (EURUSD)
  private currentWsSymbol: string | null = null; // mapped (EUR/USD)
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private status: WSStatus = "idle";

  constructor(private opts: MarketWebSocketOptions) {}

  connect() {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return;

    this.setStatus("connecting");
    const url = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.opts.apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus("connected");
      this.startHeartbeat();
      // Resubscribe to current symbol after reconnect
      if (this.currentWsSymbol) this.sendSubscribe(this.currentWsSymbol);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as {
          event?: string;
          symbol?: string;
          price?: number;
          timestamp?: number;
          status?: string;
          messages?: string[];
        };

        if (msg.event === "price" && typeof msg.price === "number") {
          this.opts.onTick({
            symbol: this.currentSymbol ?? msg.symbol ?? "",
            price: msg.price,
            timestamp: msg.timestamp ?? Math.floor(Date.now() / 1000),
          });
        } else if (msg.event === "subscribe-status" && msg.status === "error") {
          this.opts.onError?.(msg.messages?.join("; ") ?? "Subscribe failed");
        }
      } catch {
        // ignore unparseable messages
      }
    };

    this.ws.onerror = () => this.setStatus("error");

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.setStatus("disconnected");
      this.scheduleReconnect();
    };
  }

  /** Switch the active subscription. Unsubscribes the previous symbol. */
  subscribe(symbol: string) {
    const wsSymbol = toTwelveDataSymbol(symbol);

    if (this.currentWsSymbol && this.currentWsSymbol !== wsSymbol) {
      this.sendUnsubscribe(this.currentWsSymbol);
    }

    this.currentSymbol = symbol;
    this.currentWsSymbol = wsSymbol;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(wsSymbol);
    }
  }

  disconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN && this.currentWsSymbol) {
        this.sendUnsubscribe(this.currentWsSymbol);
      }
      this.ws.close();
      this.ws = null;
    }
  }

  private sendSubscribe(wsSymbol: string) {
    this.ws?.send(
      JSON.stringify({
        action: "subscribe",
        params: { symbols: wsSymbol },
      }),
    );
  }

  private sendUnsubscribe(wsSymbol: string) {
    this.ws?.send(
      JSON.stringify({
        action: "unsubscribe",
        params: { symbols: wsSymbol },
      }),
    );
  }

  private startHeartbeat() {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: "heartbeat" }));
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectAttempts++;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private setStatus(status: WSStatus) {
    if (this.status === status) return;
    this.status = status;
    this.opts.onStatusChange?.(status);
  }
}
