"use client";

import React, { useState } from "react";
import { X, Mail, AlertCircle, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";

interface NewsletterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: {
    id: string;
    subjectLine: string;
    htmlContent: string;
    createdAt: string;
    deliveryStatus: string;
    deliveryError?: string | null;
  } | null;
}

export default function NewsletterPreviewModal({
  isOpen,
  onClose,
  run,
}: NewsletterPreviewModalProps) {
  const [isResending, setIsResending] = useState(false);

  if (!isOpen || !run) return null;

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const response = await fetch(`/api/newsletters/${run.id}/resend`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Newsletter copy sent to email!", ToastStyles);
      } else {
        toast.error(data.error || "Failed to resend newsletter", ToastStyles);
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Network error while resending", ToastStyles);
    } finally {
      setIsResending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-4xl w-11/12 bg-base-200 border border-base-300 flex flex-col h-[85vh] p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-base-300 bg-base-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(run.createdAt)}
              </span>
              <span
                className={`badge badge-sm font-semibold ${
                  run.deliveryStatus === "SENT" ? "badge-success" : "badge-error"
                }`}
              >
                {run.deliveryStatus === "SENT" ? "Delivered" : "Delivery Failed"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-base-content truncate" title={run.subjectLine}>
              {run.subjectLine || "No Subject"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="btn btn-primary btn-sm font-semibold gap-1.5"
            >
              {isResending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Send copy
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-square hover:bg-base-300 text-base-content/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Sandbox IFrame */}
        <div className="flex-grow bg-white relative">
          <iframe
            srcDoc={run.htmlContent}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="w-full h-full border-0 absolute inset-0 bg-white"
            title="Newsletter Preview"
          />
        </div>

        {/* Modal Footer (only show if there is an error) */}
        {run.deliveryError && (
          <div className="p-4 bg-error/10 border-t border-error/20 flex items-start gap-2.5 text-error text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Delivery Error:</span> {run.deliveryError}
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
    </div>
  );
}
