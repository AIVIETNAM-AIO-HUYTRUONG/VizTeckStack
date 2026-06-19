'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@vizteck/ui';
import { slugify } from '@/lib/api';

interface RoadmapModalProps {
  mode: 'create' | 'edit';
  initial?: { id: string; title: string; slug: string };
  onSubmit: (data: { title: string; slug: string }) => Promise<void>;
  onClose: () => void;
}

export function RoadmapModal({ mode, initial, onSubmit, onClose }: RoadmapModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const headingId = 'roadmap-modal-heading';
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      // Auto-generate slug from title (create mode only, if not manually edited)
      if (mode === 'create' && !slugManuallyEdited) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setSlug(slugify(newTitle));
        }, 300);
      }
    },
    [mode, slugManuallyEdited],
  );

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), slug: slug.trim() });
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
        className="relative w-full max-w-[480px] bg-bg-1 border border-border rounded-md shadow-lg p-6 mx-4"
      >
        <h2 id={headingId} className="text-[20px] font-semibold text-text-1 mb-5">
          {heading}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roadmap-title" className="block text-sm font-semibold text-text-1 mb-1">
              Title
            </label>
            <input
              ref={titleRef}
              id="roadmap-title"
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Frontend Developer"
              className="w-full h-10 px-3 text-sm text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
            />
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
              placeholder="e.g. frontend-developer"
              className="w-full h-10 px-3 text-sm font-mono text-text-1 bg-bg-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isCreate && (
              <p className="mt-1 text-[12px] text-text-3">
                Auto-generated from title. You can edit before saving.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              {dismissLabel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !title.trim()}
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {primaryLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
