from datetime import UTC, datetime
from typing import Any

from app.db import repositories as repo
from app.db.mongo import get_db
from app.schemas.chat import ChatResponse
from app.services import ai_hermes


async def run_chat(analysis_id: str, message: str) -> ChatResponse:
    db = get_db()
    analysis = await repo.get_analysis_by_id(db, analysis_id)
    if not analysis:
        raise ValueError("Analysis not found")

    text = (message or "").strip()
    if not text:
        raise ValueError("message is required")

    chat_doc = await repo.get_or_create_chat(db, analysis_id)
    now = datetime.now(UTC)
    messages: list[dict[str, Any]] = list(chat_doc.get("messages") or [])
    messages.append({"role": "user", "content": text, "ts": now})

    hist = [{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"]
    reply = await ai_hermes.reply(analysis, hist[:-1], text)

    messages.append(
        {
            "role": "assistant",
            "content": reply,
            "ts": datetime.now(UTC),
            "model": "hermes",
        }
    )
    chat_doc["messages"] = messages
    await repo.save_chat(db, chat_doc)

    return ChatResponse(reply=reply, analysis_id=analysis_id)
