/**
 * Database types — hand-written to match infra/supabase/migrations/001_initial_schema.sql
 * Update this file when the SQL changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ───────────────────────────────────────────────────────
export type AssetCategory =
  | "forex-majors"
  | "forex-minors"
  | "crypto"
  | "indices"
  | "commodities"
  | "stocks";

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D" | "1W";

export type SignalSide = "buy" | "sell";

export type OrderType =
  | "market"
  | "buy-stop"
  | "sell-stop"
  | "buy-limit"
  | "sell-limit";

export type SignalStatus = "open" | "win" | "loss" | "expired" | "invalidated";

export type NewsSentiment = "positive" | "neutral" | "negative";

export type RunStatus = "queued" | "running" | "completed" | "failed";

// ─── Database shape ──────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          symbol: string;
          display_name: string;
          full_name: string;
          category: AssetCategory;
          data_provider: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          symbol: string;
          display_name: string;
          full_name: string;
          category: AssetCategory;
          data_provider?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          symbol: string;
          display_name: string;
          full_name: string;
          category: AssetCategory;
          data_provider: string;
          is_active: boolean;
          created_at: string;
        }>;
      };

      candles: {
        Row: {
          symbol: string;
          timeframe: Timeframe;
          open_time: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number | null;
          created_at: string;
        };
        Insert: {
          symbol: string;
          timeframe: Timeframe;
          open_time: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume?: number | null;
          created_at?: string;
        };
        Update: Partial<{
          symbol: string;
          timeframe: Timeframe;
          open_time: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number | null;
          created_at: string;
        }>;
      };

      news: {
        Row: {
          id: string;
          external_id: string | null;
          source: string;
          headline: string;
          summary: string | null;
          url: string;
          image_url: string | null;
          published_at: string;
          categories: string[] | null;
          related_symbols: string[] | null;
          sentiment: NewsSentiment | null;
          sentiment_score: number | null;
          classified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          source: string;
          headline: string;
          summary?: string | null;
          url: string;
          image_url?: string | null;
          published_at: string;
          categories?: string[] | null;
          related_symbols?: string[] | null;
          sentiment?: NewsSentiment | null;
          sentiment_score?: number | null;
          classified_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          external_id: string | null;
          source: string;
          headline: string;
          summary: string | null;
          url: string;
          image_url: string | null;
          published_at: string;
          categories: string[] | null;
          related_symbols: string[] | null;
          sentiment: NewsSentiment | null;
          sentiment_score: number | null;
          classified_at: string | null;
          created_at: string;
        }>;
      };

      analysis_runs: {
        Row: {
          id: string;
          category: string;
          symbols: string[];
          status: RunStatus;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          runpod_request_id: string | null;
          error_message: string | null;
          signals_generated: number;
        };
        Insert: {
          id?: string;
          category: string;
          symbols: string[];
          status: RunStatus;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          runpod_request_id?: string | null;
          error_message?: string | null;
          signals_generated?: number;
        };
        Update: Partial<{
          id: string;
          category: string;
          symbols: string[];
          status: RunStatus;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          runpod_request_id: string | null;
          error_message: string | null;
          signals_generated: number;
        }>;
      };

      signals: {
        Row: {
          id: string;
          run_id: string | null;
          symbol: string;
          timeframe: string;
          side: SignalSide;
          order_type: OrderType;
          entry: number;
          stop_loss: number;
          take_profit_1: number;
          take_profit_2: number | null;
          take_profit_3: number | null;
          risk_reward: number | null;
          confidence: number;
          reasoning: string;
          invalidation_condition: string | null;
          technical_score: number | null;
          fundamental_score: number | null;
          sentiment_score: number | null;
          macro_score: number | null;
          status: SignalStatus;
          generated_at: string;
          expires_at: string | null;
          closed_at: string | null;
          exit_price: number | null;
          pnl_pips: number | null;
          pnl_percent: number | null;
          last_evaluated_at: string | null;
        };
        Insert: {
          id?: string;
          run_id?: string | null;
          symbol: string;
          timeframe: string;
          side: SignalSide;
          order_type: OrderType;
          entry: number;
          stop_loss: number;
          take_profit_1: number;
          take_profit_2?: number | null;
          take_profit_3?: number | null;
          risk_reward?: number | null;
          confidence: number;
          reasoning: string;
          invalidation_condition?: string | null;
          technical_score?: number | null;
          fundamental_score?: number | null;
          sentiment_score?: number | null;
          macro_score?: number | null;
          status?: SignalStatus;
          generated_at?: string;
          expires_at?: string | null;
          closed_at?: string | null;
          exit_price?: number | null;
          pnl_pips?: number | null;
          pnl_percent?: number | null;
          last_evaluated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          run_id: string | null;
          symbol: string;
          timeframe: string;
          side: SignalSide;
          order_type: OrderType;
          entry: number;
          stop_loss: number;
          take_profit_1: number;
          take_profit_2: number | null;
          take_profit_3: number | null;
          risk_reward: number | null;
          confidence: number;
          reasoning: string;
          invalidation_condition: string | null;
          technical_score: number | null;
          fundamental_score: number | null;
          sentiment_score: number | null;
          macro_score: number | null;
          status: SignalStatus;
          generated_at: string;
          expires_at: string | null;
          closed_at: string | null;
          exit_price: number | null;
          pnl_pips: number | null;
          pnl_percent: number | null;
          last_evaluated_at: string | null;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
