-- ═══════════════════════════════════════════════════════════════════
-- Market Mind · Initial Schema
-- Applied manually via Supabase Dashboard SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: assets
-- The instrument registry. Seeded once, referenced by everything else.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.assets (
  symbol         text primary key,
  display_name   text not null,
  full_name      text not null,
  category       text not null check (category in (
                   'forex-majors', 'forex-minors', 'crypto',
                   'indices', 'commodities', 'stocks'
                 )),
  data_provider  text not null default 'twelvedata',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists assets_category_idx on public.assets (category);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: candles
-- OHLCV cache. Composite PK avoids dupes per symbol+timeframe+time.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.candles (
  symbol      text not null references public.assets(symbol) on delete cascade,
  timeframe   text not null check (timeframe in (
                '1m','5m','15m','30m','1H','4H','1D','1W'
              )),
  open_time   timestamptz not null,
  open        numeric(20,8) not null,
  high        numeric(20,8) not null,
  low         numeric(20,8) not null,
  close       numeric(20,8) not null,
  volume      numeric(24,8),
  created_at  timestamptz not null default now(),
  primary key (symbol, timeframe, open_time)
);

create index if not exists candles_lookup_idx on public.candles (symbol, timeframe, open_time desc);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: news
-- Headlines from Finnhub + FinBERT sentiment classification.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.news (
  id                uuid primary key default uuid_generate_v4(),
  external_id       text unique,
  source            text not null,
  headline          text not null,
  summary           text,
  url               text not null,
  image_url         text,
  published_at      timestamptz not null,
  categories        text[],
  related_symbols   text[],
  sentiment         text check (sentiment in ('positive','neutral','negative')),
  sentiment_score   numeric(4,3),
  classified_at     timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists news_published_idx   on public.news (published_at desc);
create index if not exists news_symbols_gin_idx on public.news using gin (related_symbols);
create index if not exists news_categories_idx  on public.news using gin (categories);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: analysis_runs
-- One row per Analyze-button click.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.analysis_runs (
  id                  uuid primary key default uuid_generate_v4(),
  category            text not null,
  symbols             text[] not null,
  status              text not null check (status in (
                        'queued','running','completed','failed'
                      )),
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  duration_ms         integer,
  runpod_request_id   text,
  error_message       text,
  signals_generated   integer not null default 0
);

create index if not exists runs_started_idx on public.analysis_runs (started_at desc);
create index if not exists runs_status_idx  on public.analysis_runs (status);

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: signals
-- AI-generated trade ideas + outcome tracking columns.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.signals (
  id                       uuid primary key default uuid_generate_v4(),
  run_id                   uuid references public.analysis_runs(id) on delete cascade,
  symbol                   text not null references public.assets(symbol),
  timeframe                text not null,

  side                     text not null check (side in ('buy','sell')),
  order_type               text not null check (order_type in (
                             'market','buy-stop','sell-stop',
                             'buy-limit','sell-limit'
                           )),
  entry                    numeric(20,8) not null,
  stop_loss                numeric(20,8) not null,
  take_profit_1            numeric(20,8) not null,
  take_profit_2            numeric(20,8),
  take_profit_3            numeric(20,8),
  risk_reward              numeric(6,2),

  confidence               numeric(5,2) not null check (confidence between 0 and 100),
  reasoning                text not null,
  invalidation_condition   text,
  technical_score          numeric(5,2),
  fundamental_score        numeric(5,2),
  sentiment_score          numeric(5,2),
  macro_score              numeric(5,2),

  status                   text not null default 'open' check (status in (
                             'open','win','loss','expired','invalidated'
                           )),
  generated_at             timestamptz not null default now(),
  expires_at               timestamptz,

  closed_at                timestamptz,
  exit_price               numeric(20,8),
  pnl_pips                 numeric(12,2),
  pnl_percent              numeric(8,4),
  last_evaluated_at        timestamptz
);

create index if not exists signals_symbol_idx     on public.signals (symbol, generated_at desc);
create index if not exists signals_status_idx    on public.signals (status, generated_at desc);
create index if not exists signals_run_idx        on public.signals (run_id);
create index if not exists signals_confidence_idx on public.signals (confidence desc);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════
alter table public.assets         enable row level security;
alter table public.candles        enable row level security;
alter table public.news           enable row level security;
alter table public.analysis_runs  enable row level security;
alter table public.signals        enable row level security;

drop policy if exists "anon read assets"        on public.assets;
drop policy if exists "anon read candles"       on public.candles;
drop policy if exists "anon read news"          on public.news;
drop policy if exists "anon read analysis_runs" on public.analysis_runs;
drop policy if exists "anon read signals"       on public.signals;

create policy "anon read assets"        on public.assets        for select to anon, authenticated using (true);
create policy "anon read candles"       on public.candles       for select to anon, authenticated using (true);
create policy "anon read news"          on public.news          for select to anon, authenticated using (true);
create policy "anon read analysis_runs" on public.analysis_runs for select to anon, authenticated using (true);
create policy "anon read signals"       on public.signals       for select to anon, authenticated using (true);

-- ═══════════════════════════════════════════════════════════════════
-- SEED: assets — all 26 MVP instruments. Idempotent.
-- ═══════════════════════════════════════════════════════════════════
insert into public.assets (symbol, display_name, full_name, category, data_provider) values
  ('EURUSD','EUR/USD','Euro / US Dollar','forex-majors','twelvedata'),
  ('GBPUSD','GBP/USD','British Pound / US Dollar','forex-majors','twelvedata'),
  ('USDJPY','USD/JPY','US Dollar / Japanese Yen','forex-majors','twelvedata'),
  ('USDCHF','USD/CHF','US Dollar / Swiss Franc','forex-majors','twelvedata'),
  ('AUDUSD','AUD/USD','Australian Dollar / US Dollar','forex-majors','twelvedata'),
  ('USDCAD','USD/CAD','US Dollar / Canadian Dollar','forex-majors','twelvedata'),
  ('NZDUSD','NZD/USD','New Zealand Dollar / US Dollar','forex-majors','twelvedata'),
  ('EURGBP','EUR/GBP','Euro / British Pound','forex-minors','twelvedata'),
  ('EURJPY','EUR/JPY','Euro / Japanese Yen','forex-minors','twelvedata'),
  ('GBPJPY','GBP/JPY','British Pound / Japanese Yen','forex-minors','twelvedata'),
  ('EURCHF','EUR/CHF','Euro / Swiss Franc','forex-minors','twelvedata'),
  ('AUDJPY','AUD/JPY','Australian Dollar / Japanese Yen','forex-minors','twelvedata'),
  ('GBPCAD','GBP/CAD','British Pound / Canadian Dollar','forex-minors','twelvedata'),
  ('BTCUSD','BTC/USD','Bitcoin','crypto','twelvedata'),
  ('ETHUSD','ETH/USD','Ethereum','crypto','twelvedata'),
  ('SOLUSD','SOL/USD','Solana','crypto','twelvedata'),
  ('SPX','SPX 500','S&P 500','indices','twelvedata'),
  ('NDX','NAS 100','Nasdaq 100','indices','twelvedata'),
  ('DJI','DOW 30','Dow Jones Industrial','indices','twelvedata'),
  ('XAUUSD','Gold','Gold / US Dollar','commodities','twelvedata'),
  ('WTIUSD','Oil (WTI)','WTI Crude Oil','commodities','alphavantage'),
  ('AAPL','AAPL','Apple Inc.','stocks','twelvedata'),
  ('MSFT','MSFT','Microsoft Corp.','stocks','twelvedata'),
  ('NVDA','NVDA','NVIDIA Corp.','stocks','twelvedata'),
  ('TSLA','TSLA','Tesla Inc.','stocks','twelvedata'),
  ('AMZN','AMZN','Amazon.com Inc.','stocks','twelvedata')
on conflict (symbol) do nothing;