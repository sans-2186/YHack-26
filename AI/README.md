# Signal — AI / reasoning track (YHack 2026)

This folder is the **source of truth for AI design** alongside `backend/` and `frontend/`. Implement scoring and reasoning in the FastAPI app using these specs; keep this folder updated if the API contract changes.

| Document | Purpose |
|----------|---------|
| [SIGNAL_AI_SPEC.md](./SIGNAL_AI_SPEC.md) | Architecture, `/analyze` schema, score math, fallback rules, Polymarket extension path |
| [schemas/analyze_response.proposed.json](./schemas/analyze_response.proposed.json) | Proposed JSON Schema for richer `AnalyzeResponse` |
| [prompts/k2_recommendation.md](./prompts/k2_recommendation.md) | K2 system + user message pattern for synthesis |
| [prompts/hermes_chat.md](./prompts/hermes_chat.md) | Hermes grounded chat pattern |
| [stubs/](./stubs/) | Reference Python (copy into `backend/app/services/ai/` when wiring) |

**30-second demo story:** “We don’t predict prices—we combine fundamentals, news sentiment, media bias, and political/perception risk into explainable 0–100 scores, then K2 synthesizes Invest / Risky / Avoid with drivers and headlines; Hermes answers follow-ups grounded in that analysis.”
