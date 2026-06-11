"use client";

import React, { useState, useEffect, use } from "react";
import SubscriptionForm from "@/components/subscriptions/SubscriptionForm";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";
import { AlertCircle } from "lucide-react";

interface EditSubscriptionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSubscriptionPage({ params }: EditSubscriptionPageProps) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions/${id}`);
        if (response.ok) {
          const data = await response.json();
          setInitialData(data);
        } else {
          const errData = await response.json();
          setError(errData.error || "Subscription not found");
        }
      } catch (err) {
        console.error("Error loading subscription for editing:", err);
        setError("Network error while fetching subscription details");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [id]);

  const handleEditSubscription = async (payload: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return true;
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update subscription", ToastStyles);
        return false;
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Network error while updating subscription", ToastStyles);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight">
          Edit Subscription
        </h2>
        <p className="text-sm text-base-content/70 mt-1">
          Modify preferences, sources, or schedule adjustments.
        </p>
      </div>

      <div className="border-t border-base-300 pt-6">
        {loading ? (
          <div className="flex flex-col gap-4 max-w-5xl">
            <div className="h-40 bg-base-200 rounded-2xl animate-pulse"></div>
            <div className="h-40 bg-base-200 rounded-2xl animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="alert alert-error max-w-md shadow-sm">
            <AlertCircle className="w-5 h-5" />
            <div>
              <h3 className="font-bold">Error</h3>
              <div className="text-xs">{error}</div>
            </div>
          </div>
        ) : (
          <SubscriptionForm
            initialValues={initialData}
            onSubmit={handleEditSubscription}
            submitButtonText="Save Changes"
          />
        )}
      </div>
    </div>
  );
}
