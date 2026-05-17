"""
Multi-agent orchestration.

Per symbol that passed the trigger gate:
    1. Run 4 specialist agents in parallel (vLLM batched inference is efficient at this)
    2. Pass their outputs into the synthesis agent
    3. Compute entry/SL/TP deterministically
    4. Return a Signal — or None for HOLD / invalid setup
"""

from __future__ import annotations
import asyncio
import json
from typing import Any

from .schemas import (
    TechnicalSnapshot, TriggerGateResult, NewsItem,
    Signal, SignalSide,
)
from .llm_client import LLMClient, extract_json
from .data_prep import (
    format_snapshot_block, format_gate_summary,
    format_news_block, format_market_context,
)
from .signal_math import compute_targets
from .prompts import (
    TECHNICAL_SYSTEM, TECHNICAL_USER_TEMPLATE,
    FUNDAMENTAL_SYSTEM, FUNDAMENTAL_USER_TEMPLATE,
    SENTIMENT_SYSTEM, SENTIMENT_USER_TEMPLATE,
    MACRO_SYSTEM, MACRO_USER_TEMPLATE,
    SYNTHESIS_SYSTEM, SYNTHESIS_USER_TEMPLATE,
)


async def run_specialists(
    llm: LLMClient,
    snapshot: TechnicalSnapshot,
    gate: TriggerGateResult,
    news: list[NewsItem],
    market_context: dict[str, float],
) -> dict[str, Any]:
    """Run all four specialist agents as one batched call. Returns parsed JSON for each."""
    snapshot_block = format_snapshot_block(snapshot)
    news_block = format_news_block(news, symbol=snapshot.symbol)
    macro_block = format_market_context(market_context)
    gate_summary = format_gate_summary(gate)

    prompts = [
        (TECHNICAL_SYSTEM, TECHNICAL_USER_TEMPLATE.format(
            symbol=snapshot.symbol, timeframe=snapshot.timeframe,
            snapshot_block=snapshot_block,
            aligned_count=len(gate.aligned_signals),
            gate_summary=gate_summary,
        )),
        (FUNDAMENTAL_SYSTEM, FUNDAMENTAL_USER_TEMPLATE.format(
            symbol=snapshot.symbol,
            macro_context=macro_block, news_block=news_block,
        )),
        (SENTIMENT_SYSTEM, SENTIMENT_USER_TEMPLATE.format(
            symbol=snapshot.symbol, news_block=news_block,
        )),
        (MACRO_SYSTEM, MACRO_USER_TEMPLATE.format(
            symbol=snapshot.symbol, macro_context=macro_block,
        )),
    ]

    responses = await llm.complete_batch(prompts, max_tokens=400)

    return {
        "technical": _safe_parse(responses[0]),
        "fundamental": _safe_parse(responses[1]),
        "sentiment": _safe_parse(responses[2]),
        "macro": _safe_parse(responses[3]),
    }


def _safe_parse(response: str) -> dict[str, Any]:
    """Parse JSON or fall back to a neutral default if the model misbehaved."""
    try:
        return extract_json(response)
    except (ValueError, json.JSONDecodeError):
        return {"direction": "neutral", "conviction": 50, "summary": "Parse failed."}


async def synthesize(
    llm: LLMClient,
    snapshot: TechnicalSnapshot,
    views: dict[str, Any],
) -> Signal | None:
    """Synthesize a final signal. Returns None for HOLD or invalid math."""
    t = views["technical"]
    f = views["fundamental"]
    s = views["sentiment"]
    m = views["macro"]

    user = SYNTHESIS_USER_TEMPLATE.format(
        symbol=snapshot.symbol,
        timeframe=snapshot.timeframe,
        last_close=f"{snapshot.last_close:.5f}",
        swing_low=f"{snapshot.recent_swing_low:.5f}",
        swing_high=f"{snapshot.recent_swing_high:.5f}",
        atr=f"{snapshot.atr_14:.5f}",
        technical_direction=str(t.get("direction", "neutral")).upper(),
        technical_conviction=t.get("conviction", 50),
        technical_summary=t.get("summary", ""),
        technical_support=t.get("key_support", snapshot.recent_swing_low),
        technical_resistance=t.get("key_resistance", snapshot.recent_swing_high),
        technical_risks=t.get("risks", ""),
        fundamental_direction=str(f.get("direction", "neutral")).upper(),
        fundamental_conviction=f.get("conviction", 50),
        fundamental_summary=f.get("summary", ""),
        sentiment_direction=str(s.get("direction", "neutral")).upper(),
        sentiment_conviction=s.get("conviction", 50),
        sentiment_summary=s.get("summary", ""),
        sentiment_themes=", ".join(s.get("dominant_themes", [])),
        macro_regime=str(m.get("regime", "mixed")).upper(),
        macro_direction=str(m.get("direction", "neutral")).upper(),
        macro_conviction=m.get("conviction", 50),
        macro_summary=m.get("summary", ""),
    )

    response = await llm.complete(SYNTHESIS_SYSTEM, user, max_tokens=500)
    synth = _safe_parse(response)

    side_str = str(synth.get("side", "hold")).lower()
    if side_str not in ("buy", "sell"):
        return None

    side = SignalSide.BUY if side_str == "buy" else SignalSide.SELL
    targets = compute_targets(side, snapshot)
    if targets is None:
        return None

    return Signal(
        symbol=snapshot.symbol,
        side=side,
        order_type=targets["order_type"],
        confidence=int(synth.get("confidence", 50)),
        entry=targets["entry"],
        stop_loss=targets["stop_loss"],
        take_profit_1=targets["take_profit_1"],
        take_profit_2=targets["take_profit_2"],
        take_profit_3=targets["take_profit_3"],
        risk_reward=targets["risk_reward"],
        timeframe=snapshot.timeframe,
        technical_summary=t.get("summary", ""),
        fundamental_summary=f.get("summary", ""),
        sentiment_summary=s.get("summary", ""),
        macro_summary=m.get("summary", ""),
        reasoning=synth.get("reasoning", ""),
        invalidation_condition=synth.get("invalidation_condition", ""),
    )


async def analyze_symbol(
    llm: LLMClient,
    snapshot: TechnicalSnapshot,
    gate: TriggerGateResult,
    news: list[NewsItem],
    market_context: dict[str, float],
) -> Signal | None:
    """Full per-symbol pipeline: specialists → synthesis → signal."""
    views = await run_specialists(llm, snapshot, gate, news, market_context)
    return await synthesize(llm, snapshot, views)