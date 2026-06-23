"use client";

import { useState } from "react";
import { CoverDisplay } from "@vizteck/lesson";
import type { BreadcrumbItem } from "@vizteck/lesson";
import { IconPicker } from "./IconPicker";
import { CoverUploadModal } from "./CoverUploadModal";

export interface CoverImageProps {
  cover: string | null;
  icon: string | null;
  breadcrumb: BreadcrumbItem[];
  onCoverChange: (url: string | null) => void;
  onIconChange: (value: string | null) => void;
}

export function CoverImage({
  cover,
  icon,
  breadcrumb,
  onCoverChange,
  onIconChange,
}: CoverImageProps) {
  const [hovered, setHovered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowUrlInput(false); }}
    >
      {/* CoverDisplay with icon click wired to IconPicker */}
      <CoverDisplay
        coverImage={cover}
        icon={icon}
        breadcrumb={breadcrumb}
        onIconClick={() => setPickerOpen((o) => !o)}
      />

      {/* IconPicker positioned at bottom-left (over the floating icon) */}
      <div className="absolute left-4 bottom-[-20px] z-20">
        <IconPicker
          icon={icon}
          onIconChange={onIconChange}
          isOpen={pickerOpen}
          onToggle={() => setPickerOpen((o) => !o)}
        />
      </div>

      {/* Cover edit controls — show on hover */}
      {hovered && (
        <div className="absolute bottom-2 right-3 flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2.5 py-1 text-xs text-white hover:bg-black/70 transition-colors"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput((v) => !v)}
            className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2.5 py-1 text-xs text-white hover:bg-black/70 transition-colors"
          >
            Paste URL
          </button>
          {cover && (
            <button
              type="button"
              onClick={() => onCoverChange(null)}
              className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2.5 py-1 text-xs text-white hover:bg-black/70 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Inline URL input */}
      {showUrlInput && (
        <div className="absolute bottom-10 right-3 z-20 flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/img.jpg"
            className="bg-bg-0 border border-border rounded px-2.5 py-1 text-xs text-text-1 placeholder:text-text-3 focus:outline-none focus:border-indigo w-64"
            onKeyDown={(e) => {
              if (e.key === "Enter" && urlValue.trim()) {
                onCoverChange(urlValue.trim());
                setShowUrlInput(false);
                setUrlValue("");
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              if (urlValue.trim()) onCoverChange(urlValue.trim());
              setShowUrlInput(false);
              setUrlValue("");
            }}
            className="bg-indigo text-white rounded px-2.5 py-1 text-xs"
          >
            Set
          </button>
        </div>
      )}

      {/* Upload modal */}
      {modalOpen && (
        <CoverUploadModal
          onUploaded={(url) => { onCoverChange(url); setModalOpen(false); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
