# API keys setup (YHack / Signal)

Use **`backend/.env`** for server secrets. Never commit real keys; copy from **`backend/.env.example`** and fill in locally.

---

## 1. Lava (AI gateway) — optional but recommended for metering

[Lava](https://www.lava.so/) proxies OpenAI-compatible **chat completions** to many providers and adds usage metering and spend controls.

### Steps

1. Go to [https://www.lava.so/](https://www.lava.so/) and **sign up** / **Get Started**.
2. In the Lava dashboard, create a **project** (or use the default).
3. Add a **provider route** or **API key** that points to the model host you use for K2 / Hermes (whatever your hackathon exposes as an OpenAI-compatible base URL).
4. Copy Lava’s **base URL** for chat completions (check [Lava developers / docs](https://www.lava.so/developers) for the exact path—often something like `https://api.lava.xyz/v1` or similar; **use their current docs**).
5. Create a **Lava API key** in the dashboard.

### Wire into this repo

In **`backend/.env`** set:

```env
AI_K2_BASE_URL=<lava_base_url_no_trailing_slash>
AI_K2_API_KEY=<lava_api_key>
AI_K2_MODEL=<model_id_lava_expects>

AI_HERMES_BASE_URL=<same_or_different_lava_base>
AI_HERMES_API_KEY=<lava_api_key>
AI_HERMES_MODEL=<model_id>
```

The code calls **`{BASE}/chat/completions`** with Bearer auth—the same shape as OpenAI.

**Tip:** You can use **one** Lava project for both K2 and Hermes if they share the same gateway; use different `*_MODEL` values if your route supports multiple models.

---

## 2. Polymarket (builder + APIs) — required for prediction-market track

Official docs: [Polymarket quickstart](https://docs.polymarket.com/quickstart/overview).

### Steps

1. Open [Polymarket builder settings](https://polymarket.com/settings?tab=builder) while logged in.
2. Create or copy a **Builder API key** (and any signing secrets your integration needs—see their **Wagmi / Privy** example repos).
3. Read **Gamma** vs **Data API** vs **CLOB** in the [API reference](https://docs.polymarket.com/api-reference/gamma-status) to choose endpoints for:
   - listing markets,
   - implied probabilities / prices,
   - (optional) order book.

### Wire into this repo (when implemented)

The backend will need env vars such as:

```env
POLYMARKET_API_KEY=...
# or split keys per docs — follow Polymarket’s latest env names
```

Until **`polymarket_stub`** is replaced with a live integration, the UI shows a **placeholder card** with instructions.

---

## 3. Fundamentals — FMP or Finnhub

### Financial Modeling Prep (FMP)

1. Sign up at [https://financialmodelingprep.com/](https://financialmodelingprep.com/) (or your hackathon’s provided key).
2. Copy the **API key** from the dashboard.
3. Set in **`backend/.env`**:

```env
FMP_API_KEY=your_key_here
```

### Finnhub (alternative / overlap)

1. [https://finnhub.io/](https://finnhub.io/) → register → **Dashboard → API key**.
2. Set:

```env
FINNHUB_API_KEY=your_key_here
```

The backend tries **FMP first**, then **Finnhub** for fundamentals (see `finance_client.py`).

---

## 4. News — Finnhub and/or NewsAPI

### Finnhub company news

Uses the same **`FINNHUB_API_KEY`** as above.

### NewsAPI

1. [https://newsapi.org/](https://newsapi.org/) → register → copy **API key**.
2. Set:

```env
NEWS_API_KEY=your_key_here
```

News pipeline: **Finnhub** → **NewsAPI** → **mock**, with optional **curated JSON** merged first (`data/news_snapshots/`).

---

## 5. MongoDB (optional)

For analyses that **survive server restarts**:

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) (or use local Mongo).
2. Create a DB user and **connection string**.
3. Set:

```env
MONGO_URI=mongodb+srv://user:pass@cluster/...
MONGO_DB_NAME=yhack_invest
```

If **`MONGO_URI`** is empty, the app uses **in-memory** storage (UUID analysis IDs).

---

## 6. Frontend → backend URL

In **`frontend/.env.local`** (not committed):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

No space after `=`. Restart **`npm run dev`** after changes.

---

## Quick verification

1. Backend: `GET http://127.0.0.1:8000/health` → `{"status":"ok"}`.
2. `POST /analyze` with `{"query":"AAPL","force_refresh":true}` → response includes **`scores`**, **`probabilities`**, **`polymarket_stub`**.
3. Or run `./backend/scripts/smoke_analyze.sh`.

---

## Security

- Rotate keys if leaked.
- Prefer **server-side** calls for Polymarket and paid news APIs; don’t expose builder keys in the browser unless their docs require a client-side flow you intentionally support.
