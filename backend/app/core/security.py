from fastapi import Header, HTTPException, status
from app.core.config import settings

def verify_secret(x_internal_secret: str = Header(...)) -> None:
    """
    FastAPI dependency that checks the incoming 'X-Internal-Secret' header
    against the FASTAPI_SECRET configured in environment settings.
    """
    if x_internal_secret != settings.FASTAPI_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal authorization secret."
        )
