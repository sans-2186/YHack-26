import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings

_memory_analyses_by_id: dict[str, dict[str, Any]] = {}
_memory_cache: dict[str, dict[str, Any]] = {}


def _now() -> datetime:
    return datetime.now(UTC)


async def ensure_indexes(db: AsyncIOMotorDatabase | None) -> None:
    if not db:
        return
    analyses = db["analyses"]
    await analyses.create_index([("cache_key", 1), ("created_at", -1)])
    try:
        await analyses.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        pass


async def find_cached_analysis(
    db: AsyncIOMotorDatabase | None, cache_key: str
) -> dict[str, Any] | None:
    if db:
        doc = await db["analyses"].find_one(
            {"cache_key": cache_key, "expires_at": {"$gt": _now()}},
            sort=[("created_at", -1)],
        )
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    doc = _memory_cache.get(cache_key)
    if doc and doc.get("expires_at") and doc["expires_at"] > _now():
        return doc
    return None


async def insert_analysis(
    db: AsyncIOMotorDatabase | None, doc: dict[str, Any]
) -> str:
    if db:
        result = await db["analyses"].insert_one(doc)
        return str(result.inserted_id)
    aid = str(uuid.uuid4())
    doc = {**doc, "_id": aid}
    _memory_analyses_by_id[aid] = doc
    _memory_cache[doc["cache_key"]] = doc
    return aid


async def get_analysis_by_id(
    db: AsyncIOMotorDatabase | None, analysis_id: str
) -> dict[str, Any] | None:
    if db:
        try:
            oid = ObjectId(analysis_id)
        except Exception:
            return None
        doc = await db["analyses"].find_one({"_id": oid})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    return _memory_analyses_by_id.get(analysis_id)


async def get_or_create_chat(
    db: AsyncIOMotorDatabase | None, analysis_id: str
) -> dict[str, Any]:
    if db:
        try:
            oid = ObjectId(analysis_id)
        except Exception:
            raise ValueError("Invalid analysis_id") from None
        existing = await db["chats"].find_one({"analysis_id": oid})
        if existing:
            existing["_id"] = str(existing["_id"])
            existing["analysis_id"] = str(existing["analysis_id"])
            return existing
        doc = {
            "analysis_id": oid,
            "created_at": _now(),
            "updated_at": _now(),
            "messages": [],
        }
        ins = await db["chats"].insert_one(doc)
        saved = await db["chats"].find_one({"_id": ins.inserted_id})
        assert saved is not None
        saved["_id"] = str(saved["_id"])
        saved["analysis_id"] = analysis_id
        return saved
    if analysis_id not in _memory_analyses_by_id:
        raise ValueError("Invalid analysis_id")
    cid = f"chat-{analysis_id}"
    if cid not in _memory_analyses_by_id:
        doc = {
            "_id": cid,
            "analysis_id": analysis_id,
            "created_at": _now(),
            "updated_at": _now(),
            "messages": [],
        }
        _memory_analyses_by_id[cid] = doc
    return _memory_analyses_by_id[cid]


async def save_chat(
    db: AsyncIOMotorDatabase | None, chat_doc: dict[str, Any]
) -> None:
    chat_doc["updated_at"] = _now()
    if db:
        try:
            oid = ObjectId(str(chat_doc["_id"]))
        except Exception:
            return
        await db["chats"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "messages": chat_doc["messages"],
                    "updated_at": chat_doc["updated_at"],
                }
            },
        )
    else:
        _memory_analyses_by_id[chat_doc["_id"]] = chat_doc


def build_analysis_document(
    *,
    cache_key: str,
    query_raw: str,
    company: dict[str, Any],
    financials: dict[str, Any],
    news: dict[str, Any],
    recommendation: dict[str, Any],
    meta: dict[str, Any],
) -> dict[str, Any]:
    ttl = timedelta(minutes=settings.analysis_cache_ttl_minutes)
    now = _now()
    return {
        "cache_key": cache_key,
        "created_at": now,
        "expires_at": now + ttl,
        "query_raw": query_raw,
        "company": company,
        "financials": financials,
        "news": news,
        "recommendation": recommendation,
        "meta": meta,
    }
