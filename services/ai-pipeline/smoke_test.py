"""
End-to-end smoke test for Phase 8.2 — full pipeline with mock LLM and mock
sentiment classifier. No GPU, no network. Runs in seconds.
"""

from __future__ import annotations
import os
import sys
from pathlib import Path

# Mock mode MUST be set before importing handler
os.environ["MOCK_LLM"] = "1"
os.environ["MOCK_SENTIMENT"] = "1"

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import asyncio
import random
import time

from src.schemas import AnalysisRequest, CandleData, NewsItem, SymbolInput
from src.handler import run_analysis


def generate_synthetic_candles(
    symbol: str, n: int = 200, start_price: float = 1.0850, trend: float = 0.0001
) -> list[CandleData]:
    """Generate a synthetic trending price series. Deterministic per symbol."""
    random.seed(symbol)  # Stable across runs, ignores PYTHONHASHSEED
    candles: list[CandleData] = []
    price = start_price
    now = int(time.time())
    for i in range(n):
        change = trend + random.gauss(0, 0.0005)  # Lower noise — trend dominates
        open_p = price
        close_p = max(0.0001, price * (1 + change))
        high_p = max(open_p, close_p) * (1 + abs(random.gauss(0, 0.0003)))
        low_p = min(open_p, close_p) * (1 - abs(random.gauss(0, 0.0003)))
        candles.append(CandleData(
            time=now - (n - i) * 3600,
            open=open_p, high=high_p, low=low_p, close=close_p,
            volume=random.uniform(800, 1200),
        ))
        price = close_p
    return candles


async def main() -> None:
    print("=" * 60)
    print("Market Mind · Phase 8.2 smoke test (full pipeline, mocked)")
    print("=" * 60)

    request = AnalysisRequest(
        run_id="smoke-test-001",
        category="forex_majors",
        symbols=[
            SymbolInput(symbol="EURUSD", timeframe="1h",
                candles=generate_synthetic_candles("EURUSD", start_price=1.0850, trend=0.0001)),
            SymbolInput(symbol="USDJPY", timeframe="1h",
                candles=generate_synthetic_candles("USDJPY", start_price=152.30, trend=-0.0001)),
            SymbolInput(symbol="BTCUSD", timeframe="1h",
                candles=generate_synthetic_candles("BTCUSD", start_price=68500.0, trend=0.0002)),
        ],
        news=[
            NewsItem(headline="Fed signals rate cut path remains intact",
                source="Bloomberg", published_at=int(time.time()) - 1800),
            NewsItem(headline="ECB officials warn against early easing",
                source="Reuters", published_at=int(time.time()) - 7200),
            NewsItem(headline="Bitcoin ETF inflows hit weekly record",
                source="CoinDesk", published_at=int(time.time()) - 3600),
        ],
        market_context={"DXY": 104.5, "VIX": 18.2, "US10Y": 4.45},
    )

    print(f"\nProcessing {len(request.symbols)} symbols...")
    response = await run_analysis(request)

    print(f"\n>>> Results in {response.duration_ms}ms")
    print(f"Signals: {len(response.signals)}")
    print(f"Skipped: {len(response.skipped)}")

    for sig in response.signals:
        print(f"\n--- SIGNAL: {sig.symbol} ---")
        print(f"  {sig.side.value.upper()} ({sig.order_type.value}) @ {sig.entry:.5f}")
        print(f"  Confidence: {sig.confidence}%")
        print(f"  SL: {sig.stop_loss:.5f}")
        print(f"  TP1: {sig.take_profit_1:.5f}")
        print(f"  TP2: {sig.take_profit_2:.5f}")
        print(f"  TP3: {sig.take_profit_3:.5f}")
        print(f"  R/R: 1:{sig.risk_reward}")
        print(f"  Reasoning: {sig.reasoning}")
        print(f"  Invalidation: {sig.invalidation_condition}")

    for sk in response.skipped:
        print(f"\nSKIPPED: {sk.symbol} ({sk.reason})")

    print("\n" + "=" * 60)
    print("Smoke test complete.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())