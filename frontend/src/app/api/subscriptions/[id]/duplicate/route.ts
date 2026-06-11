import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/subscriptions/[id]/duplicate
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing subscription to duplicate
    const existing = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Clone settings, clean/reset status if needed
    const duplicated = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        topic: `${existing.topic} (Copy)`,
        subtopics: existing.subtopics,
        depthLevel: existing.depthLevel,
        tone: existing.tone,
        pinnedSources: existing.pinnedSources,
        excludedSources: existing.excludedSources,
        scheduleType: existing.scheduleType,
        scheduleDayOfWeek: existing.scheduleDayOfWeek,
        scheduleHour: existing.scheduleHour,
        scheduleMinute: existing.scheduleMinute,
        deliveryEmail: existing.deliveryEmail,
        status: existing.status === "RUNNING" || existing.status === "FAILED" ? "ACTIVE" : existing.status,
        lastRunAt: null,
        nextRunAt: null,
      },
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("Error duplicating subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
