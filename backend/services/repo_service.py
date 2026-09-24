import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
import asyncio
from repositories.repo_repository import RepoRepository
from schemas.repo_schemas import ConnectRepoRequest, RepoResponse
from db.models import User, PipelineRun
from graph.state import DevDocState
from graph.pipeline import get_compiled_pipeline, run_pipeline

_background_tasks: set[asyncio.Task] = set()


async def _run_pipeline_bg(initial_state: DevDocState, pipeline_run_id: uuid.UUID):
    """
    Run the pipeline in the background and keep the PipelineRun row in sync:
    running → paused (waiting for human review) | completed | failed.
    """
    from db.database import async_session_local

    final_status = "failed"
    try:
        doc_graph, _ = await get_compiled_pipeline()
        config = await run_pipeline(initial_state, doc_graph)

        # run_pipeline returns when the graph pauses OR finishes.
        # Checkpoint me 'next' set hai = human_review pe paused hai.
        try:
            snapshot = await doc_graph.aget_state(config)
            final_status = "paused" if snapshot.next else "completed"
        except Exception:
            final_status = "completed"

        print(f"✅ Pipeline {final_status} — thread: {initial_state.thread_id}")
    except Exception as e:
        final_status = "failed"
        print(f"❌ Pipeline failed — thread {initial_state.thread_id}: {e}")

    try:
        async with async_session_local() as db:
            result = await db.execute(
                select(PipelineRun).where(PipelineRun.id == pipeline_run_id)
            )
            run = result.scalar_one_or_none()
            if run:
                run.status = final_status
                if final_status in ("completed", "failed"):
                    run.completed_at = datetime.utcnow()
                await db.commit()
    except Exception as db_e:
        print(f"⚠️ Could not update pipeline run status: {db_e}")


class RepoService:

    @staticmethod
    async def list_repos(user_id: uuid.UUID, db: AsyncSession) -> list[RepoResponse]:
        repos = await RepoRepository.list_by_owner(user_id, db)
        return [RepoResponse.model_validate(r) for r in repos]

    @staticmethod
    async def connect_repo(
        user_id: uuid.UUID, body: ConnectRepoRequest, db: AsyncSession
    ) -> RepoResponse:
        existing = await RepoRepository.get_by_github_repo_id(body.github_repo_id, db)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This repository is already connected",
            )

        repo = await RepoRepository.create(
            owner_id=user_id,
            github_repo_id=body.github_repo_id,
            full_name=body.full_name,
            default_branch=body.default_branch,
            db=db,
        )
        return RepoResponse.model_validate(repo)

    @staticmethod
    async def trigger_pipeline(repo_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> dict:
        """
        Manually starts the doc-generation pipeline for a connected repo.
        Used right after "Connect repository" so the user doesn't have
        to wait for a PR merge to see their first docs.
        """
        repo = await RepoRepository.get_by_id(repo_id, db)
        if not repo or repo.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found",
            )

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.github_access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub account not linked",
            )

        thread_id = str(uuid.uuid4())
        pipeline_run = PipelineRun(
            id=uuid.uuid4(),
            repo_id=repo.id,
            thread_id=thread_id,
            trigger="manual",
            status="running",
        )
        db.add(pipeline_run)
        await db.flush()
        await db.commit()

        initial_state = DevDocState(
            user_id=str(user.id),
            repo_id=str(repo.id),
            repo_full_name=repo.full_name,
            encrypted_github_token=user.github_access_token,
            pipeline_run_id=str(pipeline_run.id),
            thread_id=thread_id,
            trigger="manual",
            last_processed_commit=repo.last_processed_commit,  # For incremental diff
        )

        task = asyncio.create_task(_run_pipeline_bg(initial_state, pipeline_run.id))
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)

        return {"status": "pipeline_started", "thread_id": thread_id}

    @staticmethod
    async def get_latest_thread(repo_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> dict:
        repo = await RepoRepository.get_by_id(repo_id, db)
        if not repo or repo.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found",
            )

        run = await RepoRepository.get_latest_pipeline_run(repo_id, db)
        if not run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pipeline run found for this repo yet",
        )

        return {"thread_id": run.thread_id}

    @staticmethod
    async def list_pipeline_runs(
        repo_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession, limit: int = 10
    ) -> list[dict]:
        """Recent pipeline runs for a repo, newest first — taaki dikhe
        ki bade repo ka run abhi chal raha hai ya kahin atak gaya."""
        repo = await RepoRepository.get_by_id(repo_id, db)
        if not repo or repo.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found",
            )

        result = await db.execute(
            select(PipelineRun)
            .where(PipelineRun.repo_id == repo.id)
            .order_by(desc(PipelineRun.started_at))
            .limit(limit)
        )
        runs = result.scalars().all()
        return [
            {
                "id": str(r.id),
                "thread_id": r.thread_id,
                "trigger": r.trigger,
                "pr_number": r.pr_number,
                "status": r.status,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in runs
        ]
