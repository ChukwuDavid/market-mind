"""
LLM client abstraction.

- MockLLMClient: keyword-driven canned responses. Runs anywhere.
- VLLMClient: real vLLM batched inference. Lazy-imports vllm so this module
  is importable without GPU/vllm installed.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
import asyncio
import json
import re
from typing import Any


class LLMClient(ABC):
    @abstractmethod
    async def complete(self, system: str, user: str, max_tokens: int = 512) -> str: ...

    @abstractmethod
    async def complete_batch(
        self, prompts: list[tuple[str, str]], max_tokens: int = 512
    ) -> list[str]: ...


def extract_json(text: str) -> dict[str, Any]:
    """Pull the first JSON object out of an LLM response. Resilient to markdown fences and prose preambles."""
    text = re.sub(r"```(?:json)?", "", text).strip("` \n")
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object in response: {text[:200]}")
    return json.loads(text[start : end + 1])


class MockLLMClient(LLMClient):
    """Returns canned JSON responses driven by keywords in the user prompt."""

    async def complete(self, system: str, user: str, max_tokens: int = 512) -> str:
        await asyncio.sleep(0.005)  # Mimic latency

        u = user.lower()

        if "technical setup" in u:
            direction = (
                "bullish" if "BULLISH" in user
                else "bearish" if "BEARISH" in user
                else "neutral"
            )
            return json.dumps({
                "direction": direction,
                "conviction": 70,
                "key_support": 0,
                "key_resistance": 0,
                "summary": f"Indicators align {direction}; momentum confirms.",
                "risks": "A close beyond the key level invalidates the bias.",
            })

        if "fundamental backdrop" in u:
            return json.dumps({
                "direction": "neutral",
                "conviction": 50,
                "summary": "Mixed macro signals; no clear fundamental edge.",
            })

        if "news sentiment" in u:
            return json.dumps({
                "direction": "bullish",
                "conviction": 60,
                "dominant_themes": ["risk_on", "central_bank_dovishness"],
                "summary": "Headlines lean constructive; risk appetite firm.",
            })

        if "macro context" in u:
            return json.dumps({
                "regime": "mixed",
                "direction": "neutral",
                "conviction": 50,
                "summary": "Cross-asset signals are split; no clear regime.",
            })

        if "trade thesis" in u:
            side = (
                "buy" if "BULLISH" in user
                else "sell" if "BEARISH" in user
                else "hold"
            )
            return json.dumps({
                "side": side,
                "confidence": 72,
                "reasoning": (
                    "Technical and sentiment specialists align with the bias. "
                    "Fundamental and macro signals are neutral, providing no headwind."
                ),
                "invalidation_condition": "A break of the recent swing level invalidates the thesis.",
            })

        return json.dumps({"error": "unknown_prompt"})

    async def complete_batch(
        self, prompts: list[tuple[str, str]], max_tokens: int = 512
    ) -> list[str]:
        return await asyncio.gather(*(self.complete(s, u, max_tokens) for s, u in prompts))


class VLLMClient(LLMClient):
    """Production vLLM client. Lazy-imports vllm. Initialized once per worker, reused thereafter."""

    def __init__(self, model: str = "meta-llama/Meta-Llama-3.1-8B-Instruct", **kwargs):
        from vllm import LLM, SamplingParams  # type: ignore

        self._llm = LLM(model=model, **kwargs)
        self._SamplingParams = SamplingParams

    def _format_prompt(self, system: str, user: str) -> str:
        """Llama 3.1 chat template."""
        return (
            "<|begin_of_text|>"
            "<|start_header_id|>system<|end_header_id|>\n\n"
            f"{system}<|eot_id|>"
            "<|start_header_id|>user<|end_header_id|>\n\n"
            f"{user}<|eot_id|>"
            "<|start_header_id|>assistant<|end_header_id|>\n\n"
        )

    async def complete(self, system: str, user: str, max_tokens: int = 512) -> str:
        prompt = self._format_prompt(system, user)
        params = self._SamplingParams(temperature=0.3, top_p=0.9, max_tokens=max_tokens)
        outputs = self._llm.generate([prompt], params)
        return outputs[0].outputs[0].text

    async def complete_batch(
        self, prompts: list[tuple[str, str]], max_tokens: int = 512
    ) -> list[str]:
        formatted = [self._format_prompt(s, u) for s, u in prompts]
        params = self._SamplingParams(temperature=0.3, top_p=0.9, max_tokens=max_tokens)
        outputs = self._llm.generate(formatted, params)
        return [o.outputs[0].text for o in outputs]