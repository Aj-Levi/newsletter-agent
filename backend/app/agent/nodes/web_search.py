import asyncio
from app.agent.state import NewsletterState
from app.services.tavily import search

async def web_search_node(state: NewsletterState) -> dict:
    queries = state["generated_queries"]
    pinned = state["pinned_sources"]
    excluded = state["excluded_sources"]

    # Fire all queries concurrently
    tasks = [search(query, pinned, excluded) for query in queries]
    results_per_query = await asyncio.gather(*tasks, return_exceptions=True)

    all_results: list[dict] = []
    seen_urls: set[str] = set()

    for results in results_per_query:
        if isinstance(results, Exception):
            continue  # skip failed queries silently
        for result in results:
            url = result.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append(result)

    return {"raw_results": all_results}