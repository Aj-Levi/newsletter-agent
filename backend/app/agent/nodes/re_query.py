from app.agent.state import NewsletterState

async def re_query_node(state: NewsletterState) -> dict:
    """
    Broaden the search queries and clear results for a fresh pass.
    Strips overly specific terms to widen the net.
    """
    topic = state["topic"]
    subtopics = state["subtopics"]
    retry_count = state["retry_count"]

    # Simpler, broader fallback queries
    broader_queries = [
        f"{topic} news",
        f"{topic} overview",
        f"latest {topic} updates",
        f"{topic} 2025",
    ]

    if subtopics:
        broader_queries.append(f"{subtopics[0]} news")

    return {
        "generated_queries": broader_queries,
        "raw_results": [],          # clear so web_search starts fresh
        "retry_count": retry_count + 1,
    }