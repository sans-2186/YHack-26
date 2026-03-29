# YHack-26

AI investment agent: FastAPI backend + Next.js frontend (fundamentals, news, sentiment, bias snapshot, recommendation, chat).

## Status

- **Working:** `POST /analyze`, `GET /analyze/{id}`, `POST /chat`, **four-pillar scores** + verdict probabilities + fallback/K2 trail, curated news merge, frontend analysis page + live/fallback behavior.
- **Optional keys** in [`backend/.env`](backend/.env): `FINNHUB_API_KEY` / `NEWS_API_KEY` (news), `FMP_API_KEY` / `FINNHUB_API_KEY` (fundamentals), `AI_K2_*` / `AI_HERMES_*` (LLMs), `MONGO_URI` (persistent cache). Without keys, the app uses **mock** data paths and still runs for demos.

## Run locally

**Backend** (from `backend/`, with venv activated):

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Use `--port 8000` (space). Wrong: `--port8000`.

**Frontend** (from `frontend/`):

```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Point the app at the API with `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` in `frontend/.env.local` if needed.

## Quick API check

With the backend running:

```bash
chmod +x backend/scripts/smoke_analyze.sh
./backend/scripts/smoke_analyze.sh
```

Or use [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) → **POST /analyze** → body `{"query":"AAPL","force_refresh":true}`.

**Healthy snapshot merge:** `meta.sources` includes `curated_snapshot`; first `news.items` match `backend/data/news_snapshots/AAPL.json`.

**Live news on top of snapshots:** set `FINNHUB_API_KEY` or `NEWS_API_KEY` in `backend/.env`, restart, run again with `force_refresh: true` — you should see e.g. `finnhub` or `newsapi` alongside `curated_snapshot`.

## Docs

- **API keys (Lava, Polymarket, FMP, Finnhub, NewsAPI, Mongo):** [`docs/API_KEYS.md`](docs/API_KEYS.md)
- Curated news JSON schema and refresh: [`backend/data/news_snapshots/README.md`](backend/data/news_snapshots/README.md)
