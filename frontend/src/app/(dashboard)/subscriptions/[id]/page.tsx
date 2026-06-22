"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Copy,
  Edit3,
  Trash2,
  Clock,
  Mail,
  ArrowLeft,
  Eye,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  Volume2,
  Sparkles,
  Inbox
} from "lucide-react";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";
import DeleteConfirmModal from "@/components/subscriptions/DeleteConfirmModal";
import NewsletterPreviewModal from "@/components/newsletters/NewsletterPreviewModal";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SubscriptionDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Running trigger state
  const [isTriggering, setIsTriggering] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Deletion modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Run preview/actions state
  const [activePreviewRun, setActivePreviewRun] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [resendingRuns, setResendingRuns] = useState<Record<string, boolean>>({});
  const [deletingRuns, setDeletingRuns] = useState<Record<string, boolean>>({});

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        toast.error("Failed to load subscription details", ToastStyles);
        router.push("/subscriptions");
      }
    } catch (error) {
      console.error("Error loading subscription details:", error);
      toast.error("Network error while loading details", ToastStyles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSubscriptionDetails();
    }
  }, [id]);

  const handleRunNow = async () => {
    if (isTriggering || isDuplicating) return;
    setIsTriggering(true);
    toast.info("Starting agent run... Planning queries and searching web. This takes 10-30s.", {
      ...ToastStyles,
      autoClose: 5000,
    });
    try {
      const response = await fetch(`/api/subscriptions/${id}/trigger`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Newsletter compiled and delivered successfully!", ToastStyles);
        fetchSubscriptionDetails(); // Refresh history
      } else {
        toast.error(data.error || "Failed to compile newsletter", ToastStyles);
        fetchSubscriptionDetails();
      }
    } catch (error) {
      console.error("Manual run error:", error);
      toast.error("Network error while starting run", ToastStyles);
      fetchSubscriptionDetails();
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDuplicate = async () => {
    if (isTriggering || isDuplicating) return;
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/subscriptions/${id}/duplicate`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Duplicated topic: ${data.topic}`, ToastStyles);
        router.push(`/subscriptions/${data.id}`);
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

  const handleDeleteSubscription = async () => {
    setIsDeleteOpen(false);
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Deleted topic: ${subscription.topic}`, ToastStyles);
        router.push("/subscriptions");
      } else {
        toast.error(data.error || "Failed to delete subscription", ToastStyles);
      }
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error("Network error while deleting subscription", ToastStyles);
    }
  };

  const handleResendRun = async (runId: string) => {
    if (resendingRuns[runId]) return;
    setResendingRuns((prev) => ({ ...prev, [runId]: true }));
    try {
      const response = await fetch(`/api/newsletters/${runId}/resend`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Newsletter copy resent to email!", ToastStyles);
        fetchSubscriptionDetails(); // Refresh list to show updated deliveryStatus if changed
      } else {
        toast.error(data.error || "Failed to resend newsletter", ToastStyles);
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Network error while resending", ToastStyles);
    } finally {
      setResendingRuns((prev) => ({ ...prev, [runId]: false }));
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (deletingRuns[runId]) return;
    if (!window.confirm("Are you sure you want to delete this newsletter from history?")) return;

    setDeletingRuns((prev) => ({ ...prev, [runId]: true }));
    try {
      const response = await fetch(`/api/newsletters/${runId}/delete`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Newsletter history record removed!", ToastStyles);
        fetchSubscriptionDetails(); // Refresh list
      } else {
        toast.error(data.error || "Failed to delete history record", ToastStyles);
      }
    } catch (error) {
      console.error("Run deletion error:", error);
      toast.error("Network error while removing history record", ToastStyles);
    } finally {
      setDeletingRuns((prev) => ({ ...prev, [runId]: false }));
    }
  };

  const getScheduleText = () => {
    if (!subscription) return "";
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
    if (!subscription) return null;
    const status = isTriggering ? "RUNNING" : subscription.status;
    switch (status) {
      case "ACTIVE":
        return <span className="badge badge-success badge-md font-semibold">Active</span>;
      case "PAUSED":
        return <span className="badge badge-warning badge-md font-semibold">Paused</span>;
      case "RUNNING":
        return <span className="badge badge-info badge-md font-semibold animate-pulse">Running</span>;
      case "FAILED":
        return <span className="badge badge-error badge-md font-semibold">Failed</span>;
      default:
        return <span className="badge badge-ghost badge-md font-semibold">{status}</span>;
    }
  };

  const getRunStatusBadgeClass = (status: string) => {
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Skeleton Loading Page
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 bg-base-300 rounded w-1/4"></div>
        <div className="flex justify-between items-center">
          <div className="space-y-2 w-1/2">
            <div className="h-10 bg-base-300 rounded"></div>
            <div className="h-4 bg-base-300 rounded w-1/3"></div>
          </div>
          <div className="h-10 bg-base-300 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-[400px] bg-base-200 rounded-2xl lg:col-span-1 border border-base-300"></div>
          <div className="h-[400px] bg-base-200 rounded-2xl lg:col-span-2 border border-base-300"></div>
        </div>
      </div>
    );
  }

  const isExecuting = isTriggering || isDuplicating;
  const historyRuns = subscription?.newsletterRuns || [];

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb / Back button */}
      <div>
        <Link href="/subscriptions" className="btn btn-ghost btn-sm gap-1.5 pl-0 hover:bg-transparent text-base-content/70 hover:text-base-content font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Subscriptions
        </Link>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-base-300">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight">
              {subscription.topic}
            </h2>
            {getStatusBadge()}
          </div>
          <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/50 uppercase font-semibold tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {subscription.depthLevel.toLowerCase()} depth
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              {subscription.tone.toLowerCase()} tone
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleRunNow}
            disabled={isExecuting}
            className="flex-1 md:flex-none btn btn-primary font-bold shadow-md shadow-primary/10 gap-1.5 disabled:opacity-50"
          >
            {isTriggering ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Compiling...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Now
              </>
            )}
          </button>
          
          <button
            onClick={handleDuplicate}
            disabled={isExecuting}
            className="flex-1 md:flex-none btn btn-ghost border border-base-300 hover:bg-base-300 gap-1.5"
          >
            {isDuplicating ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Duplicate
          </button>

          <Link
            href={`/subscriptions/${subscription.id}/edit`}
            className={`flex-1 md:flex-none btn btn-ghost border border-base-300 hover:bg-base-300 gap-1.5 ${
              isExecuting ? "btn-disabled opacity-50" : ""
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Link>

          <button
            onClick={() => setIsDeleteOpen(true)}
            disabled={isExecuting}
            className="flex-1 md:flex-none btn btn-ghost hover:bg-error/15 text-error border border-base-300 hover:border-error/20 gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Two Column Layout: Configuration Details vs History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Preference Details Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-6 space-y-6">
              <h3 className="card-title text-base font-bold text-base-content border-b border-base-300/60 pb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Preferences
              </h3>

              {/* Schedule Info */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider block">
                  Delivery Schedule
                </span>
                <div className="flex items-center gap-2 text-sm text-base-content/80 font-medium">
                  <Clock className="w-4 h-4 text-base-content/50" />
                  {getScheduleText()}
                </div>
              </div>

              {/* Delivery Email Info */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider block">
                  Recipient Email
                </span>
                <div className="flex items-center gap-2 text-sm text-base-content/80 font-medium">
                  <Mail className="w-4 h-4 text-base-content/50" />
                  <span className="truncate">{subscription.deliveryEmail}</span>
                </div>
              </div>

              {/* Subtopics Badges */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider block">
                  Subtopics Configured
                </span>
                {subscription.subtopics?.length === 0 ? (
                  <span className="text-xs text-base-content/40 italic block">No subtopics defined</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {subscription.subtopics?.map((sub: string, idx: number) => (
                      <span
                        key={idx}
                        className="badge badge-outline border-base-300 text-xs px-2.5 py-2.5 rounded-lg text-base-content/80 font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pinned Domains */}
              <div className="space-y-2 border-t border-base-300/50 pt-4">
                <span className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider block">
                  Pinned Domains
                </span>
                {subscription.pinnedSources?.length === 0 ? (
                  <span className="text-xs text-base-content/40 italic block">No specific domains pinned</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {subscription.pinnedSources?.map((src: string, idx: number) => (
                      <span
                        key={idx}
                        className="badge badge-secondary badge-outline text-xs px-2.5 py-2.5 rounded-lg font-medium"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Excluded Domains */}
              <div className="space-y-2 border-t border-base-300/50 pt-4">
                <span className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider block">
                  Excluded Domains
                </span>
                {subscription.excludedSources?.length === 0 ? (
                  <span className="text-xs text-base-content/40 italic block">No domains blacklisted</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {subscription.excludedSources?.map((src: string, idx: number) => (
                      <span
                        key={idx}
                        className="badge badge-error badge-outline text-xs px-2.5 py-2.5 rounded-lg font-medium"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History list table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-6">
              <h3 className="card-title text-base font-bold text-base-content mb-6 flex justify-between items-center">
                <span>Runs History</span>
                <span className="badge badge-neutral text-xs font-semibold">
                  {historyRuns.length} runs
                </span>
              </h3>

              {historyRuns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-base-300 rounded-2xl bg-base-100/50">
                  <Inbox className="w-12 h-12 text-base-content mb-3" />
                  <h4 className="text-sm font-bold text-base-content">No newsletters generated yet</h4>
                  <p className="text-xs text-base-content/50 max-w-xs mt-1 mb-4">
                    Trigger a manual run above to compile your first AI news summary.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full text-sm">
                    <thead>
                      <tr className="border-b border-base-300 text-base-content/65 font-bold text-xs uppercase tracking-wider">
                        <th>Date</th>
                        <th>Subject Line</th>
                        <th>Sources Used</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-300/50">
                      {historyRuns.map((run: any) => (
                        <tr key={run.id} className="hover:bg-base-300/30 transition-colors">
                          <td className="text-base-content/80 whitespace-nowrap font-medium">
                            {formatDate(run.createdAt)}
                          </td>
                          <td className="text-base-content max-w-[180px] truncate" title={run.subjectLine}>
                            {run.subjectLine || <span className="italic text-base-content/30">Pending...</span>}
                          </td>
                          <td className="text-base-content/75 font-mono text-xs">
                            {run.status === "COMPLETED" ? `${run.sourcesUsed} / ${run.totalSourcesFound}` : "—"}
                          </td>
                          <td>
                            <span className={`badge ${getRunStatusBadgeClass(run.status)} badge-sm font-semibold`}>
                              {run.status.toLowerCase()}
                            </span>
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <div className="flex gap-1 justify-end">
                              {run.status === "COMPLETED" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setActivePreviewRun(run);
                                      setIsPreviewOpen(true);
                                    }}
                                    className="btn btn-ghost btn-xs text-primary gap-1 font-semibold"
                                    title="Open preview modal"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleResendRun(run.id)}
                                    disabled={resendingRuns[run.id]}
                                    className="btn btn-ghost btn-xs text-secondary gap-1 font-semibold"
                                    title="Resend newsletter"
                                  >
                                    {resendingRuns[run.id] ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    )}
                                    Resend
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteRun(run.id)}
                                disabled={deletingRuns[run.id]}
                                className="btn btn-ghost btn-xs text-error/85 hover:text-error gap-1 font-semibold"
                                title="Delete newsletter run"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
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

      {/* Delete Subscription Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteSubscription}
        topicName={subscription.topic}
      />

      {/* Newsletter Preview Modal */}
      <NewsletterPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setActivePreviewRun(null);
        }}
        run={activePreviewRun}
      />
    </div>
  );
}
