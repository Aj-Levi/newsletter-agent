"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, AlertCircle, Rss, ArrowRight } from "lucide-react";

interface UnsubscribeClientProps {
  subscriptionId: string;
  initialTopic: string;
  initialEmail: string;
}

export default function UnsubscribeClient({
  subscriptionId,
  initialTopic,
  initialEmail,
}: UnsubscribeClientProps) {
  const [topicName, setTopicName] = useState<string>(initialTopic);
  const [deliveryEmail, setDeliveryEmail] = useState<string>(initialEmail);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleUnsubscribe = async () => {
    setStatus("submitting");
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/unsubscribe`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        if (data.topic) setTopicName(data.topic);
        if (data.deliveryEmail) setDeliveryEmail(data.deliveryEmail);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to unsubscribe. Please try again.");
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setStatus("error");
      setErrorMessage("Network error. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
      <div className="card w-full max-w-md bg-base-200 border border-base-300 shadow-xl overflow-hidden">
        <div className="card-body p-8 items-center text-center">
          
          {/* Header Icon */}
          {status === "success" ? (
            <div className="p-4 bg-success/15 text-success rounded-full mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>
          ) : status === "error" ? (
            <div className="p-4 bg-error/15 text-error rounded-full mb-4">
              <AlertCircle className="w-12 h-12" />
            </div>
          ) : (
            <div className="p-4 bg-warning/15 text-warning rounded-full mb-4">
              <Rss className="w-12 h-12" />
            </div>
          )}

          {/* Title */}
          <h2 className="card-title text-2xl font-bold text-base-content">
            {status === "success" ? "Unsubscribed" : "Confirm Unsubscribe"}
          </h2>

          {/* Body */}
          {status === "success" ? (
            <div className="space-y-4 my-4 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-sm text-base-content/70 leading-relaxed">
                You have been successfully unsubscribed from the newsletter updates for
                <span className="font-semibold text-base-content block mt-1">"{topicName || "this topic"}"</span>.
              </p>
              {deliveryEmail && (
                <p className="text-xs text-base-content/50">
                  Recipient email: <span className="font-mono">{deliveryEmail}</span>
                </p>
              )}
              <div className="alert alert-info py-2.5 px-3 text-xs bg-info/10 border border-info/20 text-base-content rounded-lg">
                Your subscription status is now set to Paused. You can resume updates at any time by logging into your account dashboard.
              </div>
            </div>
          ) : status === "error" ? (
            <div className="space-y-4 my-4">
              <p className="text-sm text-error/90 bg-error/10 border border-error/20 p-3 rounded-lg font-medium text-left">
                {errorMessage}
              </p>
              <button onClick={() => setStatus("idle")} className="btn btn-ghost btn-sm text-primary">
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-2 my-4 w-full">
              <p className="text-sm text-base-content/70 leading-relaxed">
                Are you sure you want to stop receiving personalized AI newsletters on
                &nbsp;<span className="font-semibold text-base-content mt-1">"{topicName || "this topic"}"</span>&nbsp;?
              </p>

              <button
                onClick={handleUnsubscribe}
                disabled={status === "submitting"}
                className="btn btn-error w-full font-bold shadow-md shadow-error/15 gap-2 mt-4 animate-pulse-once"
              >
                {status === "submitting" ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Yes, Unsubscribe
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="card-actions justify-center mt-2 w-full border-t border-base-300 pt-5">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-primary hover:text-primary-focus flex items-center gap-1 group"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
