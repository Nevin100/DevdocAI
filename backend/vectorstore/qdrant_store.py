import asyncio
import uuid
from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, PayloadSchemaType
from vectorstore.embeddings import embeddings
from config import get_settings

settings = get_settings()

# Huggingface embed (sentence transformers) produces 384-dim vectors
VECTOR_SIZE = 384

def get_qdrant_client() -> QdrantClient:
    """Sync Qdrant client"""
    return QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY or None,
    )

def get_async_qdrant_client() -> AsyncQdrantClient:
    """Async Qdrant client — use in FastAPI routes"""
    return AsyncQdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY or None,
    )

async def ensure_collection_exists():
    """
    Create Qdrant collection if it doesn't exist yet.
    Called once on startup.
    """
    client = get_async_qdrant_client()
    collections = await client.get_collections()
    existing = [c.name for c in collections.collections]

    if settings.QDRANT_COLLECTION_NAME not in existing:
        await client.create_collection(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,   # cosine similarity for semantic search
            )
        )
        print(f"✅ Qdrant collection created: {settings.QDRANT_COLLECTION_NAME}")

        # Create an index on repo_id so we can filter searches by it —
        # Qdrant Cloud requires this explicitly (unlike some local setups).
        await client.create_payload_index(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            field_name="repo_id",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        print("✅ Index created on repo_id")

    else:
        print(f"✅ Qdrant collection exists: {settings.QDRANT_COLLECTION_NAME}")

    await client.close()

async def store_document(doc_id: str, content: str, metadata: dict) -> str:
    """
    Embed a doc and store it in Qdrant.
    Returns the vector ID.
    """
    client = get_async_qdrant_client()

    # Generate embedding using sentence-transformers (runs in a thread so the
    # event loop isn't blocked by the sync HF call)
    vector = await asyncio.to_thread(embeddings.embed_query, content)

    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload={
            "doc_id": doc_id,
            "file_path": metadata.get("file_path", ""),
            "module_name": metadata.get("module_name", ""),
            "repo_id": metadata.get("repo_id", ""),
            "content": content[:4000],   # store first 4000 chars for retrieval context
        }
    )
    await client.upsert(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        points=[point]
    )

    await client.close()
    return str(point.id)

async def store_documents_batch(docs: list[dict]) -> list[str]:
    """
    Embed + upsert MANY docs with ONE Qdrant client, ONE batch embedding call,
    and ONE upsert — instead of N clients + N embedding calls + N upserts.

    Each doc: {"doc_id": str, "content": str, "file_path": str,
               "module_name": str, "repo_id": str}
    Returns vector IDs in the same order as input.
    """
    if not docs:
        return []

    client = get_async_qdrant_client()
    try:
        # ONE embedding call for all docs. HF batches internally and it's
        # sync/CPU-bound, so run it in a thread to keep the event loop free.
        contents = [d["content"] for d in docs]
        vectors = await asyncio.to_thread(embeddings.embed_documents, contents)

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "doc_id": d["doc_id"],
                    "file_path": d.get("file_path", ""),
                    "module_name": d.get("module_name", ""),
                    "repo_id": d.get("repo_id", ""),
                    "content": d["content"][:4000],   # first 4000 chars for retrieval
                },
            )
            for d, vector in zip(docs, vectors)
        ]

        # ONE upsert for all points
        await client.upsert(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points=points,
        )
        print(f"📦 Batch upserted {len(points)} vectors to Qdrant")
        return [str(p.id) for p in points]
    finally:
        await client.close()

async def search_documents(query: str, repo_id: str, top_k: int = 5) -> list[dict]:
    """
    Semantic search over stored docs.
    Filters by repo_id so chatbot only searches the right repo's docs.
    """
    client = get_async_qdrant_client()

    # Embed the query
    query_vector = embeddings.embed_query(query)

    results = await client.search(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        query_vector=query_vector,
        limit=top_k,
        query_filter={
            "must": [
                {"key": "repo_id", "match": {"value": repo_id}}
            ]
        },
        with_payload=True,
    )

    await client.close()
    return [
        {
            "score": hit.score,
            "doc_id": hit.payload.get("doc_id"),
            "file_path": hit.payload.get("file_path"),
            "module_name": hit.payload.get("module_name"),
            "content": hit.payload.get("content"),
        }
        for hit in results
    ]


async def delete_document(vector_id: str) -> bool:
    """
    Delete a document from Qdrant by vector ID.
    """
    client = get_async_qdrant_client()

    try:
        await client.delete(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points_selector=[vector_id]
        )
        await client.close()
        return True
    except Exception as e:
        print(f"⚠️ Failed to delete document from Qdrant: {e}")
        await client.close()
        return False
