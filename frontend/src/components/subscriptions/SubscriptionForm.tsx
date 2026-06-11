"use client";

import React, { useState, useEffect } from "react";
import SubtopicTagInput from "./SubtopicTagInput";
import SourceTagInput from "./SourceTagInput";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";
import { useRouter } from "next/navigation";

interface SubscriptionFormProps {
  initialValues?: {
    id?: string;
    topic: string;
    subtopics: string[];
    depthLevel: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
    tone: "TECHNICAL" | "CASUAL" | "EXECUTIVE";
    pinnedSources: string[];
    excludedSources: string[];
    scheduleType: "DAILY" | "WEEKLY" | "MANUAL";
    scheduleDayOfWeek: number | null;
    scheduleHour: number | null;
    scheduleMinute: number | null;
    deliveryEmail: string;
    status: "ACTIVE" | "PAUSED" | "RUNNING" | "FAILED";
  };
  onSubmit: (data: any) => Promise<boolean>;
  submitButtonText: string;
  defaultEmail?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const SubscriptionForm = ({
  initialValues,
  onSubmit,
  submitButtonText,
  defaultEmail = "",
}: SubscriptionFormProps) => {
  const router = useRouter();

  // State initialization
  const [topic, setTopic] = useState(initialValues?.topic || "");
  const [subtopics, setSubtopics] = useState<string[]>(initialValues?.subtopics || []);
  const [depthLevel, setDepthLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "EXPERT">(
    initialValues?.depthLevel || "INTERMEDIATE"
  );
  const [tone, setTone] = useState<"TECHNICAL" | "CASUAL" | "EXECUTIVE">(
    initialValues?.tone || "CASUAL"
  );
  const [pinnedSources, setPinnedSources] = useState<string[]>(initialValues?.pinnedSources || []);
  const [excludedSources, setExcludedSources] = useState<string[]>(initialValues?.excludedSources || []);
  const [scheduleType, setScheduleType] = useState<"DAILY" | "WEEKLY" | "MANUAL">(
    initialValues?.scheduleType || "MANUAL"
  );
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(
    initialValues?.scheduleDayOfWeek !== null && initialValues?.scheduleDayOfWeek !== undefined
      ? initialValues.scheduleDayOfWeek
      : 1 // default Monday
  );
  
  // Set default hours/minutes or split from current inputs
  const [scheduleHour, setScheduleHour] = useState<number>(
    initialValues?.scheduleHour !== null && initialValues?.scheduleHour !== undefined
      ? initialValues.scheduleHour
      : 8 // default 8 AM
  );
  const [scheduleMinute, setScheduleMinute] = useState<number>(
    initialValues?.scheduleMinute !== null && initialValues?.scheduleMinute !== undefined
      ? initialValues.scheduleMinute
      : 0
  );

  const [deliveryEmail, setDeliveryEmail] = useState(
    initialValues?.deliveryEmail || defaultEmail
  );
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">(
    initialValues?.status === "PAUSED" ? "PAUSED" : "ACTIVE"
  );

  const [loading, setLoading] = useState(false);

  // Sync defaultEmail when session finishes loading
  useEffect(() => {
    if (defaultEmail && !deliveryEmail && !initialValues) {
      setDeliveryEmail(defaultEmail);
    }
  }, [defaultEmail, deliveryEmail, initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error("Please enter a topic name", ToastStyles);
      return;
    }

    if (!deliveryEmail.trim()) {
      toast.error("Please enter a delivery email", ToastStyles);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        topic: topic.trim(),
        subtopics,
        depthLevel,
        tone,
        pinnedSources,
        excludedSources,
        scheduleType,
        scheduleDayOfWeek: scheduleType === "WEEKLY" ? scheduleDayOfWeek : null,
        scheduleHour: scheduleType !== "MANUAL" ? scheduleHour : null,
        scheduleMinute: scheduleType !== "MANUAL" ? scheduleMinute : null,
        deliveryEmail: deliveryEmail.trim(),
        status,
      };

      const success = await onSubmit(payload);
      if (success) {
        toast.success(
          initialValues ? "Subscription updated!" : "Subscription created!",
          ToastStyles
        );
        router.push("/subscriptions");
        router.refresh();
      }
    } catch (error) {
      console.error("Error submitting subscription form:", error);
      toast.error("An unexpected error occurred", ToastStyles);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Section: Core details */}
        <div className="space-y-6 bg-base-200 p-6 rounded-2xl border border-base-300">
          <h3 className="text-md font-bold text-base-content uppercase tracking-wider">
            1. General Preferences
          </h3>
          
          {/* Topic Name */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content/85">Topic Name *</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Artificial Intelligence, Quantum Computing"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Subtopics Tag Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content/85">Subtopics</span>
            </label>
            <SubtopicTagInput tags={subtopics} onChange={setSubtopics} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Depth Level */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold text-base-content/85">Depth Level</span>
              </label>
              <select
                value={depthLevel}
                onChange={(e) => setDepthLevel(e.target.value as any)}
                className="select select-bordered w-full"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            {/* Tone Selector */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold text-base-content/85">Writing Tone</span>
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="select select-bordered w-full"
              >
                <option value="CASUAL">Casual</option>
                <option value="TECHNICAL">Technical</option>
                <option value="EXECUTIVE">Executive Summary</option>
              </select>
            </div>
          </div>

          {/* Delivery Email */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content/85">Delivery Email *</span>
            </label>
            <input
              type="email"
              placeholder="defaults to your account email"
              value={deliveryEmail}
              onChange={(e) => setDeliveryEmail(e.target.value)}
              className="input input-bordered w-full"
              required
            />
          </div>
        </div>

        {/* Right Section: Sources and Schedule */}
        <div className="space-y-6 bg-base-200 p-6 rounded-2xl border border-base-300">
          <h3 className="text-md font-bold text-base-content uppercase tracking-wider">
            2. Web Search & Schedules
          </h3>

          {/* Pinned Sources */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content/85">Preferred Domains (Pinned)</span>
            </label>
            <SourceTagInput
              tags={pinnedSources}
              onChange={setPinnedSources}
              placeholder="e.g. techcrunch.com, arxiv.org"
            />
          </div>

          {/* Excluded Sources */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content/85">Excluded Domains (Blacklist)</span>
            </label>
            <SourceTagInput
              tags={excludedSources}
              onChange={setExcludedSources}
              placeholder="e.g. reddit.com, medium.com"
            />
          </div>

          {/* Schedule selection */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-base-content/85">Delivery Schedule</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["MANUAL", "DAILY", "WEEKLY"] as const).map((type) => (
                <label
                  key={type}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center ${
                    scheduleType === type
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-base-300 bg-base-100 hover:bg-base-300/30 text-base-content/70"
                  }`}
                >
                  <input
                    type="radio"
                    name="scheduleType"
                    value={type}
                    checked={scheduleType === type}
                    onChange={() => setScheduleType(type)}
                    className="sr-only"
                  />
                  <span className="text-sm">{type === "MANUAL" ? "Manual Only" : type === "DAILY" ? "Daily" : "Weekly"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Weekly Options */}
          {scheduleType === "WEEKLY" && (
            <div className="form-control w-full animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="label">
                <span className="label-text font-semibold text-base-content/85">Day of Week</span>
              </label>
              <select
                value={scheduleDayOfWeek}
                onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                className="select select-bordered w-full"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    Every {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hourly/Time selection */}
          {scheduleType !== "MANUAL" && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/85">Hour (UTC)</span>
                </label>
                <select
                  value={scheduleHour}
                  onChange={(e) => setScheduleHour(Number(e.target.value))}
                  className="select select-bordered w-full"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00 ({h >= 12 ? `${h === 12 ? 12 : h - 12} PM` : `${h === 0 ? 12 : h} AM`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/85">Minute</span>
                </label>
                <select
                  value={scheduleMinute}
                  onChange={(e) => setScheduleMinute(Number(e.target.value))}
                  className="select select-bordered w-full"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Status Checkbox */}
          <div className="form-control pt-2">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={status === "ACTIVE"}
                onChange={(e) => setStatus(e.target.checked ? "ACTIVE" : "PAUSED")}
                className="checkbox checkbox-primary"
              />
              <span className="label-text font-semibold text-base-content/85">
                Active (Enable scheduled delivery)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Form Submit & Cancel actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/subscriptions")}
          className="btn btn-ghost border border-base-300 hover:bg-base-300"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-secondary px-8 font-bold shadow-md shadow-secondary/15"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner"></span> : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default SubscriptionForm;
