"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  topicName: string;
}

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  topicName,
}: DeleteConfirmModalProps) => {
  
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md bg-base-200 border border-base-300 rounded-2xl shadow-xl overflow-hidden p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          {/* Warning Icon Badge */}
          <div className="p-3.5 bg-error/15 text-error rounded-2xl mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-base-content">
            Delete Subscription?
          </h3>
          
          <p className="text-sm text-base-content/70 mt-3 leading-relaxed">
            Are you sure you want to delete the subscription for <span className="font-semibold text-base-content">"{topicName}"</span>?
          </p>

          <p className="text-xs text-error font-medium mt-2 bg-error/10 border border-error/20 p-2.5 rounded-lg w-full">
            This will permanently remove all preferences and delete all past newsletters/source data associated with this subscription.
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={onClose}
              className="flex-1 btn btn-ghost border border-base-300 hover:bg-base-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 btn btn-error text-error-content font-bold shadow-md shadow-error/15"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
