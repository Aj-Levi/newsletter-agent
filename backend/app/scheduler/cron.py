import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.db.prisma import db
from app.scheduler.runner import run_subscription

scheduler = AsyncIOScheduler()

async def check_due_subscriptions() -> None:
    """
    Query database for active/failed subscriptions whose nextRunAt scheduled time
    has passed (or is due), and invoke their agent runs.
    """
    now = datetime.now(timezone.utc)
    
    try:
        # Find subscriptions due for execution
        due_subs = await db.subscription.find_many(
            where={
                "status": {
                    "in": ["ACTIVE", "FAILED"]
                },
                "scheduleType": {
                    "in": ["DAILY", "WEEKLY"]
                },
                "nextRunAt": {
                    "lte": now
                }
            }
        )
        
        if due_subs:
            print(f"[{now.isoformat()}] Found {len(due_subs)} subscriptions due to run.")
            for sub in due_subs:
                # Spawn an independent async task for each run to execute concurrently
                asyncio.create_task(run_subscription(sub.id))
        
    except Exception as e:
        print(f"Error checking due subscriptions in cron: {str(e)}")


def start_scheduler() -> None:
    """
    Initialize and start the background scheduler job.
    Checks the database every 10 minutes to verify if any schedules are due.
    """
    if not scheduler.running:
        # Check every 10 minutes (responsive but database friendly)
        scheduler.add_job(check_due_subscriptions, "interval", minutes=10)
        scheduler.start()
        print("APScheduler background service started successfully.")


def stop_scheduler() -> None:
    """
    Gracefully terminate the scheduler.
    """
    if scheduler.running:
        scheduler.shutdown()
        print("APScheduler background service stopped.")
