'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  heading: string;
  body: string;
  confirmLabel: string;
  dismissLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  heading,
  body,
  confirmLabel,
  dismissLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dismissRef = useRef<HTMLButtonElement>(null);
  const headingId = 'confirm-dialog-heading';

  // Focus moves to dismiss button on open (destructive-default-safe)
  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative w-full max-w-[400px] bg-bg-1 border border-border rounded-md shadow-lg p-6 mx-4"
      >
        <h2 id={headingId} className="text-[20px] font-semibold text-text-1 mb-3">
          {heading}
        </h2>
        <p className="text-sm text-text-2 mb-6">
          {body}
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={dismissRef}
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-indigo bg-white border border-indigo rounded-sm hover:bg-indigo/5 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 cursor-pointer"
          >
            {dismissLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
