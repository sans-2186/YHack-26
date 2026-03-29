"""Map composite 0–100 score to invest / risky / avoid probability mass (deterministic)."""

from __future__ import annotations

import math

# Anchors tuned so mid-high composites (~58–68) lean invest > risky > avoid (demo-friendly).
# Previous (78, 52, 22) put too much mass on "risky" near composite ~61.
_INVEST_CENTER = 70.0
_RISKY_CENTER = 50.0
_AVOID_CENTER = 24.0
_SOFTMAX_SCALE = 200.0


def verdict_probabilities(composite_0_100: float) -> tuple[float, float, float]:
    """
    Softmax over squared distance to three latent anchors (invest, risky, avoid).
    Returns (p_invest, p_risky, p_avoid) summing to 1.0.
    """
    c = max(0.0, min(100.0, composite_0_100))
    centers = (_INVEST_CENTER, _RISKY_CENTER, _AVOID_CENTER)
    logits = [-((c - x) ** 2) / _SOFTMAX_SCALE for x in centers]
    m = max(logits)
    exps = [math.exp(l - m) for l in logits]
    s = sum(exps)
    raw = [e / s for e in exps]
    rounded = [round(x, 4) for x in raw]
    drift = round(1.0 - sum(rounded), 4)
    rounded[-1] = round(max(0.0, min(1.0, rounded[-1] + drift)), 4)
    return tuple(rounded)  # type: ignore[return-value]
