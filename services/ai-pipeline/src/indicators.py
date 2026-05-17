"""
Technical indicator computation. Pure pandas + numpy — no external TA library.
"""

from __future__ import annotations
import pandas as pd
import numpy as np

from .schemas import CandleData, TechnicalSnapshot, TrendDirection, Momentum


# --------- Indicator primitives ---------


def _ema(series: pd.Series, length: int) -> pd.Series:
    """Exponential moving average."""
    return series.ewm(span=length, adjust=False).mean()


def _rsi(series: pd.Series, length: int = 14) -> pd.Series:
    """Relative Strength Index using Wilder's smoothing."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / length, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / length, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _macd(
    series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Returns (macd_line, signal_line, histogram)."""
    fast_ema = _ema(series, fast)
    slow_ema = _ema(series, slow)
    macd_line = fast_ema - slow_ema
    signal_line = _ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def _atr(
    high: pd.Series, low: pd.Series, close: pd.Series, length: int = 14
) -> pd.Series:
    """Average True Range (Wilder's smoothing)."""
    prev_close = close.shift(1)
    tr = pd.concat(
        [
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return tr.ewm(alpha=1 / length, adjust=False).mean()


def _bollinger(
    series: pd.Series, length: int = 20, num_std: float = 2.0
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Returns (upper, middle, lower) Bollinger Bands."""
    middle = series.rolling(length).mean()
    std = series.rolling(length).std()
    upper = middle + std * num_std
    lower = middle - std * num_std
    return upper, middle, lower


# --------- Pipeline ---------


def candles_to_dataframe(candles: list[CandleData]) -> pd.DataFrame:
    """Convert raw candle list to a time-indexed pandas DataFrame."""
    df = pd.DataFrame(
        [
            {
                "time": c.time,
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
            }
            for c in candles
        ]
    )
    if df.empty:
        return df
    df["datetime"] = pd.to_datetime(df["time"], unit="s", utc=True)
    df = df.set_index("datetime").sort_index()
    return df


def _add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Append indicator columns."""
    df = df.copy()

    df["ema_20"] = _ema(df["close"], 20)
    df["ema_50"] = _ema(df["close"], 50)
    df["ema_200"] = _ema(df["close"], 200)

    df["rsi_14"] = _rsi(df["close"], 14)

    macd_line, macd_signal, macd_hist = _macd(df["close"])
    df["macd_line"] = macd_line
    df["macd_signal"] = macd_signal
    df["macd_histogram"] = macd_hist

    df["atr_14"] = _atr(df["high"], df["low"], df["close"], 14)

    bb_upper, bb_middle, bb_lower = _bollinger(df["close"], 20, 2.0)
    df["bb_upper"] = bb_upper
    df["bb_middle"] = bb_middle
    df["bb_lower"] = bb_lower

    return df


def _classify_trend(row: pd.Series) -> TrendDirection:
    close = row["close"]
    ema20 = row.get("ema_20")
    ema50 = row.get("ema_50")
    if pd.isna(ema20) or pd.isna(ema50):
        return "neutral"
    if close > ema20 > ema50:
        return "bullish"
    if close < ema20 < ema50:
        return "bearish"
    return "neutral"


def _classify_momentum(row: pd.Series) -> Momentum:
    rsi_val = row.get("rsi_14")
    macd_hist = row.get("macd_histogram")
    if pd.isna(rsi_val) or pd.isna(macd_hist):
        return "neutral"
    if rsi_val > 55 and macd_hist > 0:
        return "bullish"
    if rsi_val < 45 and macd_hist < 0:
        return "bearish"
    return "neutral"


def _safe_float(val, fallback: float = 0.0) -> float:
    try:
        if val is None or pd.isna(val):
            return fallback
        return float(val)
    except (TypeError, ValueError):
        return fallback


def build_snapshot(
    symbol: str, timeframe: str, candles: list[CandleData]
) -> TechnicalSnapshot | None:
    """Compute a full technical snapshot. Returns None if insufficient data."""
    if len(candles) < 50:
        return None

    df = candles_to_dataframe(candles)
    if df.empty:
        return None

    df = _add_indicators(df)
    last = df.iloc[-1]

    if pd.isna(last.get("ema_20")) or pd.isna(last.get("rsi_14")):
        return None

    swing_lookback = df.tail(50)
    close = _safe_float(last["close"])
    atr_val = _safe_float(last.get("atr_14"))

    return TechnicalSnapshot(
        symbol=symbol,
        timeframe=timeframe,
        last_close=close,
        last_high=_safe_float(last["high"]),
        last_low=_safe_float(last["low"]),
        rsi_14=_safe_float(last["rsi_14"]),
        macd_line=_safe_float(last.get("macd_line")),
        macd_signal=_safe_float(last.get("macd_signal")),
        macd_histogram=_safe_float(last.get("macd_histogram")),
        ema_20=_safe_float(last["ema_20"]),
        ema_50=_safe_float(last["ema_50"], fallback=close),
        ema_200=(
            _safe_float(last["ema_200"])
            if not pd.isna(last.get("ema_200"))
            else None
        ),
        atr_14=atr_val,
        volatility_pct=(atr_val / close * 100.0) if close > 0 else 0.0,
        bb_upper=_safe_float(last.get("bb_upper"), fallback=close),
        bb_middle=_safe_float(last.get("bb_middle"), fallback=close),
        bb_lower=_safe_float(last.get("bb_lower"), fallback=close),
        trend_direction=_classify_trend(last),
        momentum=_classify_momentum(last),
        recent_swing_high=_safe_float(swing_lookback["high"].max()),
        recent_swing_low=_safe_float(swing_lookback["low"].min()),
    )