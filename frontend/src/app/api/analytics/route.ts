import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");

    // Fetch the user's subscriptions to filter or display selector
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      select: { id: true, topic: true, status: true },
    });

    const subIds = subscriptions.map((s) => s.id);

    // Filter runs by subscription ID if provided, otherwise all user subscriptions
    const runFilter: any = {
      subscriptionId: subscriptionId ? subscriptionId : { in: subIds },
    };

    // 1. Core stats calculations
    const totalRuns = await prisma.newsletterRun.count({
      where: runFilter,
    });

    const successfulRuns = await prisma.newsletterRun.count({
      where: {
        ...runFilter,
        status: "COMPLETED",
      },
    });

    const failedRuns = await prisma.newsletterRun.count({
      where: {
        ...runFilter,
        status: "FAILED",
      },
    });

    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

    // 2. Timeline runs data (Last 7 runs)
    const recentRuns = await prisma.newsletterRun.findMany({
      where: runFilter,
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        createdAt: true,
        status: true,
        subjectLine: true,
        totalSourcesFound: true,
        sourcesUsed: true,
        avgRelevanceScore: true,
        subscription: {
          select: {
            topic: true,
          },
        },
      },
    });

    // 3. Most used citation domains
    const sourceFilter: any = {
      newsletterRun: {
        subscriptionId: subscriptionId ? subscriptionId : { in: subIds },
        status: "COMPLETED",
      },
      // Exclude discarded search findings
      usedInSection: { not: "DISCARDED" },
    };

    const sources = await prisma.newsletterSource.findMany({
      where: sourceFilter,
      select: { domain: true },
    });

    // Group domains in memory
    const domainCounts: Record<string, number> = {};
    sources.forEach((src) => {
      if (src.domain) {
        domainCounts[src.domain] = (domainCounts[src.domain] || 0) + 1;
      }
    });

    const topDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Take top 5

    return NextResponse.json({
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === "ACTIVE").length,
      totalRuns,
      successfulRuns,
      failedRuns,
      successRate,
      recentRuns: recentRuns.reverse(), // chronologically left-to-right
      topDomains,
      subscriptions,
    });
  } catch (error: any) {
    console.error("Analytics API calculation error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
