import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    if (!run.htmlContent) {
      return NextResponse.json({ error: "No compiled content to send" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [run.subscription.deliveryEmail],
        subject: run.subjectLine || `Newsletter: ${run.subscription.topic}`,
        html: run.htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      throw new Error(`Resend API failed: ${errText}`);
    }

    const emailData = await emailResponse.json();

    // Update status in DB
    await prisma.newsletterRun.update({
      where: { id: runId },
      data: {
        deliveryStatus: "SENT",
        deliveryError: null,
      },
    });

    return NextResponse.json({ success: true, emailId: emailData.id });
  } catch (error: any) {
    console.error("Resend endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
