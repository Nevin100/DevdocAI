import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from db.models import User
from auth.jwt import get_current_user
from schemas.repo_schemas import ConnectRepoRequest, RepoResponse
from services.repo_service import RepoService
from mcp.github_server import list_user_repos
from utils.encryption import decrypt
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.get("/repos", response_model=list[RepoResponse])
async def list_repos(
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await RepoService.list_repos(user_id, db)

@router.get("/github/repos")
async def list_github_repos(
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches the user's actual GitHub repos (not the ones already
    connected in our DB) — used to populate the connect-repo picker.
    """
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.github_access_token:
        return {"repos": [], "error": "GitHub account not linked"}

    return list_user_repos.ainvoke({
        "encrypted_token": user.github_access_token,
    })

@router.post("/repos/connect", response_model=RepoResponse, status_code=201)
async def connect_repo(
    body: ConnectRepoRequest,
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await RepoService.connect_repo(user_id, body, db)

@router.post("/repos/{repo_id}/run")
@limiter.limit("3/minute")
async def run_pipeline_manually(
    request: Request,
    repo_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await RepoService.trigger_pipeline(repo_id, user_id, db)

@router.get("/repos/{repo_id}/latest-thread")
async def get_latest_thread(
    repo_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await RepoService.get_latest_thread(repo_id, user_id, db)