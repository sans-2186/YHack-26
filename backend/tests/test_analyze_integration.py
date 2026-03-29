"""POST /analyze with mocked finance + news (no external APIs)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


FIXTURE_FIN: dict[str, Any] = {
    "ticker": "TEST",
    "name": "Test Co",
    "exchange": "NASDAQ",
    "sector": "Technology",
    "summary": "Fixture company for tests.",
    "metrics": {
        "market_cap_usd": 50_000_000_000.0,
        "pe_ratio": 18.0,
        "revenue_ttm_usd": 80_000_000_000.0,
        "debt_to_equity": 0.9,
    },
    "as_of": datetime.now(UTC),
    "source": "fixture",
}

FIXTURE_NEWS: list[dict[str, Any]] = [
    {
        "title": "Test Co posts strong quarterly revenue growth",
        "url": "https://example.com/1",
        "source": "Reuters",
        "published_at": datetime.now(UTC),
    },
    {
        "title": "Analysts positive on competitive position",
        "url": "https://example.com/2",
        "source": "Bloomberg",
        "published_at": datetime.now(UTC),
    },
    {
        "title": "SEC requests additional disclosures on segment reporting",
        "url": "https://example.com/3",
        "source": "WSJ",
        "published_at": datetime.now(UTC),
    },
]


def test_analyze_mocked_news_and_finance(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    import app.services.analysis_service as svc

    monkeypatch.setattr(
        svc.finance_client,
        "fetch_financials",
        AsyncMock(return_value=FIXTURE_FIN),
    )
    monkeypatch.setattr(
        svc.news_client,
        "fetch_news",
        AsyncMock(return_value=(FIXTURE_NEWS, "fixture")),
    )

    r = client.post("/analyze", json={"query": "TEST", "force_refresh": True})
    assert r.status_code == 200, r.text
    data = r.json()

    assert set(data.keys()) >= {
        "analysis_id",
        "scores",
        "probabilities",
        "polymarket_stub",
        "recommendation",
        "meta",
    }
    for k in ("financial", "sentiment", "bias_risk", "political_risk"):
        block = data["scores"][k]
        assert 0 <= block["score_0_100"] <= 100
        assert block["label"]

    p = data["probabilities"]
    s = p["p_invest"] + p["p_risky"] + p["p_avoid"]
    assert abs(s - 1.0) < 0.001

    assert data["polymarket_stub"]["status"] == "not_integrated"
    assert data["recommendation"]["trail"]["engine"] == "fallback"

    aid = data["analysis_id"]
    r2 = client.get(f"/analyze/{aid}")
    assert r2.status_code == 200
    assert r2.json()["scores"]["financial"]["score_0_100"] == data["scores"]["financial"]["score_0_100"]
