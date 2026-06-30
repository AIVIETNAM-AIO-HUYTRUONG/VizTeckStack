"use client";

import { useState, useEffect } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export interface CoverUploadModalProps {
  onUploaded: (url: string) => void;
  onClose: () => void;
}

export function CoverUploadModal({ onUploaded, onClose }: CoverUploadModalProps) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const { startUpload } = useUploadThing("coverUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.ufsUrl) {
        onUploaded(res[0].ufsUrl);
        onClose();
      }
      setUploading(false);
    },
    onUploadError: (e) => {
      setError(e.message);
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    await startUpload([file]);
  };

  const handleUrlConfirm = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onUploaded(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-upload-modal-title"
        className="bg-bg-1 border border-border rounded-xl w-[400px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 id="cover-upload-modal-title" className="font-display font-bold text-sm text-text-1">Set cover image</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-text-2 hover:text-text-1 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["upload", "url"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "text-indigo border-b-2 border-indigo"
                  : "text-text-2 hover:text-text-1"
              }`}
            >
              {t === "upload" ? "Upload file" : "Paste URL"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === "upload" && (
            <div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-indigo transition-colors">
                <span className="text-3xl mb-2">📁</span>
                <span className="text-sm text-text-2 font-medium">
                  {uploading ? "Uploading…" : "Click to upload"}
                </span>
                <span className="text-xs text-text-2 mt-1">PNG, JPG, WebP — max 4MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleFileChange}
                />
              </label>
              {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
              )}
            </div>
          )}

          {tab === "url" && (
            <div className="space-y-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-bg-0 border border-border rounded-lg px-3 py-2.5 text-sm text-text-1 placeholder:text-text-2 focus:outline-none focus:border-indigo"
                onKeyDown={(e) => e.key === "Enter" && handleUrlConfirm()}
              />
              <button
                type="button"
                onClick={handleUrlConfirm}
                disabled={!urlInput.trim()}
                className="w-full py-2.5 text-sm font-medium bg-indigo text-white rounded-lg disabled:opacity-40 hover:bg-indigo/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
