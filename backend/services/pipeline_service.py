import asyncio
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import select
from graph.pipeline import get_compiled_pipeline, resume_pipeline
from schemas.pipeline_schemas import PipelineStateResponse, ReviewRequest, ReviewResponse
from db.models import PipelineRun

# Background tasks ke strong refs — warna GC beech me task maar dega
_background_tasks: set[asyncio.Task] = set()


async def _update_run_status(thread_id: str, new_status: str):
    """Set PipelineRun status (+ completed_at for terminal states)."""
    from db.database import async_session_local
    try:
        async with async_session_local() as db:
            result = await db.execute(
                select(PipelineRun).where(PipelineRun.thread_id == thread_id)
            )
            run = result.scalar_one_or_none()
            if run:
                run.status = new_status
                if new_status in ("completed", "failed"):
                    run.completed_at = datetime.utcnow()
                await db.commit()
    except Exception as e:
        print(f"⚠️ Could not update pipeline run status: {e}")


async def _resume_pipeline_bg(thread_id: str, review_status: str, dev_notes: str):
    """
    Resume the pipeline in the background.
    Approve ke baad doc_publisher (embeddings + Qdrant) bade repo pe minutes
    leta hai — request me await karne par Cloudflare 524 de deta hai.
    """
    await _update_run_status(thread_id, "running")
    try:
        doc_graph, _ = await get_compiled_pipeline()
        await resume_pipeline(
            thread_id=thread_id,
            review_status=review_status,
            dev_notes=dev_notes,
            doc_graph=doc_graph,
        )
        await _update_run_status(thread_id, "completed")
        print(f"✅ Pipeline resumed+finished — thread: {thread_id}")
    except Exception as e:
        await _update_run_status(thread_id, "failed")
        print(f"❌ Pipeline resume failed — thread {thread_id}: {e}")


class PipelineService:

    @staticmethod
    async def get_state(thread_id: str) -> PipelineStateResponse:
        """
        Reads the current paused/running state of a pipeline run
        straight from the LangGraph PostgreSQL checkpointer.
        """
        doc_graph, _ = await get_compiled_pipeline()
        config = {"configurable": {"thread_id": thread_id}}

        snapshot = await doc_graph.aget_state(config)

        if snapshot is None or snapshot.values is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pipeline run found for this thread_id",
            )

        values = snapshot.values

        # A checkpoint created by ``interrupt_before`` exposes the node that
        # will run next.  Some LangGraph versions instead expose an internal
        # ``__interrupt__`` marker, so normalise both representations for the
        # browser rather than making the UI depend on a library detail.
        next_nodes = snapshot.next or ()
        current_step = next_nodes[0] if next_nodes else values.get("current_step", "unknown")
        if current_step == "__interrupt__" or "human_review" in next_nodes:
            current_step = "human_review"

        return PipelineStateResponse(
            thread_id=thread_id,
            current_step=current_step,
            review_status=values.get("review_status", "pending"),
            generated_docs=values.get("enriched_docs") or values.get("generated_docs", []),
            completed=values.get("completed", False),
        )

    @staticmethod
    async def submit_review(body: ReviewRequest) -> ReviewResponse:
        """
        Called when a dev approves/rejects docs on the review page.
        Queues the resume in the background and returns immediately —
        the publish step can take minutes on big repos.
        """
        if body.review_status not in ("approved", "rejected"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="review_status must be 'approved' or 'rejected'",
            )

        task = asyncio.create_task(
            _resume_pipeline_bg(body.thread_id, body.review_status, body.dev_notes)
        )
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)

        return ReviewResponse(status="resumed", thread_id=body.thread_id)
