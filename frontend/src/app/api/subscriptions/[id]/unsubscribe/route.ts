import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Enforce session authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Fetch subscription and verify user ownership
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // 3. Update status to PAUSED and clear schedule
    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: "PAUSED",
        nextRunAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed. Topic updates paused.",
      topic: updated.topic,
      deliveryEmail: updated.deliveryEmail,
    });
  } catch (error: any) {
    console.error("Unsubscribe API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
