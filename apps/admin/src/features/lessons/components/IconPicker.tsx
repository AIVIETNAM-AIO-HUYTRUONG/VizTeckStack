"use client";

import { useState } from "react";

const EMOJI_LIST = [
  "🚀", "📘", "🎯", "💡", "🔥", "⭐", "🌐", "🛠️", "📦", "🧩",
  "✨", "⚡", "💻", "🔑", "🎨", "📊", "🔧", "🌟", "🏆", "🎓",
  "📝", "🔍", "💎", "🧠",
];

const LUCIDE_ICONS = [
  "Zap", "Rocket", "BookOpen", "Target", "Lightbulb", "Flame",
  "Star", "Globe", "Wrench", "Package", "Puzzle", "Sparkles",
  "Code", "Database", "Server", "Terminal", "Layout", "Layers",
  "Box", "ArrowRight", "Check", "Link", "Lock", "FileText",
];

type Tab = "emoji" | "text" | "icons";

export interface IconPickerProps {
  icon: string | null;
  onIconChange: (value: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function IconPicker({ icon, onIconChange, isOpen, onToggle }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("emoji");
  const [textInput, setTextInput] = useState(icon ?? "");

  const handleSelect = (value: string | null) => {
    onIconChange(value);
    onToggle(); // close after selection
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        className="w-10 h-10 bg-bg-0 border border-border rounded-lg flex items-center justify-center text-2xl cursor-pointer hover:border-indigo transition-colors select-none"
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
      >
        {icon || "📄"}
      </div>

      {/* Picker dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-12 z-50 w-56 bg-bg-1 border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["emoji", "text", "icons"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-indigo border-b-2 border-indigo"
                    : "text-text-3 hover:text-text-2"
                }`}
              >
                {tab === "emoji" ? "Emoji" : tab === "text" ? "Text" : "Icons"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-3">
            {activeTab === "emoji" && (
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_LIST.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleSelect(e)}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-bg-2 transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "text" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type or paste emoji/text"
                  className="w-full bg-bg-0 border border-border rounded-lg px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-indigo"
                />
                <button
                  type="button"
                  disabled={!textInput.trim()}
                  onClick={() => handleSelect(textInput.trim() || null)}
                  className="w-full py-2 text-sm font-medium bg-indigo text-white rounded-lg disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            )}

            {activeTab === "icons" && (
              <div className="grid grid-cols-4 gap-1">
                {LUCIDE_ICONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelect(name)}
                    className={`py-1.5 text-[10px] text-text-3 hover:text-text-1 hover:bg-bg-2 rounded transition-colors truncate ${
                      icon === name ? "bg-bg-2 text-indigo" : ""
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remove */}
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full py-1.5 text-xs text-text-3 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
