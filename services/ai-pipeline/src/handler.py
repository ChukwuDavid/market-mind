"""
RunPod Serverless entry point.

Cold start: instantiates the LLM and sentiment classifier once.
Warm calls: reuses both in-process.

Environment variables:
    MOCK_LLM=1         -> use MockLLMClient instead of vLLM
    MOCK_SENTIMENT=1   -> use MockSentimentClassifier instead of FinBERT
    LLM_MODEL=...      -> override the vLLM model name
"""

from __future__ import annotations
import asyncio
import os
import time
from datetime import datetime, timezone

from .schemas import AnalysisRequest, AnalysisResponse, Signal, SkippedSymbol
from .indicators import build_snapshot
from .trigger_gate import evaluate
from .agents import analyze_symbol
from .llm_client import LLMClient, MockLLMClient, VLLMClient
from .sentiment import SentimentClassifier, MockSentimentClassifier, FinBERTClassifier


_llm: LLMClient | None = None
_sentiment: SentimentClassifier | None = None


def _get_llm() -> LLMClient:
    global _llm
    if _llm is None:
        if os.getenv("MOCK_LLM", "0") == "1":
            _llm = MockLLMClient()
        else:
            model = os.getenv("LLM_MODEL", "meta-llama/Meta-Llama-3.1-8B-Instruct")
            _llm = VLLMClient(model=model)
    return _llm


def _get_sentiment() -> SentimentClassifier:
    global _sentiment
    if _sentiment is None:
        if os.getenv("MOCK_SENTIMENT", "0") == "1":
            _sentiment = MockSentimentClassifier()
        else:
            _sentiment = FinBERTClassifier()
    return _sentiment


async def run_analysis(request: AnalysisRequest) -> AnalysisResponse:
    started = time.time()

    llm = _get_llm()
    sentiment = _get_sentiment()

    scored_news = sentiment.classify(request.news)

    signals: list[Signal] = []
    skipped: list[SkippedSymbol] = []
    candidates: list[tuple] = []

    # Phase 1: deterministic filter
    for sym_input in request.symbols:
        snapshot = build_snapshot(sym_input.symbol, sym_input.timeframe, sym_input.candles)
        if snapshot is None:
            skipped.append(SkippedSymbol(symbol=sym_input.symbol, reason="insufficient_data"))
            continue

        gate = evaluate(snapshot)
        if not gate.passed:
            skipped.append(SkippedSymbol(symbol=sym_input.symbol, reason=gate.reason or "no_setup"))
            continue

        candidates.append((snapshot, gate))

    # Phase 2: parallel LLM analysis on the survivors
    tasks = [
        analyze_symbol(llm, snapshot, gate, scored_news, request.market_context)
        for snapshot, gate in candidates
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for (snapshot, _), result in zip(candidates, results):
        if isinstance(result, Exception):
            skipped.append(SkippedSymbol(symbol=snapshot.symbol, reason=f"error: {result}"))
        elif result is None:
            skipped.append(SkippedSymbol(symbol=snapshot.symbol, reason="hold_decision"))
        else:
            signals.append(result)

    return AnalysisResponse(
        run_id=request.run_id,
        signals=signals,
        skipped=skipped,
        duration_ms=int((time.time() - started) * 1000),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


def handler(event: dict) -> dict:
    """RunPod Serverless handler. event = {'input': {<AnalysisRequest fields>}}."""
    input_data = event.get("input", {})
    request = AnalysisRequest.model_validate(input_data)
    response = asyncio.run(run_analysis(request))
    return response.model_dump(mode="json")