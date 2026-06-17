import json
from app.agent.state import NewsletterState
from app.core.llm import llm

DEPTH_INSTRUCTIONS = {
    "beginner": "Generate broad, accessible queries suitable for someone new to the topic. Avoid jargon. Focus on overviews, explainers, and trending news.",
    "intermediate": "Generate a mix of news, analysis, and trend queries. Assume the reader knows the basics.",
    "expert": "Generate technical, research-focused queries. Include queries targeting academic papers, technical deep-dives, and industry data.",
}

async def query_planner_node(state: NewsletterState) -> dict:
    topic = state["topic"]
    subtopics = state["subtopics"]
    depth_level = state["depth_level"]

    depth_instruction = DEPTH_INSTRUCTIONS.get(depth_level, DEPTH_INSTRUCTIONS["intermediate"])
    subtopics_str = ", ".join(subtopics) if subtopics else "general"

    prompt = f"""You are a research assistant planning web searches for a newsletter.

Topic: {topic}
Subtopics of interest: {subtopics_str}
Depth level instruction: {depth_instruction}

Generate exactly 5 diverse search queries that together cover:
1. Latest news and developments
2. Technical details or research (based on depth)
3. Industry trends and business impact
4. Expert opinions or analysis
5. One subtopic-specific query

Rules:
- Each query should be different in angle, not just rephrased versions of each other
- Queries should be specific enough to return high-quality results
- Do NOT include site: operators
- Return ONLY a valid JSON array of 5 strings, nothing else

Example output format:
["query one", "query two", "query three", "query four", "query five"]"""

    response = await llm.ainvoke([{"role": "user", "content": prompt}], temperature=0.8)

    try:
        raw = response.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        queries = json.loads(raw.strip())
        if not isinstance(queries, list):
            raise ValueError("Not a list")
        queries = [q for q in queries if isinstance(q, str)][:6]
    except Exception:
        # Fallback: generate basic queries from topic
        queries = [
            f"{topic} latest news 2025",
            f"{topic} recent developments",
            f"{topic} trends analysis",
            f"{subtopics_str} {topic}",
            f"{topic} expert insights",
        ]

    return {"generated_queries": queries}