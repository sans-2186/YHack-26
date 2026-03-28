from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

_client: AsyncIOMotorClient | None = None


async def connect_mongo() -> AsyncIOMotorDatabase | None:
    global _client
    if not settings.mongo_uri:
        return None
    _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client[settings.mongo_db_name]


async def close_mongo() -> None:
    global _client
    if _client:
        _client.close()
        _client = None


def get_db() -> AsyncIOMotorDatabase | None:
    if not _client or not settings.mongo_uri:
        return None
    return _client[settings.mongo_db_name]
