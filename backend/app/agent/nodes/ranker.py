from app.agent.state import NewsletterState
from app.services.ranking import rank_results, compute_avg_score

async def ranker_node(state: NewsletterState) -> dict:
    raw_results = state["raw_results"]
    ranked = rank_results(raw_results)
    avg_score = compute_avg_score(ranked)

    return {
        "ranked_results": ranked,
        "avg_relevance_score": avg_score,
    }