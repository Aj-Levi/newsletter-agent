"use client";

import React, { useState, useEffect } from "react";
import StatsCard from "@/components/analytics/StatsCard";
import RunTimeline from "@/components/analytics/RunTimeline";
import SourceDonutChart from "@/components/analytics/SourceDonutChart";
import {
  BarChart3,
  RefreshCw,
  MailCheck,
  Percent,
  Rss,
  Sparkles,
  Layers,
  Calendar,
  Globe
} from "lucide-react";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterId, setFilterId] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAnalytics = async (subId: string = "all") => {
    setLoading(true);
    try {
      const url = subId === "all" ? "/api/analytics" : `/api/analytics?subscriptionId=${subId}`;
      const res = await fetch(url);
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      } else {
        toast.error("Failed to load analytics metrics", ToastStyles);
      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Network error while loading analytics", ToastStyles);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(filterId);
  }, [filterId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics(filterId);
  };

  // Skeleton Loading State
  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2 w-1/3">
            <div className="h-8 bg-base-300 rounded"></div>
            <div className="h-4 bg-base-300 rounded w-1/2"></div>
          </div>
          <div className="h-10 bg-base-300 rounded w-1/4"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-base-200 border border-base-300 rounded-2xl"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-[320px] bg-base-200 rounded-2xl lg:col-span-2 border border-base-300"></div>
          <div className="h-[320px] bg-base-200 rounded-2xl lg:col-span-1 border border-base-300"></div>
        </div>
      </div>
    );
  }

  const subscriptions = data?.subscriptions || [];

  return (
    <div className="space-y-8 w-fit">
      {/* Title & Filter Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-300 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-base-content tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Track runs performance, success ratios, and agent citations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-end gap-2">
          <select
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="select select-bordered select-sm grow md:flex-none font-bold text-sm bg-base-200 border-base-300"
          >
            <option value="all">All Subscription Topics</option>
            {subscriptions.map((sub: any) => (
              <option key={sub.id} value={sub.id}>
                {sub.topic}
              </option>
            ))}
          </select>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-ghost btn-sm btn-square border border-base-300 hover:bg-base-300"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Runs Generated */}
        <StatsCard
          title="Generated Reports"
          value={data?.totalRuns || 0}
          subtitle={filterId === "all" ? "Across all active topics" : "For this subscription"}
          icon={<MailCheck className="w-6 h-6" />}
          colorClass="text-sky-400 bg-sky-400/10 border-sky-400/15"
        />

        {/* Success Rate */}
        <StatsCard
          title="Delivery Success Rate"
          value={`${data?.successRate || 100}%`}
          subtitle={`Successful runs: ${data?.successfulRuns || 0} / ${data?.totalRuns || 0}`}
          icon={<Percent className="w-6 h-6" />}
          colorClass="text-emerald-400 bg-emerald-400/10 border-emerald-400/15"
          trend={data?.totalRuns > 0 ? { value: `${data?.failedRuns || 0} failed`, isPositive: data?.failedRuns === 0 } : undefined}
        />

        {/* Active Topics */}
        <StatsCard
          title="Monitored Subscriptions"
          value={filterId === "all" ? `${data?.activeSubscriptions || 0} / ${data?.totalSubscriptions || 0}` : "Active"}
          subtitle={filterId === "all" ? "Currently active timers" : "Configured and active"}
          icon={<Rss className="w-6 h-6" />}
          colorClass="text-purple-400 bg-purple-400/10 border-purple-400/15"
        />
      </div>

      {/* Two Column Layout: Timeline vs Citations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Timeline Runs: Left/Center panel */}
        <div className="card bg-base-200 border border-base-300 shadow-sm lg:col-span-2">
          <div className="card-body p-6">
            <h3 className="card-title text-base font-bold text-base-content mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              Agent Runs Timeline
            </h3>
            <p className="text-xs text-base-content/50 mb-6">
              Status indicator of the last 7 sequential compilation triggers
            </p>

            <RunTimeline runs={data?.recentRuns || []} />
          </div>
        </div>

        {/* Donut Citations chart: Right panel */}
        <div className="card bg-base-200 border border-base-300 shadow-sm lg:col-span-1">
          <div className="card-body p-6 flex flex-col justify-between">
            <div>
              <h3 className="card-title text-base font-bold text-base-content mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                Most Cited Sources
              </h3>
              <p className="text-xs text-base-content/50 mb-6">
                Top domains featured in deep dives and stories
              </p>
            </div>

            <SourceDonutChart data={data?.topDomains || []} />
          </div>
        </div>

      </div>
    </div>
  );
}
