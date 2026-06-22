import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextRun } from "@/lib/schedule";

// Valid enum value lists
const DEPTH_LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"];
const TONES = ["TECHNICAL", "CASUAL", "EXECUTIVE"];
const SCHEDULE_TYPES = ["DAILY", "WEEKLY", "MANUAL"];
const SUBSCRIPTION_STATUSES = ["ACTIVE", "PAUSED", "RUNNING", "FAILED"];

// GET /api/subscriptions/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        newsletterRuns: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/subscriptions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing subscription to verify ownership
    const existing = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      topic,
      subtopics,
      depthLevel,
      tone,
      pinnedSources,
      excludedSources,
      scheduleType,
      scheduleDayOfWeek,
      scheduleHour,
      scheduleMinute,
      deliveryEmail,
      status,
    } = body;

    // Build update payload
    const updateData: any = {};

    // 1. Topic validation if updated
    if (topic !== undefined) {
      if (typeof topic !== "string" || topic.trim() === "") {
        return NextResponse.json({ error: "Topic cannot be empty" }, { status: 400 });
      }
      updateData.topic = topic.trim();
    }

    // 2. Delivery email validation if updated
    if (deliveryEmail !== undefined) {
      if (typeof deliveryEmail !== "string" || deliveryEmail.trim() === "") {
        return NextResponse.json({ error: "Delivery email cannot be empty" }, { status: 400 });
      }
      updateData.deliveryEmail = deliveryEmail.trim().toLowerCase();
    }

    // 3. Enum validations
    if (depthLevel !== undefined) {
      if (!DEPTH_LEVELS.includes(depthLevel)) {
        return NextResponse.json({ error: "Invalid depthLevel" }, { status: 400 });
      }
      updateData.depthLevel = depthLevel;
    }

    if (tone !== undefined) {
      if (!TONES.includes(tone)) {
        return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
      }
      updateData.tone = tone;
    }

    if (status !== undefined) {
      if (!SUBSCRIPTION_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
    }

    // Determine target scheduleType to evaluate schedule constraints
    const targetScheduleType = scheduleType !== undefined ? scheduleType : existing.scheduleType;

    if (scheduleType !== undefined) {
      if (!SCHEDULE_TYPES.includes(scheduleType)) {
        return NextResponse.json({ error: "Invalid scheduleType" }, { status: 400 });
      }
      updateData.scheduleType = scheduleType;
    }

    // 4. Array fields validation
    if (subtopics !== undefined) {
      if (!Array.isArray(subtopics)) {
        return NextResponse.json({ error: "Subtopics must be an array of strings" }, { status: 400 });
      }
      updateData.subtopics = subtopics.map((t: string) => t.trim());
    }

    if (pinnedSources !== undefined) {
      if (!Array.isArray(pinnedSources)) {
        return NextResponse.json({ error: "Pinned sources must be an array of strings" }, { status: 400 });
      }
      if (pinnedSources.length > 5) {
        return NextResponse.json({ error: "You can pin up to 5 sources only" }, { status: 400 });
      }
      updateData.pinnedSources = pinnedSources.map((s: string) => s.trim().toLowerCase());
    }

    if (excludedSources !== undefined) {
      if (!Array.isArray(excludedSources)) {
        return NextResponse.json({ error: "Excluded sources must be an array of strings" }, { status: 400 });
      }
      if (excludedSources.length > 5) {
        return NextResponse.json({ error: "You can exclude up to 5 sources only" }, { status: 400 });
      }
      updateData.excludedSources = excludedSources.map((s: string) => s.trim().toLowerCase());
    }

    // 5. Schedule constraints
    if (targetScheduleType === "WEEKLY") {
      const day = scheduleDayOfWeek !== undefined ? scheduleDayOfWeek : existing.scheduleDayOfWeek;
      if (day === null || day === undefined) {
        return NextResponse.json({ error: "scheduleDayOfWeek is required for weekly schedule" }, { status: 400 });
      }
      const numDay = Number(day);
      if (isNaN(numDay) || numDay < 0 || numDay > 6) {
        return NextResponse.json({ error: "scheduleDayOfWeek must be between 0 (Sunday) and 6 (Saturday)" }, { status: 400 });
      }
      updateData.scheduleDayOfWeek = numDay;
    } else if (scheduleType !== undefined) {
      // If changing to DAILY or MANUAL, unset day of week
      updateData.scheduleDayOfWeek = null;
    }

    if (targetScheduleType !== "MANUAL") {
      const hour = scheduleHour !== undefined ? scheduleHour : existing.scheduleHour;
      const minute = scheduleMinute !== undefined ? scheduleMinute : existing.scheduleMinute;

      if (hour === null || hour === undefined || minute === null || minute === undefined) {
        return NextResponse.json({ error: "Hour and minute are required for daily or weekly schedules" }, { status: 400 });
      }

      const numHour = Number(hour);
      const numMinute = Number(minute);

      if (isNaN(numHour) || numHour < 0 || numHour > 23) {
        return NextResponse.json({ error: "scheduleHour must be between 0 and 23" }, { status: 400 });
      }
      if (isNaN(numMinute) || numMinute < 0 || numMinute > 59) {
        return NextResponse.json({ error: "scheduleMinute must be between 0 and 59" }, { status: 400 });
      }

      updateData.scheduleHour = numHour;
      updateData.scheduleMinute = numMinute;
    } else if (scheduleType !== undefined) {
      // If changing to MANUAL, we can nullify the time or keep it
      updateData.scheduleHour = null;
      updateData.scheduleMinute = null;
    }

    // Recalculate nextRunAt based on merged values
    const targetStatus = status !== undefined ? status : existing.status;
    const targetDayOfWeek = scheduleDayOfWeek !== undefined ? scheduleDayOfWeek : existing.scheduleDayOfWeek;
    const targetHour = scheduleHour !== undefined ? scheduleHour : existing.scheduleHour;
    const targetMinute = scheduleMinute !== undefined ? scheduleMinute : existing.scheduleMinute;

    let nextRunAt: Date | null = null;
    if (targetStatus === "ACTIVE" && targetScheduleType !== "MANUAL") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true },
      });
      const timezone = user?.timezone || "Asia/Kolkata";
      
      nextRunAt = calculateNextRun(
        targetScheduleType as any,
        targetDayOfWeek !== null ? Number(targetDayOfWeek) : null,
        targetHour !== null ? Number(targetHour) : null,
        targetMinute !== null ? Number(targetMinute) : null,
        timezone
      );
    }
    updateData.nextRunAt = nextRunAt;

    // Update DB record
    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/subscriptions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing to check ownership
    const existing = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
