from langgraph.graph import StateGraph, END
from app.agent.state import NewsletterState
from app.agent.nodes.query_planner import query_planner_node
from app.agent.nodes.web_search import web_search_node
from app.agent.nodes.ranker import ranker_node
from app.agent.nodes.re_query import re_query_node
from app.agent.nodes.writer import writer_node
from app.agent.nodes.formatter import formatter_node
from app.agent.nodes.delivery import delivery_node

def quality_check_edge(state: NewsletterState) -> str:
    # Get retry count, default to 0 if not present
    retry_count = state.get("retry_count", 0)
    avg_score = state.get("avg_relevance_score", 0.0)
    
    if avg_score < 0.5 and retry_count < 2:
        return "re_query"
    return "proceed"

def build_newsletter_graph():
    graph = StateGraph(NewsletterState)

    # Add all nodes
    graph.add_node("query_planner", query_planner_node)
    graph.add_node("web_search", web_search_node)
    graph.add_node("ranker", ranker_node)
    graph.add_node("re_query", re_query_node)
    graph.add_node("writer", writer_node)
    graph.add_node("formatter", formatter_node)
    graph.add_node("delivery", delivery_node)

    # Define connectivity flow
    graph.set_entry_point("query_planner")
    graph.add_edge("query_planner", "web_search")
    graph.add_edge("web_search", "ranker")

    # Dynamic quality review branching
    graph.add_conditional_edges(
        "ranker",
        quality_check_edge,
        {
            "re_query": "re_query",
            "proceed": "writer"
        }
    )

    # Re-query loop
    graph.add_edge("re_query", "web_search")
    
    # Writing and formatting path
    graph.add_edge("writer", "formatter")
    graph.add_edge("formatter", "delivery")
    graph.add_edge("delivery", END)

    return graph.compile()

newsletter_graph = build_newsletter_graph()
