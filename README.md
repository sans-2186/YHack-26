# Signal — AI Investment Intelligence

> Fundamentals + news sentiment + media bias + Polymarket crowd wisdom → one clear signal: **Invest / Risky / Avoid**

---

## Quick Start

You need two terminals running simultaneously — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`
API docs at: `http://127.0.0.1:8000/docs`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## First Time Setup

If `.venv` doesn't exist yet:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If `node_modules` doesn't exist yet:

```bash
cd frontend
npm install
```

---

## Environment Variables

Create `backend/.env` (copy from `backend/.env.example`):

```properties
# Database (leave blank to use in-memory store)
MONGO_URI=
MONGO_DB_NAME=yhack_invest

# Financial data — Finnhub free tier: https://finnhub.io
FINNHUB_API_KEY=your_key_here
FMP_API_KEY=

# News (optional)
NEWS_API_KEY=

# AI — K2 reasoning via Lava gateway
AI_K2_BASE_URL=https://api.lavapayments.com/v1
AI_K2_API_KEY=your_lava_key
AI_K2_MODEL=gpt-4o-mini

# AI — Hermes chat (get key from Nous Research booth)
AI_HERMES_BASE_URL=
AI_HERMES_API_KEY=
AI_HERMES_MODEL=

# Polymarket (Gamma API is public, no key needed)
POLYMARKET_API_KEY=

ANALYSIS_CACHE_TTL_MINUTES=45
HTTP_TIMEOUT_SECONDS=12
CORS_ORIGINS=http://localhost:3000
NEWS_SNAPSHOT_MERGE=true
```

Create `frontend/.env.local`:

```properties
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## How It Works

```
User types ticker (e.g. TSLA)
        ↓
Frontend → POST /analyze
        ↓
Backend fetches:
  - Finnhub → real financials (market cap, P/E, revenue, debt)
  - Finnhub/NewsAPI → live headlines
  - Polymarket Gamma API → active prediction markets
        ↓
Scoring engine runs 4 pillars (0-100):
  - Financial score
  - Sentiment score
  - Bias risk score
  - Political/perception risk score
        ↓
K2 (GPT-4o-mini via Lava) synthesizes → Invest / Risky / Avoid
        ↓
Frontend renders full analysis page
        ↓
User asks Hermes follow-up questions → grounded in stored analysis
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Run full analysis for a ticker |
| `GET` | `/analyze/{id}` | Retrieve cached analysis by ID |
| `POST` | `/chat` | Chat with Hermes about an analysis |
| `GET` | `/health` | Health check |

### Example — Run analysis:
```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "TSLA", "force_refresh": true}'
```

### Example — Chat:
```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"analysis_id": "your-id-here", "message": "Why is this risky?"}'
```

---

## Supported Tickers

Any US ticker works. These are pre-optimized with curated news snapshots:

`AAPL` `TSLA` `NVDA` `MSFT` `GOOGL` `AMZN` `META` `NFLX`

---

## Common Issues

**`No module named uvicorn`**
→ Always use `python -m uvicorn`, never just `uvicorn`

**`Address already in use`**
```bash
lsof -ti:8000 | xargs kill -9
```

**Backend starts but returns mock data**
→ Make sure you're running from inside the `backend/` folder, not the root
→ Check `backend/.env` has your Finnhub key with no spaces or quotes

**Frontend shows "Could not reach the API"**
→ Make sure `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
→ Make sure the backend is running in another terminal

**Cache showing old data**
→ Add `"force_refresh": true` to your analyze request

---

## Project Structure

```
YHack-26/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes
│   │   ├── services/     # Business logic
│   │   │   ├── analysis_service.py   # Main pipeline
│   │   │   ├── finance_client.py     # Finnhub/FMP
│   │   │   ├── news_client.py        # News fetching
│   │   │   ├── polymarket_client.py  # Gamma API
│   │   │   ├── ai_k2.py              # K2 reasoning
│   │   │   └── ai_hermes.py          # Hermes chat
│   │   ├── schemas/      # Pydantic models
│   │   ├── scoring/      # 4-pillar scoring engine
│   │   └── db/           # MongoDB / in-memory store
│   ├── data/
│   │   └── news_snapshots/  # Curated headlines per ticker
│   ├── requirements.txt
│   └── .env              # Your secrets (never commit)
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Homepage with search
│   │   └── analysis/[ticker]/    # Analysis page
│   ├── components/
│   │   ├── analysis/     # All analysis components
│   │   ├── layout/       # Navbar, Footer
│   │   └── dashboard/    # Dashboard components
│   ├── lib/              # API client, data mapping
│   └── .env.local        # Your frontend env (never commit)
└── README.md
```

---

## Prize Tracks

| Track | Sponsor | What qualifies us |
|-------|---------|-------------------|
| Personal AI Agent | Harper | K2 automates investment workflow end-to-end |
| Prediction Markets | Polymarket | Live Gamma API integration |
| Best use of Hermes | Nous Research | Hermes powers grounded chat Q&A |
| Best use of Lava API | Lava | All LLM calls routed through Lava |
| Best UI/UX | — | Polished dark-mode dashboard |

---

## Demo Script (30 seconds)

> *"Search TSLA. Signal pulls live financials from Finnhub, scans 20 headlines for sentiment and media bias, checks what Polymarket traders are betting on, and synthesizes it all through GPT-4o-mini into Invest / Risky / Avoid with explainable scores. Then ask Hermes why — in plain English, grounded only in this analysis."*
