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

    # Generate embedding using Cohere
    vector = embeddings.embed_query(content)

    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload={
            "doc_id": doc_id,
            "file_path": metadata.get("file_path", ""),
            "module_name": metadata.get("module_name", ""),
            "repo_id": metadata.get("repo_id", ""),
            "content": content[:4000],   # store first 1000 chars for retrieval context
        }
    )
    await client.upsert(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        points=[point]
    )

    await client.close()
    return str(point.id)

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