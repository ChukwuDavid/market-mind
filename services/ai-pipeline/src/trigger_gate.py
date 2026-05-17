"""
Trigger gate — deterministic filter deciding whether to spend LLM tokens on
a symbol. The rule of thumb: at least two indicators must agree on direction.
"""

from .schemas import TechnicalSnapshot, TriggerGateResult


def evaluate(snapshot: TechnicalSnapshot) -> TriggerGateResult:
    """Return a pass/fail result with the list of aligned signals."""
    aligned: list[str] = []
    bias = snapshot.trend_direction

    if bias == "neutral":
        return TriggerGateResult(
            symbol=snapshot.symbol,
            passed=False,
            aligned_signals=[],
            reason="no_clear_trend",
            snapshot=snapshot,
        )

    aligned.append(f"trend_{bias}")

    if snapshot.momentum == bias:
        aligned.append(f"momentum_{bias}")

    # MACD direction
    if bias == "bullish" and snapshot.macd_histogram > 0:
        aligned.append("macd_bullish")
    elif bias == "bearish" and snapshot.macd_histogram < 0:
        aligned.append("macd_bearish")

    # EMA20/50 cross
    if bias == "bullish" and snapshot.ema_20 > snapshot.ema_50:
        aligned.append("ema_cross_bullish")
    elif bias == "bearish" and snapshot.ema_20 < snapshot.ema_50:
        aligned.append("ema_cross_bearish")

    # RSI in productive zone (not exhausted to the wrong side)
    if bias == "bullish" and 40 <= snapshot.rsi_14 <= 70:
        aligned.append("rsi_healthy_bullish")
    elif bias == "bearish" and 30 <= snapshot.rsi_14 <= 60:
        aligned.append("rsi_healthy_bearish")

    passed = len(aligned) >= 2

    return TriggerGateResult(
        symbol=snapshot.symbol,
        passed=passed,
        aligned_signals=aligned,
        reason=None if passed else "insufficient_alignment",
        snapshot=snapshot,
    )