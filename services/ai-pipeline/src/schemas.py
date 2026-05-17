"""
Pydantic schemas for the AI pipeline.

Every shape that crosses the service boundary lives here.
"""

from __future__ import annotations
from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


# --------- Inputs ----------


class CandleData(BaseModel):
    """A single OHLCV bar."""
    model_config = ConfigDict(frozen=True)

    time: int  # Unix seconds (bar open time)
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


class NewsItem(BaseModel):
    """A news headline with optional metadata and a sentiment score (filled in by FinBERT in Phase 8.2)."""
    headline: str
    summary: str = ""
    source: str = ""
    published_at: int  # Unix seconds
    related_symbols: list[str] = Field(default_factory=list)
    sentiment_score: float | None = None  # -1.0 (bearish) to +1.0 (bullish), set by FinBERT


class SymbolInput(BaseModel):
    """Per-symbol input: primary timeframe candles, optional higher-timeframe confirmation."""
    symbol: str
    timeframe: str = "1h"  # Primary timeframe label, e.g. "1h" or "4h"
    candles: list[CandleData]
    candles_htf: list[CandleData] | None = None  # Higher-timeframe context (optional)


CategoryLiteral = Literal["forex_majors", "forex_minors", "crypto", "commodities", "stocks"]


class AnalysisRequest(BaseModel):
    """The full request from /api/analyze to RunPod."""
    run_id: str
    category: CategoryLiteral
    symbols: list[SymbolInput]
    news: list[NewsItem] = Field(default_factory=list)
    market_context: dict[str, float] = Field(default_factory=dict)
    # market_context examples: {"DXY": 104.5, "VIX": 18.2, "US10Y_yield": 4.45}


# --------- Internal: technical snapshot ----------


TrendDirection = Literal["bullish", "bearish", "neutral"]
Momentum = Literal["bullish", "bearish", "neutral"]


class TechnicalSnapshot(BaseModel):
    """Indicator readings for one symbol. Used by trigger gate AND fed into LLM prompts."""
    symbol: str
    timeframe: str

    last_close: float
    last_high: float
    last_low: float

    rsi_14: float
    macd_line: float
    macd_signal: float
    macd_histogram: float

    ema_20: float
    ema_50: float
    ema_200: float | None

    atr_14: float
    volatility_pct: float

    bb_upper: float
    bb_middle: float
    bb_lower: float

    trend_direction: TrendDirection
    momentum: Momentum

    recent_swing_high: float
    recent_swing_low: float


class TriggerGateResult(BaseModel):
    """Output of the deterministic pre-LLM filter."""
    symbol: str
    passed: bool
    aligned_signals: list[str]
    reason: str | None = None
    snapshot: TechnicalSnapshot


# --------- Outputs ----------


class SignalSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, Enum):
    MARKET = "market"
    BUY_STOP = "buy_stop"
    SELL_STOP = "sell_stop"
    BUY_LIMIT = "buy_limit"
    SELL_LIMIT = "sell_limit"


class Signal(BaseModel):
    """A trade signal — what the synthesis agent emits."""
    symbol: str
    side: SignalSide
    order_type: OrderType
    confidence: int = Field(ge=0, le=100)

    entry: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: float | None = None
    take_profit_3: float | None = None
    risk_reward: float

    timeframe: str

    technical_summary: str
    fundamental_summary: str | None = None
    sentiment_summary: str
    macro_summary: str | None = None

    reasoning: str
    invalidation_condition: str


class SkippedSymbol(BaseModel):
    """A symbol that was filtered out before LLM analysis."""
    symbol: str
    reason: str  # "no_setup" | "insufficient_alignment" | "no_clear_trend" | "insufficient_data"


class AnalysisResponse(BaseModel):
    """Final payload returned to /api/analyze."""
    run_id: str
    signals: list[Signal]
    skipped: list[SkippedSymbol]
    duration_ms: int
    timestamp: str  # ISO 8601