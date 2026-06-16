from datetime import datetime, timezone
from urllib.parse import urlparse

SOURCE_CREDIBILITY: dict[str, float] = {
    "arxiv.org": 1.0,
    "nature.com": 1.0,
    "science.org": 1.0,
    "mit.edu": 0.95,
    "stanford.edu": 0.95,
    "techcrunch.com": 0.9,
    "wired.com": 0.9,
    "reuters.com": 0.9,
    "bloomberg.com": 0.9,
    "theverge.com": 0.85,
    "arstechnica.com": 0.85,
    "thenextweb.com": 0.8,
    "venturebeat.com": 0.8,
    "medium.com": 0.5,
    "reddit.com": 0.3,
    "quora.com": 0.3,
}
DEFAULT_CREDIBILITY = 0.6


def extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


def compute_recency_score(published_date: str | None) -> float:
    if not published_date:
        return 0.5
    try:
        pub = datetime.fromisoformat(published_date.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        hours_old = (now - pub).total_seconds() / 3600
        if hours_old <= 24:
            return 1.0
        elif hours_old <= 48:
            return 0.85
        elif hours_old <= 72:
            return 0.7
        elif hours_old <= 168:  # 1 week
            return 0.5
        else:
            return 0.2
    except Exception:
        return 0.5


def compute_credibility_score(domain: str) -> float:
    return SOURCE_CREDIBILITY.get(domain, DEFAULT_CREDIBILITY)


def compute_length_score(content: str) -> float:
    word_count = len(content.split()) if content else 0
    if word_count >= 100:
        return 1.0
    elif word_count >= 50:
        return 0.7
    return 0.3


def compute_final_score(
    tavily_score: float,
    recency_score: float,
    credibility_score: float,
    length_score: float,
) -> float:
    return (
        0.4 * tavily_score
        + 0.3 * recency_score
        + 0.2 * credibility_score
        + 0.1 * length_score
    )


def rank_results(raw_results: list[dict]) -> list[dict]:
    """Score, sort, deduplicate, and return top 10 results."""
    seen_urls: set[str] = set()
    scored: list[dict] = []

    for result in raw_results:
        url = result.get("url", "")
        if url in seen_urls:
            continue
        seen_urls.add(url)

        domain = extract_domain(url)
        tavily_score = float(result.get("score", 0.5))
        recency_score = compute_recency_score(result.get("published_date"))
        credibility_score = compute_credibility_score(domain)
        length_score = compute_length_score(result.get("content", ""))
        final_score = compute_final_score(
            tavily_score, recency_score, credibility_score, length_score
        )

        scored.append({
            **result,
            "domain": domain,
            "tavily_score": tavily_score,
            "recency_score": recency_score,
            "credibility_score": credibility_score,
            "length_score": length_score,
            "final_score": final_score,
        })

    scored.sort(key=lambda x: x["final_score"], reverse=True)
    return scored[:10]


def compute_avg_score(ranked_results: list[dict]) -> float:
    if not ranked_results:
        return 0.0
    return sum(r["final_score"] for r in ranked_results) / len(ranked_results)