"""Reference implementations for Signal AI layer — copy into backend/app/services/ai/."""

from .events import build_events
from .fallback_engine import FallbackRecommendation, fallback_recommendation
from .political_tags import tag_headline
from .scores import (
    ComponentScore,
    score_bias_risk,
    score_financial,
    score_political_risk,
    score_sentiment_bundle,
)

__all__ = [
    "FallbackRecommendation",
    "build_events",
    "ComponentScore",
    "fallback_recommendation",
    "score_bias_risk",
    "score_financial",
    "score_political_risk",
    "score_sentiment_bundle",
    "tag_headline",
]
