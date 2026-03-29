#!/usr/bin/env bash
# POST /analyze for AAPL (requires uvicorn on port 8000 by default).
set -euo pipefail
BASE="${1:-http://127.0.0.1:8000}"
echo "POST $BASE/analyze (AAPL, force_refresh)..."
curl -sS -X POST "$BASE/analyze" \
  -H "Content-Type: application/json" \
  -d '{"query":"AAPL","force_refresh":true}' \
  | python3 -m json.tool
