from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.agent.graph import newsletter_graph
from app.core.security import verify_secret

router = APIRouter()

class RunRequest(BaseModel):
    subscription_id: str
    topic: str
    subtopics: List[str] = Field(default_factory=list)
    depth_level: str          # "beginner" | "intermediate" | "expert"
    tone: str                 # "technical" | "casual" | "executive"
    pinned_sources: List[str] = Field(default_factory=list)
    excluded_sources: List[str] = Field(default_factory=list)
    delivery_email: str
    run_id: str

@router.post("", dependencies=[Depends(verify_secret)])
async def run_agent(payload: RunRequest):
    """
    Stateless endpoint to trigger the multi-step agentic newsletter compiler.
    Executes planning, search, ranking, formatting, and delivery.
    """
    # Initialize the LangGraph state
    initial_state = {
        "subscription_id": payload.subscription_id,
        "topic": payload.topic,
        "subtopics": payload.subtopics,
        "depth_level": payload.depth_level.lower(),
        "tone": payload.tone.lower(),
        "pinned_sources": payload.pinned_sources,
        "excluded_sources": payload.excluded_sources,
        "delivery_email": payload.delivery_email,
        "run_id": payload.run_id,
        
        # Initialize internal state fields
        "generated_queries": [],
        "raw_results": [],
        "ranked_results": [],
        "avg_relevance_score": 0.0,
        "retry_count": 0,
        "subject_line": "",
        "top_stories": [],
        "deep_dive": {},
        "worth_watching": [], 
        "closing_line": "",
        "html_content": "",
        "delivery_status": "pending",
        "delivery_error": None,
        "error_message": None,
        "completed_at": None,
    }

    try:
        # Run graph execution asynchronously
        final_state = await newsletter_graph.ainvoke(initial_state)
        return final_state
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Exception during agent run: {error_details}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent workflow execution failed: {str(e)}"
        )
