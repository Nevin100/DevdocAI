import asyncio
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import uuid

from auth.jwt import get_current_user
from graph.pipeline import get_compiled_pipeline
from schemas.pipeline_schemas import PipelineStateResponse, ReviewRequest, ReviewResponse
from services.pipeline_service import PipelineService

router = APIRouter()

@router.get("/pipeline/{thread_id}/state", response_model=PipelineStateResponse)
async def get_pipeline_state(
    thread_id: str,
    user_id: uuid.UUID = Depends(get_current_user),
):
    return await PipelineService.get_state(thread_id)


@router.post("/pipeline/review", response_model=ReviewResponse)
async def submit_review(
    body: ReviewRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    return await PipelineService.submit_review(body)


async def _stream_pipeline_state(thread_id: str, user_id: uuid.UUID):
    doc_graph, _ = await get_compiled_pipeline()
    config = {"configurable": {"thread_id": thread_id}}

    while True:
        try:
            snapshot = await doc_graph.aget_state(config)

            if snapshot is None or snapshot.values is None:
                yield f"data: {json.dumps({'error': 'Pipeline not found', 'thread_id': thread_id})}\n\n"
                break

            values = snapshot.values
            next_nodes = snapshot.next or ()
            current_step = next_nodes[0] if next_nodes else values.get("current_step", "unknown")
            if current_step == "__interrupt__" or "human_review" in next_nodes:
                current_step = "human_review"

            data = {
                "thread_id": thread_id,
                "current_step": current_step,
                "review_status": values.get("review_status", "pending"),
                "completed": values.get("completed", False),
            }

            yield f"data: {json.dumps(data)}\n\n"

            if current_step == "human_review" or values.get("completed", False):
                break

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'thread_id': thread_id})}\n\n"
            break

        await asyncio.sleep(3)


@router.get("/pipeline/{thread_id}/stream")
async def stream_pipeline_state(
    thread_id: str,
    user_id: uuid.UUID = Depends(get_current_user),
):
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        _stream_pipeline_state(thread_id, user_id),
        media_type="text/event-stream",
        headers=headers,
    )