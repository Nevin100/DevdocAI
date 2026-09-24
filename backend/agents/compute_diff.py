from graph.state import DevDocState
from mcp.github_server import get_commit_diff, get_latest_commit_sha
from db.database import async_session_local
from db.models import Repository
from sqlalchemy import select
import uuid


async def compute_diff_node(state: DevDocState) -> dict:
    """
    LangGraph node — computes diff between last processed commit and current HEAD.
    
    Steps:
    1. Get last_processed_commit from Repository (or state if provided via webhook)
    2. Get current HEAD commit SHA from GitHub
    3. If no last_processed_commit → full processing mode
    4. If last_processed_commit exists → compute diff, set changed_files
    5. Return diff info and processing_mode
    """
    print(f"🔍 Computing diff for repo: {state.repo_full_name}")
    
    # Get last processed commit from database
    last_commit = state.last_processed_commit
    
    if not last_commit:
        async with async_session_local() as db:
            result = await db.execute(
                select(Repository).where(Repository.id == uuid.UUID(state.repo_id))
            )
            repo = result.scalar_one_or_none()
            if repo:
                last_commit = repo.last_processed_commit
    
    # Get current HEAD commit
    head_result = await get_latest_commit_sha.ainvoke({
        "encrypted_token": state.encrypted_github_token,
        "repo_full_name": state.repo_full_name,
        "branch": "main",  # TODO: use repo.default_branch
    })
    
    if "error" in head_result:
        return {
            "errors": state.errors + [f"Failed to get latest commit: {head_result['error']}"],
            "current_step": "compute_diff",
        }
    
    current_head = head_result["sha"]
    
    # Determine processing mode
    if not last_commit or last_commit == current_head:
        # First run or no changes
        processing_mode = "full" if not last_commit else "incremental_no_changes"
        print(f"📦 Processing mode: {processing_mode} (last: {last_commit}, head: {current_head})")
        
        return {
            "last_processed_commit": last_commit,
            "current_head_commit": current_head,
            "changed_files": [],
            "processing_mode": processing_mode,
            "current_step": "compute_diff",
        }
    
    # Compute diff
    diff_result = await get_commit_diff.ainvoke({
        "encrypted_token": state.encrypted_github_token,
        "repo_full_name": state.repo_full_name,
        "base_sha": last_commit,
        "head_sha": current_head,
    })
    
    if "error" in diff_result:
        print(f"⚠️ Diff failed, falling back to full processing: {diff_result['error']}")
        return {
            "last_processed_commit": last_commit,
            "current_head_commit": current_head,
            "changed_files": [],
            "processing_mode": "full",
            "current_step": "compute_diff",
        }
    
    changed_files = diff_result["changed_files"]
    print(f"📝 Diff computed: {len(changed_files)} Python files changed")
    print(f"   Added: {sum(1 for f in changed_files if f['status'] == 'added')}")
    print(f"   Modified: {sum(1 for f in changed_files if f['status'] == 'modified')}")
    print(f"   Removed: {sum(1 for f in changed_files if f['status'] == 'removed')}")
    print(f"   Renamed: {sum(1 for f in changed_files if f['status'] == 'renamed')}")
    
    return {
        "last_processed_commit": last_commit,
        "current_head_commit": current_head,
        "changed_files": changed_files,
        "processing_mode": "incremental",
        "current_step": "compute_diff",
    }