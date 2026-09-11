from tavily import TavilyClient
from graph.state import DevDocState
from config import get_settings

settings = get_settings()

_tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY) if settings.TAVILY_API_KEY else None


async def tavily_search(query: str, count: int = 3) -> list[dict]:
    """
    Search Tavily for external context about a library or concept.
    Returns top results with title, url, description.
    """
    if not _tavily_client:
        return []

    try:
        response = _tavily_client.search(query=query, max_results=count)
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


async def brave_researcher_node(state: DevDocState) -> dict:
    """
    LangGraph node — enriches generated docs with external context via Tavily.

    If Tavily isn't configured, gracefully skips enrichment instead of
    crashing the pipeline — docs pass through unchanged.
    """
    if not _tavily_client:
        print("⚠️ Tavily not configured, skipping enrichment")
        return {
            "enriched_docs": state.generated_docs,
            "current_step": "brave_researcher",
        }

    print(f"🔍 Enriching {len(state.generated_docs)} docs with Tavily")

    enriched_docs = []

    for doc in state.generated_docs:
        parsed = next(
            (m for m in state.parsed_modules if m["file_path"] == doc["file_path"]),
            None
        )

        if not parsed:
            enriched_docs.append(doc)
            continue

        libraries = extract_key_imports(parsed)

        if not libraries:
            enriched_docs.append(doc)
            continue

        external_links = []
        for lib in libraries[:3]:
            query = f"{lib} Python library best practices documentation"
            results = await tavily_search(query, count=2)
            external_links.extend(results)
            print(f"🌐 Searched: {lib} → {len(results)} results")

        if external_links:
            resources_section = "\n\n## 🔗 External Resources\n"
            for link in external_links[:4]:
                resources_section += f"- [{link['title']}]({link['url']}) — {link['description'][:100]}\n"

            enriched_doc = {**doc, "content": doc["content"] + resources_section}
        else:
            enriched_doc = doc

        enriched_docs.append(enriched_doc)
        print(f"✅ Enriched: {doc['file_path']}")

    return {
        "enriched_docs": enriched_docs,
        "current_step": "brave_researcher",
    }