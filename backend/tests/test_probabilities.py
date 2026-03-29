"""Invariants and calibrated expectations for verdict_probabilities."""

from __future__ import annotations

import math

import pytest

from app.scoring.probabilities import verdict_probabilities


def _sum3(t: tuple[float, float, float]) -> float:
    return t[0] + t[1] + t[2]


@pytest.mark.parametrize("c", [0.0, 22.0, 50.0, 60.9, 78.0, 100.0])
def test_probabilities_sum_to_one(c: float) -> None:
    p = verdict_probabilities(c)
    assert len(p) == 3
    assert abs(_sum3(p) - 1.0) < 1e-6


@pytest.mark.parametrize("c", [-10.0, 0.0, 50.0, 100.0, 150.0])
def test_probabilities_components_in_unit_interval(c: float) -> None:
    p_inv, p_risk, p_av = verdict_probabilities(c)
    for x in (p_inv, p_risk, p_av):
        assert 0.0 <= x <= 1.0


def test_extreme_high_composite_favors_invest() -> None:
    p_inv, p_risk, p_av = verdict_probabilities(98.0)
    assert p_inv > p_risk and p_inv > p_av


def test_extreme_low_composite_favors_avoid() -> None:
    p_inv, p_risk, p_av = verdict_probabilities(3.0)
    assert p_av > p_inv and p_av > p_risk


def test_mid_composite_not_degenerate() -> None:
    """Mid scores should spread mass (not collapse to a single ~1.0 bucket)."""
    p_inv, p_risk, p_av = verdict_probabilities(58.0)
    m = max(p_inv, p_risk, p_av)
    assert m < 0.99
    assert min(p_inv, p_risk, p_av) > 0.001


def test_softmax_golden_mid_range() -> None:
    """Stable reference for the tuned mapping (update if centers/scale change intentionally)."""
    p_inv, p_risk, p_av = verdict_probabilities(60.9)
    assert p_inv > p_risk  # mid-high composite leans invest after tuning
    assert p_risk > p_av
    assert abs(_sum3((p_inv, p_risk, p_av)) - 1.0) < 1e-5


def test_clamping_matches_extremes() -> None:
    a = verdict_probabilities(-999.0)
    b = verdict_probabilities(0.0)
    assert a == b
    x = verdict_probabilities(999.0)
    y = verdict_probabilities(100.0)
    assert x == y
