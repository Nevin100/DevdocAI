import hmac
import hashlib
import uuid
from fastapi import APIRouter, Request, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import async_session_local
from db.models import Repository, PipelineRun, User
from graph.state import DevDocState
from graph.pipeline import get_compiled_pipeline, run_pipeline
from cache.redis_client import cache_set, cache_delete, pipeline_status_key, repo_docs_key
from utils.encryption import decrypt
from config import get_settings

settings = get_settings()
router = APIRouter()

def verify_github_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify that the webhook actually came from GitHub.
    GitHub sends HMAC-SHA256 signature in X-Hub-Signature-256 header.
    """
    expected = "sha256=" + hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# GitHub webhook endpoint
@router.post("/github")
async def github_webhook(
    request: Request,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None),
):
    """
    GitHub sends webhook events here.
    We only care about pull_request events where action=closed and merged=true.

    Flow:
    PR merged → GitHub sends webhook → we find the repo → trigger pipeline
    """
    payload_bytes = await request.body()
    payload = await request.json()

    # Only handle pull_request events
    if x_github_event != "pull_request":
        return {"status": "ignored", "reason": "not a pull_request event"}

    action = payload.get("action")
    pr = payload.get("pull_request", {})
    merged = pr.get("merged", False)

    # Only trigger on merged PRs
    if action != "closed" or not merged:
        return {"status": "ignored", "reason": "PR not merged"}

    # Get repo info from payload
    github_repo_id = str(payload["repository"]["id"])
    pr_number = pr["number"]
    # Get head commit SHA from PR (the commit that was merged)
    head_commit_sha = pr.get("head", {}).get("sha")

    print(f"🔀 PR #{pr_number} merged in repo {github_repo_id}")

    async with async_session_local() as db:
        # Find repo in our DB
        result = await db.execute(
            select(Repository).where(Repository.github_repo_id == github_repo_id)
        )
        repo = result.scalar_one_or_none()

        if not repo:
            return {"status": "ignored", "reason": "repo not connected to DevDocAI"}

        # Verify GitHub signature using repo webhook secret
        if x_hub_signature_256:
            webhook_secret = f"devdocai-{repo.id}"   # secret set when webhook was created
            if not verify_github_signature(payload_bytes, x_hub_signature_256, webhook_secret):
                raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # Get repo owner's GitHub token
        user_result = await db.execute(
            select(User).where(User.id == repo.owner_id)
        )
        user = user_result.scalar_one_or_none()

        if not user or not user.github_access_token:
            return {"status": "error", "reason": "user token not found"}

        # Create a PipelineRun record
        thread_id = str(uuid.uuid4())
        pipeline_run = PipelineRun(
            id=uuid.uuid4(),
            repo_id=repo.id,
            thread_id=thread_id,
            trigger="pr_merge",
            pr_number=pr_number,
            status="running",
        )
        db.add(pipeline_run)
        await db.commit()

        # Cache pipeline status
        await cache_set(
            pipeline_status_key(thread_id),
            {"status": "running", "trigger": "pr_merge", "pr_number": pr_number},
            ttl_seconds=86400  # 24 hours
        )

        # Clear old docs cache for this repo — fresh docs incoming
        await cache_delete(repo_docs_key(str(repo.id)))

    # Build initial state for the pipeline
    # Include last_processed_commit for incremental diff processing
    # Also pass head_commit_sha from PR for immediate diff computation
    initial_state = DevDocState(
        user_id=str(user.id),
        repo_id=str(repo.id),
        repo_full_name=repo.full_name,
        encrypted_github_token=user.github_access_token,
        pipeline_run_id=str(pipeline_run.id),
        thread_id=thread_id,
        trigger="pr_merge",
        pr_number=pr_number,
        last_processed_commit=repo.last_processed_commit,  # For incremental diff
        current_head_commit=head_commit_sha,  # Direct from PR payload
    )

    # Compile and run the pipeline (runs in background)
    doc_graph, _ = await get_compiled_pipeline()
    await run_pipeline(initial_state, doc_graph)

    print(f" Pipeline started for PR #{pr_number} — thread: {thread_id}")

    return {
        "status": "pipeline_started",
        "thread_id": thread_id,
        "pr_number": pr_number,
    }