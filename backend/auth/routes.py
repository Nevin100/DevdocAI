import uuid
from fastapi import APIRouter, Depends, Request
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

# Authentication Routes : 
# 1. Register
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.register(body, db)

# 2. Login
@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(req: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.login(body, db)

# 3. Get Current User
@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AuthService.get_me(user_id, db)

# 4. GitHub OAuth URL
@router.get("/github", response_model=GithubOAuthUrlResponse)
async def github_oauth_url():
    """Frontend calls this → gets GitHub redirect URL"""
    return AuthService.get_github_url()
 
@router.post("/github/callback", response_model=TokenResponse)
async def github_callback(body: GithubCallbackRequest, db: AsyncSession = Depends(get_db)):
    """GitHub redirects here with code → returns JWT"""
    return await AuthService.github_callback(body.code, db)

