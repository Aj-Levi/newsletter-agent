"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SubscriptionCard from "@/components/subscriptions/SubscriptionCard";
import DeleteConfirmModal from "@/components/subscriptions/DeleteConfirmModal";
import { Plus, Rss } from "lucide-react";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteTargetName, setDeleteTargetName] = useState("");

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else {
        toast.error("Failed to load subscriptions", ToastStyles);
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast.error("Network error while loading subscriptions", ToastStyles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteOpen(false);
    try {
      const response = await fetch(`/api/subscriptions/${deleteTargetId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Deleted topic: ${deleteTargetName}`, ToastStyles);
        fetchSubscriptions(); // Refresh list
      } else {
        toast.error(data.error || "Failed to delete subscription", ToastStyles);
      }
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error("Network error while deleting subscription", ToastStyles);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] gap-10">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight">
            My Subscriptions
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Configure topics and delivery schedules for your AI agent.
          </p>
        </div>
        
        {subscriptions.length > 0 && (
          <Link href="/subscriptions/new" className="btn btn-secondary shadow-md shadow-secondary/15 gap-2">
            <Plus className="w-5 h-5" />
            New Topic
          </Link>
        )}
      </div>

      {/* Grid Content / Loading / Empty States */}
      {loading ? (
        // Loading Skeletons Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card bg-base-200 border border-base-300 shadow-sm h-[340px] animate-pulse">
              <div className="card-body p-6 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="h-6 bg-base-300 rounded-lg w-2/3"></div>
                  <div className="h-4 bg-base-300 rounded-lg w-1/3"></div>
                </div>
                <div className="space-y-2 my-6">
                  <div className="h-7 bg-base-300 rounded-lg w-full"></div>
                  <div className="h-7 bg-base-300 rounded-lg w-3/4"></div>
                </div>
                <div className="space-y-2 border-t border-base-300 pt-3">
                  <div className="h-4 bg-base-300 rounded-lg w-1/2"></div>
                  <div className="h-4 bg-base-300 rounded-lg w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center w-full">
          {/* Empty State Illustration panel */}
          <div className="flex flex-col items-center justify-center text-center p-8 py-16 bg-base-200 border border-base-300 rounded-2xl max-w-2xl w-full shadow-sm">
            <div className="p-4 bg-primary/15 text-primary rounded-3xl mb-5">
              <Rss className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-base-content">
              No Subscriptions Configured
            </h3>
            <p className="text-sm text-base-content/60 max-w-sm mt-2 mb-6">
              You don't have any topics scheduled yet. Create your first subscription topic, and the agent will begin sending you newsletter reports.
            </p>
            <Link href="/subscriptions/new" className="btn btn-secondary px-8 font-bold shadow-md shadow-secondary/15 gap-2">
              <Plus className="w-5 h-5" />
              Configure First Topic
            </Link>
          </div>
        </div>
      ) : (
        // Render Active Subscription Cards Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onDeleteRequest={handleDeleteRequest}
              onRefreshList={fetchSubscriptions}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        topicName={deleteTargetName}
      />
    </div>
  );
}
