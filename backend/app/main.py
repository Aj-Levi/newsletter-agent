from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.prisma import db
from app.scheduler.cron import start_scheduler, stop_scheduler
from app.api.routes import health, agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Life-cycle manager managing startup/shutdown database connections
    and background worker task scheduler threads.
    """
    print("Starting up FastAPI application...")
    
    # 1. Establish python prisma client connection
    try:
        await db.connect()
        print("Database connection established successfully.")
    except Exception as e:
        print(f"Error connecting database: {str(e)}")

    # 2. Trigger cron scheduled checks
    try:
        start_scheduler()
    except Exception as e:
        print(f"Error starting scheduler: {str(e)}")

    yield

    # 3. Clean up on shutdown
    print("Shutting down FastAPI application...")
    try:
        stop_scheduler()
    except Exception as e:
        print(f"Error stopping scheduler: {str(e)}")

    try:
        if db.is_connected():
            await db.disconnect()
            print("Database connection closed.")
    except Exception as e:
        print(f"Error disconnecting database: {str(e)}")


app = FastAPI(
    title="Newsletter Agent Backend",
    description="FastAPI + LangGraph multi-agent compiler service",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins or specify settings.FRONTEND_URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route prefixes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(agent.router, prefix="/run", tags=["Agent"])
