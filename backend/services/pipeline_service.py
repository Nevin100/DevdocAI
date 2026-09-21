from fastapi import HTTPException, status
from graph.pipeline import get_compiled_pipeline, resume_pipeline
from schemas.pipeline_schemas import PipelineStateResponse, ReviewRequest, ReviewResponse

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
        Resumes the paused LangGraph pipeline with their decision.
        """
        if body.review_status not in ("approved", "rejected"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="review_status must be 'approved' or 'rejected'",
            )

        doc_graph, _ = await get_compiled_pipeline()

        await resume_pipeline(
            thread_id=body.thread_id,
            review_status=body.review_status,
            dev_notes=body.dev_notes,
            doc_graph=doc_graph,
        )

        return ReviewResponse(status="resumed", thread_id=body.thread_id)
