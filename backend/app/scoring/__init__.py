"""Deterministic scoring pipeline (fundamentals, sentiment, bias risk, political risk)."""

from app.scoring.fallback import FallbackRecommendation, fallback_recommendation
from app.scoring.political_tags import political_weighted_hits, tag_headline
from app.scoring.probabilities import verdict_probabilities
from app.scoring.scores import (
    ComponentScore,
    score_bias_risk,
    score_financial,
    score_political_risk,
    score_sentiment_bundle,
)

__all__ = [
    "ComponentScore",
    "FallbackRecommendation",
    "fallback_recommendation",
    "political_weighted_hits",
    "score_bias_risk",
    "score_financial",
    "score_political_risk",
    "score_sentiment_bundle",
    "tag_headline",
    "verdict_probabilities",
]
