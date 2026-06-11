import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/getSession";
import { prisma } from "@/lib/prisma";
import { Plus, ListChecks, MailCheck, Calendar, ArrowRight, Rss, AlertCircle, Inbox } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  // Fetch real statistics from database
  let totalSubscriptions = 0;
  let activeSubscriptions = 0;
  let newslettersGenerated = 0;
  let lastRunTime: Date | null = null;
  let nextRunTime: Date | null = null;
  let recentRuns: any[] = [];

  if (userId) {
    try {
      totalSubscriptions = await prisma.subscription.count({
        where: { userId },
      });

      activeSubscriptions = await prisma.subscription.count({
        where: { userId, status: "ACTIVE" },
      });

      newslettersGenerated = await prisma.newsletterRun.count({
        where: {
          subscription: { userId },
          status: "COMPLETED",
        },
      });

      const lastRun = await prisma.newsletterRun.findFirst({
        where: {
          subscription: { userId },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      if (lastRun) {
        lastRunTime = lastRun.createdAt;
      }

      const nextRun = await prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
        },
        orderBy: {
          nextRunAt: "asc",
        },
      });
      if (nextRun) {
        nextRunTime = nextRun.nextRunAt;
      }

      recentRuns = await prisma.newsletterRun.findMany({
        where: {
          subscription: { userId },
        },
        include: {
          subscription: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });
    } catch (error) {
      console.error("Error querying dashboard stats:", error);
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "badge-success";
      case "RUNNING":
        return "badge-info animate-pulse";
      case "FAILED":
        return "badge-error";
      case "PENDING":
      default:
        return "badge-warning";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Intro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-base-content tracking-tight">
            Welcome back, {session?.user?.name || "there"}!
          </h2>
          <p className="text-base-content/70 mt-1">
            Here is a snapshot of your automated newsletter agent activities.
          </p>
        </div>
        <Link href="/subscriptions/new" className="btn btn-secondary shadow-md shadow-secondary/15 gap-2">
          <Plus className="w-5 h-5" />
          New Subscription
        </Link>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Subscriptions Card */}
        <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="card-body p-6 flex-row items-center gap-4">
            <div className="p-3 bg-primary/15 text-primary rounded-xl">
              <Rss className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-base-content/65 uppercase tracking-wider block">
                Total Topics
              </span>
              <span className="text-2xl font-bold text-base-content block mt-0.5">
                {totalSubscriptions}
              </span>
              <span className="text-xs text-success font-medium mt-1 inline-block">
                {activeSubscriptions} active
              </span>
            </div>
          </div>
        </div>

        {/* Newsletters Generated Card */}
        <div className="card bg-base-200 border border-base-300 hover:border-secondary/20 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="card-body p-6 flex-row items-center gap-4">
            <div className="p-3 bg-secondary/15 text-secondary rounded-xl">
              <MailCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-base-content/65 uppercase tracking-wider block">
                Generated
              </span>
              <span className="text-2xl font-bold text-base-content block mt-0.5">
                {newslettersGenerated}
              </span>
              <span className="text-xs text-base-content/60 font-medium mt-1 inline-block">
                Sent to your inbox
              </span>
            </div>
          </div>
        </div>

        {/* Last Run Info Card */}
        <div className="card bg-base-200 border border-base-300 hover:border-info/20 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="card-body p-6 flex-row items-center gap-4">
            <div className="p-3 bg-info/15 text-info rounded-xl">
              <ListChecks className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-base-content/65 uppercase tracking-wider block">
                Last Agent Run
              </span>
              <span className="text-2xl font-bold text-base-content block truncate mt-0.5">
                {lastRunTime ? formatDate(lastRunTime) : "Never"}
              </span>
              <span className="text-xs text-base-content/60 font-medium mt-1 inline-block">
                Status: {recentRuns.length > 0 ? recentRuns[0].status : "No runs"}
              </span>
            </div>
          </div>
        </div>

        {/* Next Scheduled Trigger Card */}
        <div className="card bg-base-200 border border-base-300 hover:border-success/20 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="card-body p-6 flex-row items-center gap-4">
            <div className="p-3 bg-success/15 text-success rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-base-content/65 uppercase tracking-wider block">
                Next Scheduled
              </span>
              <span className="text-2xl font-bold text-base-content block mt-0.5">
                {nextRunTime ? formatDate(nextRunTime) : "Never"}
              </span>
              <span className="text-xs text-base-content/60 font-medium mt-1 inline-block">
                Hang tight!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Newsletter Feed */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card bg-base-200 border border-base-300 shadow-sm">
          <div className="card-body p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-base-content">
                  Recent Newsletters Feed
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Latest compiled newsletters generated by your AI agent
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="text-xs font-bold text-primary hover:text-primary-focus flex items-center gap-1 group"
              >
                View all subscriptions
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Content Feed List */}
            {recentRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-base-300 rounded-2xl bg-base-100/50">
                <Inbox size={60} className="text-base-content mb-2" />
                <h4 className="text-base font-bold text-base-content">No newsletters generated yet</h4>
                <p className="text-sm text-base-content/60 max-w-sm mt-1 mb-4">
                  Start by configuring your first newsletter subscription, and your agent will begin searching and compiling insights.
                </p>
                <Link href="/subscriptions/new" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-300 text-base-content/75 font-semibold text-xs">
                      <th>Topic</th>
                      <th>Subject Line</th>
                      <th>Date Generated</th>
                      <th>Sources Found</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {recentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-base-300/30 transition-colors text-sm">
                        <td className="font-medium text-base-content whitespace-nowrap">
                          {run.subscription?.topic || "Custom Topic"}
                        </td>
                        <td className="text-base-content/85 max-w-xs truncate">
                          {run.subjectLine || <span className="italic text-base-content/40">No subject</span>}
                        </td>
                        <td className="text-base-content/70 whitespace-nowrap">
                          {formatDate(run.createdAt)}
                        </td>
                        <td className="text-base-content/75 font-mono">
                          {run.sourcesUsed} / {run.totalSourcesFound}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(run.status)} badge-sm font-semibold`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <Link
                            href={`/newsletter/${run.id}`}
                            className="btn btn-ghost btn-xs text-primary"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
