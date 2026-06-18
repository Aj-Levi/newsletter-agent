import json
from app.agent.state import NewsletterState
from app.core.llm import llm

TONE_INSTRUCTIONS = {
    "technical": "Write in a precise, technical tone. Use correct terminology. Assume the reader is a domain expert.",
    "casual": "Write in a friendly, conversational tone. Use simple language. Make it engaging and easy to read.",
    "executive": "Write in a concise, business-focused tone. Lead with impact and key takeaways. Busy executives are your audience.",
}

DEPTH_INSTRUCTIONS = {
    "beginner": "Explain concepts clearly. Avoid deep jargon. Provide context for technical terms.",
    "intermediate": "Assume working knowledge of the field. Balance clarity with depth.",
    "expert": "Go deep. Include technical nuances, data points, and nuanced analysis.",
}

async def writer_node(state: NewsletterState) -> dict:
    topic = state["topic"]
    subtopics = state["subtopics"]
    tone = state["tone"]
    depth_level = state["depth_level"]
    ranked_results = state["ranked_results"]

    tone_instruction = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["casual"])
    depth_instruction = DEPTH_INSTRUCTIONS.get(depth_level, DEPTH_INSTRUCTIONS["intermediate"])

    # Build source context for the LLM
    sources_context = ""
    for i, result in enumerate(ranked_results[:10], 1):
        sources_context += f"""
Source {i}:
Title: {result.get('title', 'N/A')}
URL: {result.get('url', '')}
Content: {result.get('content', '')[:500]}
Published: {result.get('published_date', 'Unknown')}
---"""

    subtopics_str = ", ".join(subtopics) if subtopics else topic

    prompt = f"""You are an expert newsletter writer. Write a newsletter based on the sources below.

Topic: {topic}
Subtopics: {subtopics_str}
Tone instruction: {tone_instruction}
Depth instruction: {depth_instruction}

SOURCES:
{sources_context}

Write the newsletter and return ONLY a valid JSON object with this exact structure:
{{
  "subject_line": "A compelling email subject line (max 60 chars)",
  "top_stories": [
    {{
      "title": "Story headline",
      "summary": "2-3 sentence summary of the story",
      "url": "source URL"
    }}
  ],
  "deep_dive": {{
    "title": "Deep dive section title",
    "content": "3-4 paragraphs exploring one key topic in depth"
  }},
  "worth_watching": [
    {{
      "title": "Trend or development title",
      "summary": "1-2 sentence description of why this matters"
    }}
  ],
  "closing_line": "A single punchy closing thought or call to action"
}}

Rules:
- top_stories: exactly 3-5 items, use real URLs from the sources
- deep_dive: pick the most interesting topic and go deep on it
- worth_watching: exactly 2-3 emerging trends or things to keep an eye on
- closing_line: max 1 sentence, make it memorable
- Return ONLY the JSON object, no markdown fences, no extra text"""

    response = await llm.ainvoke([{"role": "user", "content": prompt}], temperature=0.7)

    try:
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
    except Exception as e:
        # Fallback structure if parsing fails
        data = {
            "subject_line": f"Your {topic} Newsletter",
            "top_stories": [
                {
                    "title": r.get("title", ""),
                    "summary": r.get("content", "")[:200],
                    "url": r.get("url", ""),
                }
                for r in ranked_results[:3]
            ],
            "deep_dive": {
                "title": f"What's happening in {topic}",
                "content": "Unable to generate deep dive content at this time.",
            },
            "worth_watching": [{"title": "Stay tuned", "summary": "More updates coming soon."}],
            "closing_line": f"Stay curious about {topic}.",
        }

    return {
        "subject_line": data.get("subject_line", f"Your {topic} Newsletter"),
        "top_stories": data.get("top_stories", []),
        "deep_dive": data.get("deep_dive", {}),
        "worth_watching": data.get("worth_watching", []),
        "closing_line": data.get("closing_line", ""),
    }