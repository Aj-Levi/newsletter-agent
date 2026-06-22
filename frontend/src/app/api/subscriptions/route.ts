import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextRun } from "@/lib/schedule";

// Valid enum value lists
const DEPTH_LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"];
const TONES = ["TECHNICAL", "CASUAL", "EXECUTIVE"];
const SCHEDULE_TYPES = ["DAILY", "WEEKLY", "MANUAL"];
const SUBSCRIPTION_STATUSES = ["ACTIVE", "PAUSED"];

// GET /api/subscriptions
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/subscriptions
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      topic,
      subtopics,
      depthLevel = "INTERMEDIATE",
      tone = "CASUAL",
      pinnedSources = [],
      excludedSources = [],
      scheduleType = "MANUAL",
      scheduleDayOfWeek,
      scheduleHour,
      scheduleMinute,
      deliveryEmail,
      status = "ACTIVE",
    } = body;

    // 1. Basic required validations
    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const targetEmail = deliveryEmail || session.user.email;
    if (!targetEmail || typeof targetEmail !== "string" || targetEmail.trim() === "") {
      return NextResponse.json({ error: "Delivery email is required" }, { status: 400 });
    }

    // 2. Validate enum types
    if (!DEPTH_LEVELS.includes(depthLevel)) {
      return NextResponse.json(
        { error: `Invalid depthLevel. Must be one of: ${DEPTH_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!TONES.includes(tone)) {
      return NextResponse.json(
        { error: `Invalid tone. Must be one of: ${TONES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!SCHEDULE_TYPES.includes(scheduleType)) {
      return NextResponse.json(
        { error: `Invalid scheduleType. Must be one of: ${SCHEDULE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!SUBSCRIPTION_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${SUBSCRIPTION_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // 3. Validate array formats
    if (subtopics && !Array.isArray(subtopics)) {
      return NextResponse.json({ error: "Subtopics must be an array of strings" }, { status: 400 });
    }

    if (!Array.isArray(pinnedSources)) {
      return NextResponse.json({ error: "Pinned sources must be an array of strings" }, { status: 400 });
    }

    if (pinnedSources.length > 5) {
      return NextResponse.json({ error: "You can pin up to 5 sources only" }, { status: 400 });
    }

    if (!Array.isArray(excludedSources)) {
      return NextResponse.json({ error: "Excluded sources must be an array of strings" }, { status: 400 });
    }

    if (excludedSources.length > 5) {
      return NextResponse.json({ error: "You can exclude up to 5 sources only" }, { status: 400 });
    }

    // 4. Validate schedule options
    if (scheduleType === "WEEKLY") {
      if (scheduleDayOfWeek === undefined || scheduleDayOfWeek === null) {
        return NextResponse.json({ error: "scheduleDayOfWeek is required for weekly schedule" }, { status: 400 });
      }
      const day = Number(scheduleDayOfWeek);
      if (isNaN(day) || day < 0 || day > 6) {
        return NextResponse.json({ error: "scheduleDayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)" }, { status: 400 });
      }
    }

    let parsedHour: number | null = null;
    let parsedMinute: number | null = null;

    if (scheduleType !== "MANUAL") {
      if (scheduleHour === undefined || scheduleHour === null || scheduleMinute === undefined || scheduleMinute === null) {
        return NextResponse.json({ error: "Hour and minute are required for daily or weekly schedules" }, { status: 400 });
      }
      parsedHour = Number(scheduleHour);
      parsedMinute = Number(scheduleMinute);

      if (isNaN(parsedHour) || parsedHour < 0 || parsedHour > 23) {
        return NextResponse.json({ error: "scheduleHour must be between 0 and 23" }, { status: 400 });
      }
      if (isNaN(parsedMinute) || parsedMinute < 0 || parsedMinute > 59) {
        return NextResponse.json({ error: "scheduleMinute must be between 0 and 59" }, { status: 400 });
      }
    }

    // Fetch user's timezone from DB to calculate correct localized schedule
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });
    const timezone = user?.timezone || "Asia/Kolkata";

    // Calculate next run time if schedule is active
    let nextRunAt: Date | null = null;
    if (status === "ACTIVE" && scheduleType !== "MANUAL") {
      nextRunAt = calculateNextRun(
        scheduleType as any,
        scheduleType === "WEEKLY" ? Number(scheduleDayOfWeek) : null,
        parsedHour,
        parsedMinute,
        timezone
      );
    }

    // Create the subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        topic: topic.trim(),
        subtopics: subtopics ? subtopics.map((t: string) => t.trim()) : [],
        depthLevel: depthLevel as any,
        tone: tone as any,
        pinnedSources: pinnedSources.map((s: string) => s.trim().toLowerCase()),
        excludedSources: excludedSources.map((s: string) => s.trim().toLowerCase()),
        scheduleType: scheduleType as any,
        scheduleDayOfWeek: scheduleType === "WEEKLY" ? Number(scheduleDayOfWeek) : null,
        scheduleHour: parsedHour,
        scheduleMinute: parsedMinute,
        deliveryEmail: targetEmail.trim().toLowerCase(),
        status: status as any,
        nextRunAt,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
