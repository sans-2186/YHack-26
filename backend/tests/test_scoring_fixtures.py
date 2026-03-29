"""Golden-style fixtures for scoring helpers (deterministic inputs)."""

from __future__ import annotations

from app.scoring.fallback import fallback_recommendation
from app.scoring.scores import (
    score_bias_risk,
    score_financial,
    score_political_risk,
    score_sentiment_bundle,
)


def test_score_financial_fixture() -> None:
    metrics = {
        "pe_ratio": 15.0,
        "debt_to_equity": 0.5,
        "market_cap_usd": 1_000_000_000_000.0,
        "revenue_ttm_usd": 100_000_000_000.0,
    }
    s = score_financial(metrics, "Strong quarter.")
    assert 0 <= s.score_0_100 <= 100
    assert s.label == "strong"
    assert s.quality == "high"


def test_score_sentiment_fixture() -> None:
    titles = [
        "Company beats earnings expectations",
        "Analysts upgrade outlook after strong growth",
    ]
    s, pols, spread = score_sentiment_bundle(titles)
    assert len(pols) == 2
    assert s.score_0_100 >= 50
    assert 0 <= spread <= 1


def test_score_bias_risk_diverse_sources() -> None:
    items = [
        {"title": "A", "source": "Reuters"},
        {"title": "B", "source": "Bloomberg"},
        {"title": "C", "source": "WSJ"},
        {"title": "D", "source": "FT"},
    ]
    s = score_bias_risk(items)
    assert s.score_0_100 < 40  # low concentration risk


def test_score_political_sec_headline() -> None:
    items = [{"title": "SEC investigation into accounting practices widens", "source": "Reuters"}]
    s = score_political_risk(items)
    assert s.score_0_100 > 15


def test_fallback_end_to_end_fixture() -> None:
    fin = score_financial(
        {"pe_ratio": 14, "debt_to_equity": 0.4, "market_cap_usd": 2e12},
        "Solid",
    )
    sent, _, _ = score_sentiment_bundle(["Profit beat", "Strong guidance"])
    br = score_bias_risk(
        [
            {"title": "x", "source": "A"},
            {"title": "y", "source": "B"},
        ]
    )
    pol = score_political_risk([{"title": "Routine earnings recap", "source": "CNBC"}])
    fb = fallback_recommendation(fin, sent, br, pol, ticker="TEST")
    assert fb.label in ("Invest", "Risky", "Avoid")
    assert 0 <= fb.composite_0_100 <= 100
    assert 0.05 <= fb.confidence <= 0.95
