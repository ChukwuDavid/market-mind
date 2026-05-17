"""
Format snapshots and news into compact strings the LLM will consume.
Keeping these compact = lower token cost per analysis.
"""

from .schemas import TechnicalSnapshot, NewsItem, TriggerGateResult


def format_snapshot_block(snapshot: TechnicalSnapshot) -> str:
    """Compact technical summary for a single symbol."""
    return (
        f"SYMBOL: {snapshot.symbol} ({snapshot.timeframe})\n"
        f"Price: {snapshot.last_close:.5f} | Range last bar: {snapshot.last_low:.5f}-{snapshot.last_high:.5f}\n"
        f"Trend: {snapshot.trend_direction.upper()} "
        f"(EMA20={snapshot.ema_20:.5f}, EMA50={snapshot.ema_50:.5f}"
        + (f", EMA200={snapshot.ema_200:.5f}" if snapshot.ema_200 is not None else "")
        + ")\n"
        f"Momentum: {snapshot.momentum.upper()} "
        f"(RSI14={snapshot.rsi_14:.1f}, MACD_hist={snapshot.macd_histogram:.6f})\n"
        f"Volatility: ATR14={snapshot.atr_14:.5f} ({snapshot.volatility_pct:.2f}% of price)\n"
        f"Bollinger: lower={snapshot.bb_lower:.5f}, mid={snapshot.bb_middle:.5f}, upper={snapshot.bb_upper:.5f}\n"
        f"Recent swing: low={snapshot.recent_swing_low:.5f}, high={snapshot.recent_swing_high:.5f}"
    )


def format_gate_summary(result: TriggerGateResult) -> str:
    """Why the gate let this symbol through — feeds into the technical agent."""
    signals = ", ".join(result.aligned_signals) if result.aligned_signals else "none"
    return f"Aligned signals ({len(result.aligned_signals)}): {signals}"


def format_news_block(
    news: list[NewsItem], symbol: str | None = None, max_items: int = 8
) -> str:
    """
    Compact news block. Items mentioning the symbol (in related_symbols or
    in the headline base currency) are surfaced first.
    """
    if not news:
        return "No relevant news available."

    if symbol:
        base = symbol[:3].upper()
        relevant = [
            n for n in news if symbol in n.related_symbols or base in n.headline.upper()
        ]
        relevant_ids = {id(n) for n in relevant}
        others = [n for n in news if id(n) not in relevant_ids]
        ordered = relevant + others
    else:
        ordered = list(news)

    items = ordered[:max_items]
    lines: list[str] = []
    for n in items:
        sentiment = ""
        if n.sentiment_score is not None:
            tag = "bull" if n.sentiment_score > 0.2 else "bear" if n.sentiment_score < -0.2 else "neutral"
            sentiment = f" [{tag} {n.sentiment_score:+.2f}]"
        lines.append(f"- [{n.source}]{sentiment} {n.headline}")

    return "\n".join(lines)


def format_market_context(context: dict[str, float]) -> str:
    """Render cross-asset macro context for the macro agent."""
    if not context:
        return "No macro context available."
    return "\n".join(f"- {k}: {v:.4f}" for k, v in context.items())