from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    try:
        return await chat_service.run_chat(body.analysis_id, body.message)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
