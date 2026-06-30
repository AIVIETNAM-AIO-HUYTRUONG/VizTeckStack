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
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const headingId = 'confirm-dialog-heading';

  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const el = dialogRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative w-full max-w-[400px] bg-bg-1 border border-border rounded-md shadow-lg p-6 mx-4"
      >
        <h2 id={headingId} className="font-display text-[20px] font-semibold text-text-1 mb-3">
          {heading}
        </h2>
        <p className="text-sm text-text-2 mb-6">{body}</p>
        <div className="flex justify-end gap-2">
          <button
            ref={dismissRef}
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-indigo bg-bg-1 border border-indigo rounded-sm hover:bg-indigo-lt focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 cursor-pointer"
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
