"""Build `events[]` timeline markers from enriched news items."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .political_tags import primary_event_kind, tag_headline


def build_events(
    items: list[dict[str, Any]],
    *,
    analysis_id_prefix: str = "evt",
) -> list[dict[str, Any]]:
    """Each item may have title, published_at (datetime or None)."""
    out: list[dict[str, Any]] = []
    for idx, i in enumerate(items):
        title = str(i.get("title") or "")
        tags = tag_headline(title)
        ptags = tags.get("political_risk_tags") or []
        if not ptags:
            continue
        kind = primary_event_kind(list(ptags))
        sev = min(100.0, 35.0 + 15.0 * len(ptags))
        t = i.get("published_at")
        if isinstance(t, datetime):
            ts = t.isoformat()
        else:
            ts = datetime.utcnow().isoformat() + "Z"
        eid = f"{analysis_id_prefix}-{idx}-{kind}"
        out.append(
            {
                "id": eid,
                "t": ts,
                "kind": kind,
                "label": ", ".join(ptags[:3]),
                "severity_0_100": round(sev, 1),
                "source_headline_index": idx,
            }
        )
    return out
