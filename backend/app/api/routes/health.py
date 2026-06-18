from fastapi import APIRouter

router = APIRouter()

@router.get("", summary="Health Check")
async def health_check():
    """
    Returns API health status.
    """
    return {"status": "healthy"}
