import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let runId = "";
  const { id } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Verify subscription and ownership
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription || subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // 2. Mark subscription status as RUNNING in DB
    await prisma.subscription.update({
      where: { id },
      data: { status: "RUNNING" },
    });

    // 3. Create a pending NewsletterRun in DB
    const run = await prisma.newsletterRun.create({
      data: {
        subscriptionId: id,
        status: "RUNNING",
        triggerType: "MANUAL",
        deliveryStatus: "PENDING",
      },
    });
    runId = run.id;

    // 4. Send trigger request to FastAPI
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const fastApiSecret = process.env.FASTAPI_SECRET || "";

    const response = await fetch(`${fastApiUrl}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": fastApiSecret,
      },
      body: JSON.stringify({
        subscription_id: subscription.id,
        topic: subscription.topic,
        subtopics: subscription.subtopics || [],
        depth_level: subscription.depthLevel.toLowerCase(),
        tone: subscription.tone.toLowerCase(),
        pinned_sources: subscription.pinnedSources || [],
        excluded_sources: subscription.excludedSources || [],
        delivery_email: subscription.deliveryEmail,
        run_id: runId,
      }),
      // Set a generous timeout (e.g. 60 seconds) since graph search & write takes time
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agent server responded with error: ${response.status} - ${errorText}`);
    }

    const state = await response.json();

    if (state.error_message) {
      throw new Error(state.error_message);
    }

    const isSent = state.delivery_status === "sent";
    const runStatus = isSent ? "COMPLETED" : "FAILED";

    // 5. Save the run outcome to database
    const updatedRun = await prisma.newsletterRun.update({
      where: { id: runId },
      data: {
        status: runStatus,
        subjectLine: state.subject_line || "",
        topStories: state.top_stories || [],
        deepDive: state.deep_dive || {},
        worthWatching: state.worth_watching || [],
        closingLine: state.closing_line || "",
        htmlContent: state.html_content || "",
        deliveryStatus: isSent ? "SENT" : "FAILED",
        deliveryError: state.delivery_error || null,
        errorMessage: state.error_message || null,
        totalSourcesFound: state.raw_results ? state.raw_results.length : 0,
        sourcesUsed: state.ranked_results ? state.ranked_results.length : 0,
        avgRelevanceScore: state.avg_relevance_score || null,
        queriesGenerated: state.generated_queries || [],
        retryCount: state.retry_count || 0,
        completedAt: new Date(),
      },
    });

    // 6. Save used sources
    const topUrls = new Set(
      (state.top_stories || []).map((story: any) => story.url).filter(Boolean)
    );

    if (state.ranked_results && Array.isArray(state.ranked_results)) {
      await Promise.all(
        state.ranked_results.map((src: any) => {
          const usedSection = topUrls.has(src.url) ? "TOP_STORIES" : "DISCARDED";
          return prisma.newsletterSource.create({
            data: {
              newsletterRunId: runId,
              url: src.url || "",
              domain: src.domain || "",
              title: src.title || "No Title",
              snippet: src.snippet || "",
              tavilyScore: Number(src.tavily_score) || 0.5,
              recencyScore: Number(src.recency_score) || 0.5,
              credibilityScore: Number(src.credibility_score) || 0.5,
              finalScore: Number(src.final_score) || 0.5,
              usedInSection: usedSection,
            },
          });
        })
      );
    }

    // 7. Update subscription lastRunAt and status
    await prisma.subscription.update({
      where: { id },
      data: {
        status: isSent ? "ACTIVE" : "FAILED",
        lastRunAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, run: updatedRun });
  } catch (error: any) {
    console.error("Error triggering manual agent run:", error);

    // Fail gracefully in database
    if (runId) {
      await prisma.newsletterRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          errorMessage: error.message || "Trigger execution failed",
          completedAt: new Date(),
        },
      });
    }

    await prisma.subscription.update({
      where: { id },
      data: {
        status: "FAILED",
        lastRunAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: error.message || "Failed to compile newsletter. Agent server error." },
      { status: 500 }
    );
  }
}
