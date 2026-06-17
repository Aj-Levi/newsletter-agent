from typing import TypedDict, Optional, List, Dict

class NewsletterState(TypedDict):
    # Input (populated before graph starts)
    subscription_id: str
    topic: str
    subtopics: List[str]
    depth_level: str          # "beginner" | "intermediate" | "expert"
    tone: str                 # "technical" | "casual" | "executive"
    pinned_sources: List[str]
    excluded_sources: List[str]
    delivery_email: str
    run_id: str

    # Query Planner output
    generated_queries: List[str]

    # Web Search output
    raw_results: List[Dict]

    # Ranker output
    ranked_results: List[Dict]
    avg_relevance_score: float
    retry_count: int

    # Writer output
    subject_line: str
    top_stories: List[Dict]   # [{title, summary, url}]
    deep_dive: Dict           # {title, content}
    worth_watching: List[Dict] # [{title, summary}]
    closing_line: str

    # Formatter output
    html_content: str

    # Delivery output
    delivery_status: str      # "sent" | "failed"
    delivery_error: Optional[str]

    # Metadata
    error_message: Optional[str]
    completed_at: Optional[str]
