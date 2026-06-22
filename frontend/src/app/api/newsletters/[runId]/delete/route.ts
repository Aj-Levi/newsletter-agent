import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    const run = await prisma.newsletterRun.findUnique({
      where: { id: runId },
      include: {
        subscription: true,
      },
    });

    if (!run || run.subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "Newsletter run not found" }, { status: 404 });
    }

    await prisma.newsletterRun.delete({
      where: { id: runId },
    });

    return NextResponse.json({ success: true, message: "Newsletter run deleted" });
  } catch (error: any) {
    console.error("Delete run endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  return DELETE(req, { params });
}
