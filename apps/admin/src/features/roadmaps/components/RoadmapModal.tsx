'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@vizteck/ui';
import { slugify } from '@/lib/api';

interface RoadmapModalProps {
  mode: 'create' | 'edit';
  initial?: { id: string; title: string; slug: string; description?: string };
  onSubmit: (data: { title: string; slug: string; description: string }) => Promise<void>;
  onClose: () => void;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export function RoadmapModal({ mode, initial, onSubmit, onClose }: RoadmapModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugError, setSlugError] = useState('');

  const headingId = 'roadmap-modal-heading';
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus first field on open
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Escape + focus trap
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

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      setError('');

      if (mode === 'create' && !slugManuallyEdited) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setSlug(slugify(newTitle));
          setSlugError('');
        }, 300);
      }
    },
    [mode, slugManuallyEdited],
  );

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSlug(val);
    setSlugManuallyEdited(true);
    setSlugError(val && !SLUG_RE.test(val) ? 'Lowercase letters, numbers, and hyphens only. Must start with a letter or number.' : '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmedTitle = title.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedTitle) return;
    if (mode === 'create' && !SLUG_RE.test(trimmedSlug)) {
      setSlugError('Slug must be lowercase letters, numbers, and hyphens only.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit({ title: trimmedTitle, slug: trimmedSlug, description: description.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isCreate = mode === 'create';
  const heading = isCreate ? 'Create Roadmap' : 'Edit Roadmap';
  const primaryLabel = isCreate ? 'Create Roadmap' : 'Save Changes';
  const dismissLabel = isCreate ? 'Discard' : 'Discard Changes';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative w-full max-w-[480px] bg-bg-1 border border-border rounded-md shadow-lg p-6 mx-4 max-h-[90dvh] overflow-y-auto"
      >
        <h2 id={headingId} className="text-[20px] font-semibold text-text-1 mb-5">
          {heading}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roadmap-title" className="block text-sm font-semibold text-text-1 mb-1">
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              ref={titleRef}
              id="roadmap-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Frontend Developer"
              className="w-full h-10 px-3 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
            />
            {title.length > 180 && (
              <p className="mt-1 text-[11px] text-warning">{200 - title.length} characters remaining</p>
            )}
          </div>

          <div>
            <label htmlFor="roadmap-slug" className="block text-sm font-semibold text-text-1 mb-1">
              Slug
            </label>
            <input
              id="roadmap-slug"
              type="text"
              value={slug}
              onChange={handleSlugChange}
              disabled={!isCreate}
              maxLength={100}
              placeholder="e.g. frontend-developer"
              aria-invalid={!!slugError || undefined}
              aria-describedby={slugError ? 'slug-error' : 'slug-hint'}
              className={`w-full h-10 px-3 text-sm font-mono text-text-1 bg-bg-2 border rounded-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                slugError
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-border focus:ring-indigo focus:border-indigo'
              }`}
            />
            {slugError ? (
              <p id="slug-error" className="mt-1 text-[12px] text-red-500" role="alert">{slugError}</p>
            ) : isCreate && (
              <p id="slug-hint" className="mt-1 text-[12px] text-text-3">
                Auto-generated from title. You can edit before saving.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="roadmap-description" className="block text-sm font-semibold text-text-1 mb-1">
              Description <span className="text-text-3 font-normal">(optional)</span>
            </label>
            <textarea
              id="roadmap-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description shown on the public roadmap card"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo resize-none"
            />
            {description.length > 450 && (
              <p className="mt-1 text-[11px] text-warning">{500 - description.length} characters remaining</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              {dismissLabel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading || !title.trim() || !!slugError}
            >
              {primaryLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
