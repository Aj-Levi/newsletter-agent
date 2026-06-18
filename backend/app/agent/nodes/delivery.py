from datetime import datetime, timezone
from app.agent.state import NewsletterState
from app.services.resend import send_email
from app.core.config import settings

async def delivery_node(state: NewsletterState) -> dict:
    html = state["html_content"]
    subject = state["subject_line"]
    to_email = state["delivery_email"]
    subscription_id = state["subscription_id"]
    run_id = state["run_id"]

    # Replace placeholders with real URLs
    view_in_browser_url = f"{settings.FRONTEND_URL}/newsletter/{run_id}"
    unsubscribe_url = f"{settings.FRONTEND_URL}/unsubscribe/{subscription_id}"

    html = html.replace("{VIEW_IN_BROWSER_LINK}", view_in_browser_url)
    html = html.replace("{UNSUBSCRIBE_LINK}", unsubscribe_url)

    # First attempt
    result = await send_email(
        to=to_email,
        subject=subject,
        html=html,
        from_address=settings.RESEND_FROM_EMAIL,
    )

    # One retry on failure
    if not result["success"]:
        result = await send_email(
            to=to_email,
            subject=subject,
            html=html,
            from_address=settings.RESEND_FROM_EMAIL,
        )

    return {
        "delivery_status": "sent" if result["success"] else "failed",
        "delivery_error": result.get("error") if not result["success"] else None,
        "html_content": html,   # overwrite with placeholder-replaced version
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }