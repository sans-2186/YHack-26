from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_analyze, routes_chat, routes_health
from app.config import cors_origin_list
from app.db.mongo import close_mongo, connect_mongo
from app.db.repositories import ensure_indexes


@asynccontextmanager
async def lifespan(_: FastAPI):
    db = await connect_mongo()
    await ensure_indexes(db)
    yield
    await close_mongo()


app = FastAPI(
    title="YHack Investment Agent API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_health.router)
app.include_router(routes_analyze.router)
app.include_router(routes_chat.router)
