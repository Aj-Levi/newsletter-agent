from tavily import AsyncTavilyClient
from app.core.config import settings

_client: AsyncTavilyClient | None = None


def get_tavily_client() -> AsyncTavilyClient:
    global _client
    if _client is None:
        _client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
    return _client


async def search(
    query: str,
    pinned_sources: list[str],
    excluded_sources: list[str],
) -> list[dict]:
    client = get_tavily_client()

    kwargs: dict = {
        "query": query,
        "search_depth": "advanced",
        "max_results": 5,
        "include_answer": False,
    }
    if pinned_sources:
        kwargs["include_domains"] = pinned_sources
    if excluded_sources:
        kwargs["exclude_domains"] = excluded_sources

    response = await client.search(**kwargs)
    results = response.get("results", [])

    # Tag each result with which query found it
    for r in results:
        r["query_source"] = query

    return results