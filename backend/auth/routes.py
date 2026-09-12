import uuid
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from auth.jwt import get_current_user
from schemas.auth_schema import (
    RegisterRequest, LoginRequest,
    TokenResponse, UserResponse,
    GithubCallbackRequest, GithubOAuthUrlResponse
)
from services.auth_service import AuthService
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,        # HTTPS only — set False only for local http testing
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 hours
        path="/",
    )


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result: TokenResponse = await AuthService.register(body, db)
    set_auth_cookie(response, result.access_token)
    return {"status": "ok"}


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result: TokenResponse = await AuthService.login(body, db)
    set_auth_cookie(response, result.access_token)
    return {"status": "ok"}


@router.get("/github", response_model=GithubOAuthUrlResponse)
async def github_oauth_url():
    return AuthService.get_github_url()


@router.post("/github/callback")
async def github_callback(body: GithubCallbackRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result: TokenResponse = await AuthService.github_callback(body.code, db)
    set_auth_cookie(response, result.access_token)
    return {"status": "ok"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AuthService.get_me(user_id, db)