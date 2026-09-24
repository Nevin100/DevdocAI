import uuid
from sqlalchemy import select, delete

from graph.state import DevDocState
from db.models import Document, DocStatus, Repository, RepoStatus
from vectorstore.qdrant_store import store_documents_batch, delete_document
from db.database import async_session_local


async def doc_publisher_node(state: DevDocState) -> dict:
    """
    LangGraph node — saves approved docs to PostgreSQL and Qdrant.
    Handles incremental updates: adds/modifies changed files, removes deleted files.

    Steps:
    1. For removed files → delete from Document table and Qdrant
    2. Phase 1: upsert all Document rows in PostgreSQL
    3. Phase 2: ONE batch embed + upsert of all docs into Qdrant
    4. Update Repository.last_processed_commit to current HEAD
    5. Mark the Repository as completed with a last_parsed_at timestamp
    6. Return published_doc_ids and vector_ids
    """
    print(f"📤 Publishing {len(state.enriched_docs)} docs (mode: {state.processing_mode})")

    published_doc_ids = []
    vector_ids = []
    removed_doc_ids = []

    async with async_session_local() as db:
        # Handle removed files first
        removed_files = getattr(state, 'removed_files', [])
        if removed_files:
            print(f"🗑️ Removing {len(removed_files)} deleted files from docs")
            for file_path in removed_files:
                result = await db.execute(
                    select(Document).where(
                        Document.repo_id == uuid.UUID(state.repo_id),
                        Document.file_path == file_path,
                    )
                )
                existing = result.scalar_one_or_none()
                if existing:
                    # Delete from Qdrant
                    if existing.vector_id:
                        await delete_document(existing.vector_id)
                        print(f"🗑️ Deleted from vector store: {file_path}")
                    # Delete from DB
                    await db.delete(existing)
                    removed_doc_ids.append(str(existing.id))
                    print(f"🗑️ Deleted from DB: {file_path}")

        # Phase 1: upsert all Document rows in PostgreSQL (no Qdrant calls yet)
        db_docs: list[tuple[Document, dict]] = []
        for doc in state.enriched_docs:
            result = await db.execute(
                select(Document).where(
                    Document.repo_id == uuid.UUID(state.repo_id),
                    Document.file_path == doc["file_path"],
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                existing.content = doc["content"]
                existing.status = DocStatus.PUBLISHED
                existing.dev_notes = state.dev_notes or None
                db_doc = existing
            else:
                db_doc = Document(
                    id=uuid.UUID(doc["doc_id"]),
                    repo_id=uuid.UUID(state.repo_id),
                    file_path=doc["file_path"],
                    module_name=doc["module_name"],
                    content=doc["content"],
                    status=DocStatus.PUBLISHED,
                    dev_notes=state.dev_notes or None,
                )
                db.add(db_doc)

            await db.flush()
            db_docs.append((db_doc, doc))

        # Phase 2: ONE batch embed + upsert for all docs
        if db_docs:
            batch_payload = [
                {
                    "doc_id": str(db_doc.id),
                    "content": doc["content"],
                    "file_path": doc["file_path"],
                    "module_name": doc["module_name"],
                    "repo_id": state.repo_id,
                }
                for db_doc, doc in db_docs
            ]
            batch_vector_ids = await store_documents_batch(batch_payload)

            for (db_doc, doc), vector_id in zip(db_docs, batch_vector_ids):
                db_doc.vector_id = vector_id
                published_doc_ids.append(str(db_doc.id))
                vector_ids.append(vector_id)
                print(f"✅ Published: {doc['file_path']}")

        # Update Repository with latest commit and timestamp
        repo_result = await db.execute(
            select(Repository).where(Repository.id == uuid.UUID(state.repo_id))
        )
        repo = repo_result.scalar_one_or_none()
        if repo:
            repo.status = RepoStatus.COMPLETED
            from datetime import datetime
            repo.last_parsed_at = datetime.utcnow()
            # Update last processed commit to current HEAD
            if state.current_head_commit:
                repo.last_processed_commit = state.current_head_commit
                print(f"📌 Updated last_processed_commit: {state.current_head_commit[:8]}")

        await db.commit()

    return {
        "published_doc_ids": published_doc_ids,
        "vector_ids": vector_ids,
        "removed_doc_ids": removed_doc_ids,
        "current_step": "doc_publisher",
        "completed": True,
    }
