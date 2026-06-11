"use client";

import React, { useState, useEffect } from "react";
import SubscriptionForm from "@/components/subscriptions/SubscriptionForm";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";

export default function NewSubscriptionPage() {
  const [defaultEmail, setDefaultEmail] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);

  // Retrieve user session email client-side
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch session");
      })
      .then((session) => {
        if (session?.user?.email) {
          setDefaultEmail(session.user.email);
        }
      })
      .catch((err) => console.error("Error retrieving session email:", err))
      .finally(() => setLoadingSession(false));
  }, []);

  const handleCreateSubscription = async (payload: any): Promise<boolean> => {
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return true;
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create subscription", ToastStyles);
        return false;
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Network error while creating subscription", ToastStyles);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight">
          Create Subscription
        </h2>
        <p className="text-sm text-base-content/70 mt-1">
          Add a new topic to schedule automated AI compilations.
        </p>
      </div>

      <div className="border-t border-base-300 pt-6">
        {loadingSession ? (
          <div className="flex flex-col gap-4 max-w-5xl">
            <div className="h-40 bg-base-200 rounded-2xl animate-pulse"></div>
            <div className="h-40 bg-base-200 rounded-2xl animate-pulse"></div>
          </div>
        ) : (
          <SubscriptionForm
            onSubmit={handleCreateSubscription}
            submitButtonText="Create Topic"
            defaultEmail={defaultEmail}
          />
        )}
      </div>
    </div>
  );
}
