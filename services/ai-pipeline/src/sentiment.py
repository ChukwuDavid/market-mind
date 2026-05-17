"""
FinBERT sentiment classification for news.

- MockSentimentClassifier: keyword heuristic. Runs anywhere.
- FinBERTClassifier: production HuggingFace transformer. Lazy-loads.
"""

from __future__ import annotations
from abc import ABC, abstractmethod

from .schemas import NewsItem


class SentimentClassifier(ABC):
    @abstractmethod
    def classify(self, news: list[NewsItem]) -> list[NewsItem]: ...


class MockSentimentClassifier(SentimentClassifier):
    """Keyword heuristic — for local testing only."""

    BULLISH = {"surge", "rally", "soar", "gain", "rise", "boost", "record",
               "growth", "dovish", "ease", "inflow", "beat", "strong"}
    BEARISH = {"fall", "plunge", "drop", "decline", "loss", "crash", "fear",
               "warn", "hawkish", "tighten", "outflow", "miss", "weak"}

    def classify(self, news: list[NewsItem]) -> list[NewsItem]:
        out: list[NewsItem] = []
        for item in news:
            if item.sentiment_score is not None:
                out.append(item)
                continue
            text = (item.headline + " " + item.summary).lower()
            bull = sum(1 for w in self.BULLISH if w in text)
            bear = sum(1 for w in self.BEARISH if w in text)
            if bull == 0 and bear == 0:
                score = 0.0
            else:
                score = (bull - bear) / (bull + bear)
            out.append(item.model_copy(update={"sentiment_score": score}))
        return out


class FinBERTClassifier(SentimentClassifier):
    """
    Production FinBERT classifier using ProsusAI/finbert.

    Labels: 0=positive, 1=negative, 2=neutral. We turn class probabilities into
    a continuous score in [-1, 1] via weighted sum.
    """

    def __init__(self, model_name: str = "ProsusAI/finbert"):
        from transformers import AutoTokenizer, AutoModelForSequenceClassification  # type: ignore
        import torch  # type: ignore

        self._tokenizer = AutoTokenizer.from_pretrained(model_name)
        self._model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self._model.eval()
        if torch.cuda.is_available():
            self._model = self._model.cuda()
        self._torch = torch

    def classify(self, news: list[NewsItem]) -> list[NewsItem]:
        if not news:
            return []

        to_score = [(i, item) for i, item in enumerate(news) if item.sentiment_score is None]
        if not to_score:
            return list(news)

        indices = [i for i, _ in to_score]
        texts = [
            (item.headline + ". " + item.summary).strip(". ")
            for _, item in to_score
        ]

        inputs = self._tokenizer(
            texts, padding=True, truncation=True, max_length=512, return_tensors="pt"
        )
        if self._torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}

        with self._torch.no_grad():
            outputs = self._model(**inputs)
            probs = self._torch.softmax(outputs.logits, dim=-1).cpu().numpy()

        scores = [float(p[0] * 1.0 + p[1] * -1.0 + p[2] * 0.0) for p in probs]

        result = list(news)
        for idx, score in zip(indices, scores):
            result[idx] = result[idx].model_copy(update={"sentiment_score": score})
        return result