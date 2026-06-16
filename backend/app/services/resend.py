import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY

async def send_email(
    to: str,
    subject: str,
    html: str,
    from_address: str = "Newsletter Agent <onboarding@resend.dev>",
) -> dict:
    try:
        params: resend.Emails.SendParams = {
            "from": from_address,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        response = resend.Emails.send(params)
        return {"success": True, "id": response.get("id")}
    except Exception as e:
        return {"success": False, "error": str(e)}