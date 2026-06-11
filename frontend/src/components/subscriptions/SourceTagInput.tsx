"use client";

import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface SourceTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}

const SourceTagInput = ({ tags, onChange, placeholder }: SourceTagInputProps) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const validateDomain = (domain: string) => {
    // Simple domain regex
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return regex.test(domain);
  };

  const addTag = (tagText: string) => {
    setError("");
    const trimmed = tagText.trim().toLowerCase();
    if (!trimmed) return;

    if (tags.length >= 5) {
      setError("You can specify up to 5 sources only.");
      return;
    }

    if (!validateDomain(trimmed)) {
      setError("Please enter a valid domain format (e.g. techcrunch.com).");
      return;
    }

    if (tags.includes(trimmed)) {
      setError("Source already added.");
      return;
    }

    onChange([...tags, trimmed]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      setError("");
      removeTag(tags.length - 1);
    }
  };

  const removeTag = (indexToRemove: number) => {
    setError("");
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`flex flex-wrap gap-2 min-h-10 p-2 bg-base-300/40 border rounded-xl items-center transition-all duration-200 ${
          error ? "border-error focus-within:border-error focus-within:ring-error" : "border-base-300 focus-within:border-primary focus-within:ring-primary"
        }`}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="badge badge-outline badge-secondary gap-1 font-medium py-3 px-3 rounded-lg text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="hover:bg-secondary/15 p-0.5 rounded-full inline-flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : "Add..."}
          disabled={tags.length >= 5}
          className="flex-1 min-w-[120px] bg-transparent outline-none border-none text-sm text-base-content placeholder-base-content/40 focus:ring-0 px-2 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex justify-between items-center px-1">
        <p className="text-[11px] text-base-content/50">
          Max 5 domains. Press <kbd className="kbd kbd-xs bg-base-300">Enter</kbd> to add.
        </p>
        {error ? (
          <span className="text-[11px] text-error font-medium">{error}</span>
        ) : (
          <span className="text-[11px] text-base-content/40">{tags.length}/5</span>
        )}
      </div>
    </div>
  );
};

export default SourceTagInput;
