from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    analysis_id: str = Field(..., description="Mongo ObjectId string from /analyze")
    message: str


class ChatResponse(BaseModel):
    reply: str
    analysis_id: str
