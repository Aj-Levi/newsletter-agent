import json
import uuid
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from app.agent.graph import newsletter_graph
from app.db.prisma import db

def calculate_next_run(
    schedule_type: str,
    day_of_week: int | None,
    hour: int | None,
    minute: int | None,
    timezone_str: str = "Asia/Kolkata",
) -> datetime | None:
    """
    Calculate the next scheduled run time in UTC based on the user's timezone.
    - schedule_type: "DAILY" | "WEEKLY" | "MANUAL"
    - day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
    - hour: 0-23
    - minute: 0-59
    """
    if schedule_type == "MANUAL":
        return None

    try:
        tz = ZoneInfo(timezone_str)
    except Exception:
        tz = ZoneInfo("Asia/Kolkata")

    now_local = datetime.now(tz)
    target_hour = hour if hour is not None else 8
    target_minute = minute if minute is not None else 0

    if schedule_type == "DAILY":
        next_run = now_local.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
        if next_run <= now_local:
            next_run += timedelta(days=1)
        return next_run.astimezone(ZoneInfo("UTC"))

    elif schedule_type == "WEEKLY":
        if day_of_week is None:
            day_of_week = 1  # default Monday
        
        # Mapping:
        # DB day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        # Python weekday(): 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
        python_weekday_map = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}
        target_weekday = python_weekday_map.get(day_of_week, 0)

        next_run = now_local.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
        days_ahead = target_weekday - now_local.weekday()
        
        # If it's today but the time has passed, or it's later in the week
        if days_ahead < 0 or (days_ahead == 0 and next_run <= now_local):
            days_ahead += 7
            
        next_run += timedelta(days=days_ahead)
        return next_run.astimezone(ZoneInfo("UTC"))

    return None


async def run_subscription(subscription_id: str) -> None:
    """
    Execute a full agent run for a subscription and save outputs.
    """
    # 1. Fetch subscription details
    sub = await db.subscription.find_unique(
        where={"id": subscription_id},
        include={"user": True}
    )
    if not sub:
        print(f"Subscription {subscription_id} not found in database.")
        return

    # 2. Mark status as RUNNING in DB
    await db.subscription.update(
        where={"id": subscription_id},
        data={"status": "RUNNING"}
    )

    # 3. Create a pending NewsletterRun in DB
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    run = await db.newsletterrun.create(
        data={
            "id": run_id,
            "subscriptionId": subscription_id,
            "status": "RUNNING",
            "triggerType": "SCHEDULED",
            "deliveryStatus": "PENDING",
        }
    )

    # 4. Prepare initial state payload
    initial_state = {
        "subscription_id": sub.id,
        "topic": sub.topic,
        "subtopics": sub.subtopics or [],
        "depth_level": sub.depthLevel.lower(),
        "tone": sub.tone.lower(),
        "pinned_sources": sub.pinnedSources or [],
        "excluded_sources": sub.excludedSources or [],
        "delivery_email": sub.deliveryEmail,
        "run_id": run_id,
        
        # State placeholders
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
        # 5. Run LangGraph compilation workflow
        final_state = await newsletter_graph.ainvoke(initial_state)
        
        # 6. Save the run outcome to database
        run_status = "COMPLETED" if final_state["delivery_status"] == "sent" else "FAILED"
        
        await db.newsletterrun.update(
            where={"id": run_id},
            data={
                "status": run_status,
                "subjectLine": final_state["subject_line"],
                "topStories": json.dumps(final_state["top_stories"]),
                "deepDive": json.dumps(final_state["deep_dive"]),
                "worthWatching": json.dumps(final_state["worth_watching"]),
                "closingLine": final_state["closing_line"],
                "htmlContent": final_state["html_content"],
                "deliveryStatus": "SENT" if final_state["delivery_status"] == "sent" else "FAILED",
                "deliveryError": final_state["delivery_error"],
                "totalSourcesFound": len(final_state["raw_results"]),
                "sourcesUsed": len(final_state["ranked_results"]),
                "avgRelevanceScore": final_state["avg_relevance_score"],
                "queriesGenerated": json.dumps(final_state["generated_queries"]),
                "retryCount": final_state["retry_count"],
                "completedAt": datetime.now(timezone.utc),
            }
        )

        # 7. Save used sources
        top_urls = {story.get("url") for story in final_state["top_stories"] if story.get("url")}
        
        for idx, src in enumerate(final_state["ranked_results"]):
            url = src.get("url", "")
            if not url:
                continue
                
            used_section = "TOP_STORIES" if url in top_urls else "DISCARDED"
            
            await db.newslettersource.create(
                data={
                    "newsletterRunId": run_id,
                    "url": url,
                    "domain": src.get("domain", ""),
                    "title": src.get("title", "No Title"),
                    "snippet": src.get("snippet", ""),
                    "tavilyScore": float(src.get("tavily_score", 0.5)),
                    "recencyScore": float(src.get("recency_score", 0.5)),
                    "credibilityScore": float(src.get("credibility_score", 0.5)),
                    "finalScore": float(src.get("final_score", 0.5)),
                    "usedInSection": used_section,
                }
            )

        # 8. Reset subscription state and update times
        timezone_str = sub.user.timezone if sub.user else "Asia/Kolkata"
        next_run_time = calculate_next_run(
            sub.scheduleType,
            sub.scheduleDayOfWeek,
            sub.scheduleHour,
            sub.scheduleMinute,
            timezone_str
        )

        await db.subscription.update(
            where={"id": subscription_id},
            data={
                "status": "ACTIVE" if run_status == "COMPLETED" else "FAILED",
                "lastRunAt": datetime.now(timezone.utc),
                "nextRunAt": next_run_time,
            }
        )

    except Exception as e:
        print(f"Error running scheduler execution for {subscription_id}: {str(e)}")
        # Fail gracefully
        await db.newsletterrun.update(
            where={"id": run_id},
            data={
                "status": "FAILED",
                "errorMessage": str(e),
                "completedAt": datetime.now(timezone.utc),
            }
        )
        await db.subscription.update(
            where={"id": subscription_id},
            data={
                "status": "FAILED",
                "lastRunAt": datetime.now(timezone.utc),
            }
        )
