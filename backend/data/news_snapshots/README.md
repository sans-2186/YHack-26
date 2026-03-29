# Curated news snapshots (hackathon demo)

Static JSON files merged **ahead of** live Finnhub / NewsAPI results so demos stay stable and you can show **multi-outlet** coverage (mentor “Ground News style” idea: export once, ship in-repo).

## When merge runs

If `NEWS_SNAPSHOT_MERGE=true` (default) and `{TICKER}.json` exists, items are **prepended** and de-duplicated by title with API/mock news (cap 20 items). `meta.sources` includes `curated_snapshot` plus e.g. `finnhub` or `mock`.

## File layout

One file per ticker, uppercase name:

- `AAPL.json`
- `TSLA.json`
- `NVDA.json`

## Schema

```json
{
  "ticker": "AAPL",
  "as_of": "2026-03-28T12:00:00Z",
  "note": "Human-readable note (e.g. source of export).",
  "items": [
    {
      "title": "Headline text",
      "source": "Outlet display name",
      "url": "https://...",
      "published_at": "2026-03-27T15:30:00Z",
      "outlet_leaning": "Optional: e.g. left/center/right from Ground News or your own tag"
    }
  ]
}
```

- `published_at`: ISO 8601 (UTC with `Z` is fine).
- `outlet_leaning`: optional; surfaced in API as `outlet_leaning` on each news item when present.

## How to refresh

1. Export or copy articles from your approved workflow (e.g. Ground News UI export, spreadsheet → JSON).
2. Edit or replace `TICKER.json` following the schema; bump `as_of`.
3. Restart the API (or rely on cache TTL / `force_refresh` on analyze).

## Disclaimer

Sample files ship with **plausible fictional demo headlines** for judging—not live wire copy. Replace with your own curated export for accuracy.
