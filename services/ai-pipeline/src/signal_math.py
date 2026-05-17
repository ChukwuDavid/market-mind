"""
Deterministic entry / stop loss / take profit computation.

LLMs generate the qualitative thesis; this module derives the numbers from
the technical snapshot. Keeps prices anchored, hallucination-free.
"""

from .schemas import TechnicalSnapshot, SignalSide, OrderType


def compute_targets(side: SignalSide, snapshot: TechnicalSnapshot) -> dict | None:
    """
    Compute entry/SL/TP1-3/RR for a directional signal.

    Strategy:
    - Entry at last close (market order)
    - SL: the more conservative of (recent swing + buffer) or 1.5x ATR
    - TPs at 1R / 2R / 3R off the entry
    - Returns None if the math produces an invalid setup
    """
    close = snapshot.last_close
    atr = snapshot.atr_14

    if atr <= 0 or close <= 0:
        return None

    if side == SignalSide.BUY:
        sl_swing = snapshot.recent_swing_low - 0.2 * atr
        sl_atr = close - 1.5 * atr
        stop_loss = min(sl_swing, sl_atr)
        risk = close - stop_loss

        if risk <= 0:
            return None

        tp1 = close + 1.0 * risk
        tp2 = close + 2.0 * risk
        tp3 = close + 3.0 * risk
    else:  # SELL
        sl_swing = snapshot.recent_swing_high + 0.2 * atr
        sl_atr = close + 1.5 * atr
        stop_loss = max(sl_swing, sl_atr)
        risk = stop_loss - close

        if risk <= 0:
            return None

        tp1 = close - 1.0 * risk
        tp2 = close - 2.0 * risk
        tp3 = close - 3.0 * risk

    return {
        "entry": close,
        "stop_loss": stop_loss,
        "take_profit_1": tp1,
        "take_profit_2": tp2,
        "take_profit_3": tp3,
        "risk_reward": 3.0,
        "order_type": OrderType.MARKET,
    }