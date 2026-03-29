"""Deterministic Invest / Risky / Avoid from fouress 0-100 component scores."""

from __future__ import annotations

from dataclasses import dataclass

from .scores import ComponentScore


@dataclass
class FallbackRecommendation:
    label: str  # Invest | Risky | Avoid
    confidence: float
    summary_reasoning: str
    bull_case: str
    bear_case: str
    key_risks: list[str]
    key_drivers: list[str]
    composite_0_100: float


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def fallback_recommendation(
    financial: ComponentScore,
    sentiment: ComponentScore,
    bias_risk: ComponentScore,
    political: ComponentScore,
    *,
    ticker: str = "",
) -> FallbackRecommendation:
    F = financial.score_0_100
    S = sentiment.score_0_100
    b_adj = 100.0 - bias_risk.score_0_100
    p_adj = 100.0 - political.score_0_100

    composite = 0.35 * F + 0.25 * S + 0.20 * b_adj + 0.20 * p_adj

    if political.score_0_100 >= 60 and composite >= 62:
        composite = min(composite, 58.0)
    if bias_risk.score_0_100 >= 70:
        composite = min(composite, 58.0)

    if composite >= 62:
        label = "Invest"
    elif composite >= 42:
        label = "Risky"
    else:
        label = "Avoid"

    confidences = (
        financial.confidence,
        sentiment.confidence,
        bias_risk.confidence,
        political.confidence,
    )
    base_conf = abs(composite - 50.0) / 50.0
    confidence = _clamp(base_conf, 0.35, 0.85) * min(confidences)

    driver_vals: list[tuple[str, float]] = [
        ("Fundamentals strength", F),
        ("Headline sentiment", S),
        ("Source diversity (low bias risk)", b_adj),
        ("Policy/perception stability", p_adj),
    ]
    driver_vals.sort(key=lambda x: abs(x[1] - 50.0), reverse=True)
    key_drivers = [f"{name}: {val:.0f}/100" for name, val in driver_vals[:2]]

    key_risks: list[str] = []
    if political.score_0_100 >= 45:
        key_risks.append("Regulatory, policy, or controversy narratives in recent headlines.")
    if bias_risk.score_0_100 >= 50:
        key_risks.append("Narrow or one-sided media coverage may skew perception.")
    if sentiment.quality == "low":
        key_risks.append("Thin headline sample; sentiment signal is noisy.")
    if financial.quality == "low":
        key_risks.append("Incomplete fundamentals; valuation view is uncertain.")
    if not key_risks:
        key_risks.append("Residual model risk—this is demo decision-support only.")

    bull = (
        f"Weighted scores lean constructive (composite {composite:.0f}/100): "
        f"financials {financial.label}, sentiment {sentiment.label}."
    )
    bear = (
        f"Watch bias_risk={bias_risk.score_0_100:.0f} and political_risk={political.score_0_100:.0f} "
        f"— perception and policy can dominate short-term moves."
    )
    summary = (
        f"Fallback engine for {ticker or 'ticker'}: {label} based on fundamentals, sentiment, "
        f"media diversity, and policy/perception scan (no LLM)."
    )

    return FallbackRecommendation(
        label=label,
        confidence=round(_clamp(confidence, 0.05, 0.9), 3),
        summary_reasoning=summary,
        bull_case=bull,
        bear_case=bear,
        key_risks=key_risks[:5],
        key_drivers=key_drivers,
        composite_0_100=round(composite, 1),
    )
