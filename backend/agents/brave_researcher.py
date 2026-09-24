import asyncio
from functools import partial
from tavily import TavilyClient
from graph.state import DevDocState
from config import get_settings

settings = get_settings()

_tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY) if settings.TAVILY_API_KEY else None

# Max concurrent Tavily HTTP calls. TavilyClient.search is sync/blocking,
# so each call runs in a thread — the semaphore caps how many fly at once.
_tavily_semaphore = asyncio.Semaphore(5)


async def tavily_search(query: str, count: int = 3) -> list[dict]:
    """
    Search Tavily for external context about a library or concept.
    Returns top results with title, url, description.
    Sync client → runs in a thread so the event loop stays free.
    """
    if not _tavily_client:
        return []

    try:
        async with _tavily_semaphore:
            response = await asyncio.to_thread(
                partial(_tavily_client.search, query=query, max_results=count)
            )
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "description": (r.get("content") or "")[:200],
            }
            for r in response.get("results", [])
        ]
    except Exception as e:
        print(f"⚠️ Tavily search failed: {e}")
        return []


def extract_key_imports(module: dict) -> list[str]:
    """
    Extract third-party library names from imports.
    Skip stdlib and local imports.
    """
    stdlib = {
        "os", "sys", "json", "re", "uuid", "datetime", "typing",
        "pathlib", "collections", "itertools", "functools", "abc",
        "asyncio", "logging", "enum", "dataclasses", "base64",
    }

    third_party = []
    for imp in module.get("imports", []):
        root = imp.split(".")[0]
        if root and root not in stdlib and not root.startswith("_"):
            third_party.append(root)

    return list(set(third_party))


async def _enrich_doc(doc: dict, parsed_modules: list[dict]) -> dict:
    """Enrich a single doc with Tavily results for its third-party imports."""
    parsed = next(
        (m for m in parsed_modules if m["file_path"] == doc["file_path"]),
        None
    )
    if not parsed:
        return doc

    libraries = extract_key_imports(parsed)
    if not libraries:
        return doc

    # Search all of this doc's libraries concurrently (semaphore caps at 5)
    results_per_lib = await asyncio.gather(
        *[
            tavily_search(f"{lib} Python library best practices documentation", count=2)
            for lib in libraries[:3]
        ]
    )
    external_links = [r for results in results_per_lib for r in results]

    if external_links:
        resources_section = "\n\n## 🔗 External Resources\n"
        for link in external_links[:4]:
            resources_section += f"- [{link['title']}]({link['url']}) — {link['description'][:100]}\n"
        print(f"✅ Enriched: {doc['file_path']} ({len(external_links)} links)")
        return {**doc, "content": doc["content"] + resources_section}

    return doc


async def brave_researcher_node(state: DevDocState) -> dict:
    """
    LangGraph node — enriches generated docs with external context via Tavily.
    All docs are enriched concurrently (previously: one doc at a time, and
    within a doc, one library search at a time).

    If Tavily isn't configured, gracefully skips enrichment instead of
    crashing the pipeline — docs pass through unchanged.
    """
    if not _tavily_client:
        print("⚠️ Tavily not configured, skipping enrichment")
        return {
            "enriched_docs": state.generated_docs,
            "current_step": "brave_researcher",
        }

    print(f"🔍 Enriching {len(state.generated_docs)} docs with Tavily (concurrent)")

    results = await asyncio.gather(
        *[_enrich_doc(doc, state.parsed_modules) for doc in state.generated_docs],
        return_exceptions=True,
    )

    enriched_docs = []
    for doc, result in zip(state.generated_docs, results):
        if isinstance(result, Exception):
            print(f"⚠️ Enrichment failed for {doc['file_path']}: {result} — using plain doc")
            enriched_docs.append(doc)
        else:
            enriched_docs.append(result)

    return {
        "enriched_docs": enriched_docs,
        "current_step": "brave_researcher",
    }
