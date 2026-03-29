"""Component scores 0-100 + metadata. Hackathon heuristics — tune weights after real data."""

from __future__ import annotations

from dataclasses import dataclass
from statistics import pstdev
from typing import Any


@dataclass
class ComponentScore:
    score_0_100: float
    label: str
    rationale: str
    confidence: float = 0.75
    quality: str = "medium"  # high | medium | low


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def score_financial(metrics: dict[str, Any], summary: str = "") -> ComponentScore:
    """Higher = better fundamentals vs. simple rules of thumb."""
    pe = metrics.get("pe_ratio")
    d2e = metrics.get("debt_to_equity")
    mcap = metrics.get("market_cap_usd")
    rev = metrics.get("revenue_ttm_usd")

    present = sum(1 for k in (pe, d2e, mcap, rev) if k is not None)
    quality = "high" if present >= 3 else "medium" if present >= 2 else "low"
    base = 55.0

    if pe is not None:
        if pe < 0 or pe > 60:
            base = 38.0
        elif 8 <= pe <= 28:
            base = 72.0
        elif pe < 8:
            base = 62.0
        else:
            base = 52.0

    adj = 0.0
    if d2e is not None:
        if d2e < 0.6:
            adj += 10
        elif d2e > 2.0:
            adj -= 15
        elif d2e > 1.2:
            adj -= 6

    if mcap is not None and mcap >= 5_000_000_000:
        adj += 5

    score = _clamp(base + adj, 0, 100)
    conf = 0.85 if quality == "high" else 0.65 if quality == "medium" else 0.45

    if quality == "low":
        conf *= 0.7

    if score >= 72:
        label = "strong"
    elif score >= 45:
        label = "mixed"
    else:
        label = "weak"

    rationale = f"Financials: PE/valuation band and balance-sheet heuristic ({quality} data completeness)."
    if summary:
        rationale = f"{rationale} Snapshot: {summary[:120]}".strip()

    return ComponentScore(
        score_0_100=round(score, 1),
        label=label,
        rationale=rationale,
        confidence=round(_clamp(conf, 0, 1), 3),
        quality=quality,
    )


def _headline_polarity(title: str) -> float:
    """Match sentiment_stub style: simple token hit rate -> approx [-1, 1]."""
    pos = "beat growth strong profit win upgrade outlook gain rally recovery success".split()
    neg = "lawsuit sec fine miss layoff warning decline debt probe crash loss cut".split()
    t = title.lower()
    p = sum(1 for w in pos if w in t)
    n = sum(1 for w in neg if w in t)
    if p == n == 0:
        return 0.0
    return _clamp((p - n) * 0.25, -1.0, 1.0)


def score_sentiment_bundle(titles: list[str]) -> tuple[ComponentScore, list[float], float]:
    """
    Returns (aggregate sentiment score 0-100 bullish=high), per-title polarities, spread.
    """
    if not titles:
        sc = ComponentScore(
            score_0_100=50.0,
            label="mixed",
            rationale="No headlines; sentiment neutral by default.",
            confidence=0.25,
            quality="low",
        )
        return sc, [], 0.0

    pol = [_headline_polarity(t) for t in titles]
    avg = sum(pol) / len(pol)
    spread = pstdev(pol) if len(pol) > 1 else 0.0
    score = round(50 + 50 * _clamp(avg, -1, 1), 1)
    nfac = _clamp(len(titles) / 8.0, 0.35, 1.0)
    conf = (1.0 - min(0.5, spread)) * nfac

    if score >= 62:
        label = "bullish"
    elif score >= 38:
        label = "mixed"
    else:
        label = "weak"

    rationale = (
        f"Headline tone averages {avg:+.2f} on a rough keyword polarity index; "
        f"spread={spread:.2f} across {len(titles)} items."
    )
    return (
        ComponentScore(
            score_0_100=score,
            label=label,
            rationale=rationale,
            confidence=round(_clamp(conf, 0, 1), 3),
            quality="high" if len(titles) >= 8 else "medium" if len(titles) >= 4 else "low",
        ),
        pol,
        spread,
    )


def score_bias_risk(
    items: list[dict[str, Any]],
) -> ComponentScore:
    """Higher score = higher risk from media concentration / one-sided leaning."""
    sources = [str(i.get("source") or "").strip() for i in items if i.get("source")]
    distinct = len(set(sources)) if sources else 0
    leanings = [str(i.get("outlet_leaning") or "").lower().strip() for i in items]
    lean_known = [x for x in leanings if x in ("left", "right", "center")]

    risk = 15.0
    if distinct <= 1:
        risk += 40
    elif distinct == 2:
        risk += 25
    elif distinct == 3:
        risk += 15
    else:
        risk += 5

    if lean_known:
        frac_same = max(
            lean_known.count("left"),
            lean_known.count("right"),
            lean_known.count("center"),
        ) / len(lean_known)
        if frac_same >= 0.7:
            risk += 20

    risk = _clamp(risk, 0, 100)
    if risk >= 65:
        label = "high"
    elif risk >= 35:
        label = "moderate"
    else:
        label = "low"

    rationale = (
        f"Media lens: {distinct or 0} distinct outlets in sample; "
        f"leaning concentration adjusted when `outlet_leaning` present."
    )
    return ComponentScore(
        score_0_100=round(risk, 1),
        label=label,
        rationale=rationale,
        confidence=0.7 if distinct >= 2 else 0.5,
        quality="medium",
    )


def score_political_risk(
    items: list[dict[str, Any]],
) -> ComponentScore:
    """Higher = more regulatory / geopolitical / controversy exposure in headlines."""
    from .political_tags import political_weighted_hits

    raw = 0.0
    for i in items:
        title = str(i.get("title") or "")
        raw += political_weighted_hits(title)

    score = _clamp(18.0 * raw, 0, 100)
    if score >= 55:
        label = "elevated"
    elif score >= 20:
        label = "moderate"
    else:
        label = "low"

    n = len(items)
    if n >= 8:
        conf = 0.8
    elif n >= 4:
        conf = 0.6
    else:
        conf = 0.4

    rationale = (
        f"Policy/perception scan over {n} headlines weighted toward regulation, antitrust, "
        f"tariffs, sanctions, macro, and leadership controversy keywords."
    )
    qual = "high" if n >= 8 else "medium" if n >= 4 else "low"
    return ComponentScore(
        score_0_100=round(score, 1),
        label=label,
        rationale=rationale,
        confidence=round(conf, 3),
        quality=qual,
    )