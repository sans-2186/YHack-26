"""Lightweight headline tagging for political / regulatory / perception risk."""

from __future__ import annotations

import re
from typing import Any

_PATTERNS: list[tuple[str, float, list[str]]] = [
    (
        "regulation",
        1.0,
        [
            r"\bsec\b",
            r"\bregulat",
            r"compliance",
            r"investigation\b",
            r"subpoena",
            r"cftc\b",
            r"ftc\b",
        ],
    ),
    ("election", 1.0, [r"\belection\b", r"ballot", r"congress\b", r"\bgop\b", r"\bdemocrat"]),
    ("tariff", 1.1, [r"tariff", r"trade war", r"import duty"]),
    ("antitrust", 1.2, [r"antitrust", r"monopoly", r"\bdoj\b.*merger", r"competition probe"]),
    (
        "executive",
        1.15,
        [r"\bceo\b", r"executive", r"insider trading", r"boardroom", r"resigns\b", r"step(s)? down"],
    ),
    ("sanctions", 1.2, [r"sanction", r"export control", r"\bbis\b"]),
    (
        "macro",
        1.0,
        [r"fed(\s|$)", r"interest rate", r"inflation", r"recession", r"jobs report", r"cpi\b"],
    ),
    (
        "controversy",
        1.2,
        [r"backlash", r"boycott", r"scandal", r"#\w*outrage", r"community outcry", r"greensill"],
    ),
    ("legal", 1.05, [r"lawsuit", r"settlement", r"class action", r"indictment"]),
]

_COMPILED: list[tuple[str, float, list[re.Pattern[str]]]] = []
for cat, w, pats in _PATTERNS:
    compiled = [re.compile(p, re.I) for p in pats]
    _COMPILED.append((cat, w, compiled))


def tag_headline(title: str) -> dict[str, Any]:
    """Return event-style tags for a single headline (for API enrichment)."""
    t = title.strip()
    if not t:
        return {"event_tags": [], "political_risk_tags": []}
    hits: list[str] = []
    for cat, _weight, patterns in _COMPILED:
        if any(p.search(t) for p in patterns):
            hits.append(cat)
    return {"event_tags": hits, "political_risk_tags": list(hits)}


def political_weighted_hits(title: str) -> float:
    """Sum of weights for categories matched in one headline."""
    t = title.strip()
    if not t:
        return 0.0
    total = 0.0
    for _cat, weight, patterns in _COMPILED:
        if any(p.search(t) for p in patterns):
            total += weight
    return total
