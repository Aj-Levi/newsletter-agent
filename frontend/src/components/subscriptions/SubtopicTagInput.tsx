"use client";

import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface SubtopicTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const SubtopicTagInput = ({ tags, onChange }: SubtopicTagInputProps) => {
  const [input, setInput] = useState("");

  const addTag = (tagText: string) => {
    const trimmed = tagText.trim();
    if (!trimmed) return;

    // Split by comma if there's any
    const splitTags = trimmed
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "" && !tags.includes(t));

    if (splitTags.length > 0) {
      onChange([...tags, ...splitTags]);
    }
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-10 p-2 bg-base-300/40 border border-base-300 rounded-xl items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="badge badge-primary gap-1 font-medium py-3 px-3 rounded-lg text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="hover:bg-primary-focus p-0.5 rounded-full inline-flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? "Type subtopics (e.g. LLMs, AI Agents) and press Enter" : "Add more..."}
          className="flex-1 min-w-[120px] bg-transparent outline-none border-none text-sm text-base-content placeholder-base-content/40 focus:ring-0 px-2"
        />
      </div>
      <p className="text-[11px] text-base-content/50 px-1">
        Press <kbd className="kbd kbd-xs bg-base-300">Enter</kbd> or <kbd className="kbd kbd-xs bg-base-300">,</kbd> to add subtopics.
      </p>
    </div>
  );
};

export default SubtopicTagInput;
