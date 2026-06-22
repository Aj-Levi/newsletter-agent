"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Copy, Edit3, Trash2, Clock, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";

interface SubscriptionCardProps {
  subscription: {
    id: string;
    topic: string;
    subtopics: string[];
    depthLevel: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
    tone: "TECHNICAL" | "CASUAL" | "EXECUTIVE";
    scheduleType: "DAILY" | "WEEKLY" | "MANUAL";
    scheduleDayOfWeek: number | null;
    scheduleHour: number | null;
    scheduleMinute: number | null;
    deliveryEmail: string;
    status: "ACTIVE" | "PAUSED" | "RUNNING" | "FAILED";
    lastRunAt: string | null;
  };
  onDeleteRequest: (id: string, topicName: string) => void;
  onRefreshList: () => void;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SubscriptionCard = ({
  subscription,
  onDeleteRequest,
  onRefreshList,
}: SubscriptionCardProps) => {
  const [isDuplicating, setIsDuplicating] = useState(false);

  const getScheduleText = () => {
    const formatTime = (h: number | null, m: number | null) => {
      if (h === null || m === null) return "";
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} UTC`;
    };

    if (subscription.scheduleType === "MANUAL") {
      return "Manual runs only";
    }
    if (subscription.scheduleType === "DAILY") {
      return `Daily at ${formatTime(subscription.scheduleHour, subscription.scheduleMinute)}`;
    }
    if (subscription.scheduleType === "WEEKLY") {
      const dayName =
        subscription.scheduleDayOfWeek !== null && subscription.scheduleDayOfWeek !== undefined
          ? DAYS_OF_WEEK[subscription.scheduleDayOfWeek]
          : "Monday";
      return `Every ${dayName} at ${formatTime(subscription.scheduleHour, subscription.scheduleMinute)}`;
    }
    return "Not scheduled";
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return <span className="badge badge-info badge-sm font-semibold animate-pulse">Running</span>;
    }
    switch (subscription.status) {
      case "ACTIVE":
        return <span className="badge badge-success badge-sm font-semibold">Active</span>;
      case "PAUSED":
        return <span className="badge badge-warning badge-sm font-semibold">Paused</span>;
      case "RUNNING":
        return <span className="badge badge-info badge-sm font-semibold animate-pulse">Running</span>;
      case "FAILED":
        return <span className="badge badge-error badge-sm font-semibold">Failed</span>;
      default:
        return <span className="badge badge-ghost badge-sm font-semibold">{subscription.status}</span>;
    }
  };

  const [isRunning, setIsRunning] = useState(subscription.status === "RUNNING");

  const handleDuplicate = async () => {
    if (isRunning || isDuplicating) return;
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/duplicate`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Duplicated topic: ${data.topic}`, ToastStyles);
        onRefreshList();
      } else {
        toast.error(data.error || "Failed to duplicate", ToastStyles);
      }
    } catch (error) {
      console.error("Duplication error:", error);
      toast.error("Network error while duplicating", ToastStyles);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleRunNow = async () => {
    if (isRunning || isDuplicating) return;
    setIsRunning(true);
    toast.info("Starting agent run... Deduplicating queries and searching web. This takes 10-30s.", {
      ...ToastStyles,
      autoClose: 5000,
    });
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/trigger`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Newsletter compiled and delivered successfully!", ToastStyles);
        onRefreshList();
      } else {
        toast.error(data.error || "Failed to compile newsletter", ToastStyles);
        onRefreshList();
      }
    } catch (error) {
      console.error("Manual run error:", error);
      toast.error("Network error while starting run", ToastStyles);
      onRefreshList();
    } finally {
      setIsRunning(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never run";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-[340px]">
      <div className="card-body p-6 flex flex-col justify-between h-full">
        {/* Top Header Section */}
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="card-title text-lg font-bold text-base-content leading-snug line-clamp-1 hover:text-primary transition-colors">
              <Link href={`/subscriptions/${subscription.id}`}>
                {subscription.topic}
              </Link>
            </h3>
            {getStatusBadge()}
          </div>
          
          <div className="text-[11px] font-semibold text-base-content/50 uppercase mt-0.5 tracking-wider">
            {subscription.depthLevel.toLowerCase()} • {subscription.tone.toLowerCase()}
          </div>
        </div>

        {/* Subtopics Badges List */}
        <div className="flex-grow my-4 overflow-hidden">
          {subscription.subtopics.length === 0 ? (
            <span className="text-xs text-base-content/40 italic">No subtopics defined</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto pr-1">
              {subscription.subtopics.map((sub, idx) => (
                <span
                  key={idx}
                  className="badge badge-outline border-base-300 text-[11px] text-base-content/85 px-2.5 py-2.5 rounded-lg"
                >
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Metadata section: Schedule & Email */}
        <div className="space-y-2 border-t border-base-300/60 pt-3 text-xs text-base-content/70">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-base-content/50" />
            <span className="truncate">{getScheduleText()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-base-content/50" />
            <span className="truncate">{subscription.deliveryEmail}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-base-content/50 pt-1">
            <span>Last run: {formatDate(subscription.lastRunAt)}</span>
          </div>
        </div>

        {/* Card Actions Button footer */}
        <div className="card-actions justify-between items-center mt-4 pt-3 border-t border-base-300/60">
          {/* Left Action: Run manual trigger */}
          <button
            onClick={handleRunNow}
            disabled={isRunning || isDuplicating}
            className="btn btn-ghost btn-sm text-primary hover:bg-primary/10 gap-1.5 font-bold px-2 disabled:opacity-50"
            title="Trigger manual run"
          >
            {isRunning ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Running...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run
              </>
            )}
          </button>

          {/* Right Actions: edit, duplicate, delete */}
          <div className="flex gap-1">
            <button
              onClick={handleDuplicate}
              disabled={isRunning || isDuplicating}
              className="btn btn-ghost btn-sm btn-square hover:bg-base-300 text-base-content/65 hover:text-base-content"
              title="Duplicate subscription"
            >
              {isDuplicating ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {isRunning || isDuplicating ? (
              <button
                disabled
                className="btn btn-ghost btn-sm btn-square text-base-content/40 cursor-not-allowed opacity-50"
                title="Edit subscription (disabled during execution)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href={`/subscriptions/${subscription.id}/edit`}
                className="btn btn-ghost btn-sm btn-square hover:bg-base-300 text-base-content/65 hover:text-base-content"
                title="Edit subscription"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={() => onDeleteRequest(subscription.id, subscription.topic)}
              disabled={isRunning || isDuplicating}
              className="btn btn-ghost btn-sm btn-square hover:bg-error/10 text-error/70 hover:text-error disabled:opacity-50"
              title="Delete subscription"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;
