"""Load curated per-ticker news JSON from backend/data/news_snapshots/."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


def _backend_dir() -> Path:
    # .../backend/app/services/this_file.py -> backend
    return Path(__file__).resolve().parents[2]


def _snapshots_dir() -> Path:
    return _backend_dir() / "data" / "news_snapshots"


def _parse_published_at(raw: str | None) -> datetime | None:
    if not raw or not isinstance(raw, str):
        return None
    s = raw.strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt.astimezone(UTC)
    except ValueError:
        return None


def load_curated_news_items(ticker: str) -> list[dict[str, Any]]:
    """
    Return normalized news dicts (title, url, source, published_at, optional outlet_leaning)
    if {TICKER}.json exists and validates; otherwise [].
    """
    key = (ticker or "").strip().upper().replace(".", "")
    if not key:
        return []
    path = _snapshots_dir() / f"{key}.json"
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(data, dict):
        return []
    file_ticker = str(data.get("ticker") or "").strip().upper().replace(".", "")
    if file_ticker and file_ticker != key:
        return []
    items = data.get("items")
    if not isinstance(items, list):
        return []
    out: list[dict[str, Any]] = []
    for raw in items:
        if not isinstance(raw, dict):
            continue
        title = str(raw.get("title") or "").strip()
        if not title:
            continue
        row: dict[str, Any] = {
            "title": title,
            "url": raw.get("url"),
            "source": (str(raw.get("source")).strip() if raw.get("source") else None) or None,
            "published_at": _parse_published_at(raw.get("published_at")),
        }
        lean = raw.get("outlet_leaning")
        if lean is not None and str(lean).strip():
            row["outlet_leaning"] = str(lean).strip()
        out.append(row)
    return out
