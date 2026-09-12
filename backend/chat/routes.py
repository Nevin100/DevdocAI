from fastapi import APIRouter, Depends, Request
import uuid

from auth.jwt import get_current_user
from schemas.chat_schemas import ChatRequest, ChatResponse
from services.chat_service import ChatService
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/chat/ask", response_model=ChatResponse)
@limiter.limit("10/minute")
async def ask_chatbot(
    request: Request,
    body: ChatRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    return await ChatService.ask(body)