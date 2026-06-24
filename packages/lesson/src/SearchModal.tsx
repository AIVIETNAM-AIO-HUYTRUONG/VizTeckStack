'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearch } from './useSearch';
import { SearchResultItem } from './SearchResultItem';
import { SearchPreview } from './SearchPreview';
import type { SearchQuery } from '@vizteck/graphql-client';

type Item = NonNullable<SearchQuery['search']>[number];

export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  getLessonHref: (roadmapSlug: string, nodeId: string, roadmapId: string) => string;
  getRoadmapHref?: (roadmapSlug: string) => string;
}

export function SearchModal({ open, onClose, getLessonHref, getRoadmapHref }: SearchModalProps) {
  const { query, setQuery, titleOnly, setTitleOnly, grouped, loading } = useSearch();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedItem(null);
    }
  }, [open, setQuery]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const allItems = grouped.flatMap((g) => g.items);

  function handleItemClick(item: Item) {
    if (!item) return;
    const href =
      item.type === 'LESSON'
        ? getLessonHref(item.roadmapSlug, item.id, item.roadmapId)
        : (getRoadmapHref?.(item.roadmapSlug) ?? getLessonHref(item.roadmapSlug, item.id, item.roadmapId));
    window.location.href = href;
    onClose();
  }

  return (
    <div
      data-testid="search-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-bg-0 rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <span className="text-text-3 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or ask a question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-text-1 placeholder-text-3 text-sm outline-none"
          />
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-xs">
          <button
            type="button"
            onClick={() => setTitleOnly((v) => !v)}
            className={`px-2 py-1 rounded border transition-colors ${
              titleOnly
                ? 'border-indigo text-indigo bg-indigo/5'
                : 'border-border text-text-3 hover:text-text-1'
            }`}
          >
            Title only
          </button>
          <span className="text-text-3 ml-2 opacity-50">Created by ▾</span>
        </div>

        {/* Results + Preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: results list */}
          <div className="w-[55%] overflow-y-auto px-2 py-2 border-r border-border">
            {loading && (
              <div className="space-y-1 px-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-bg-2 animate-pulse rounded-md" />
                ))}
              </div>
            )}
            {!loading && query.length >= 2 && allItems.length === 0 && (
              <p className="text-text-3 text-sm text-center py-6">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
            {!loading && query.length < 2 && (
              <p className="text-text-3 text-sm text-center py-6">
                Type at least 2 characters to search…
              </p>
            )}
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs text-text-3 font-medium px-3 py-1 mt-2">{label}</p>
                {items.map((item) =>
                  item ? (
                    <SearchResultItem
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      onMouseEnter={() => setSelectedItem(item)}
                      onClick={() => handleItemClick(item)}
                    />
                  ) : null,
                )}
              </div>
            ))}
          </div>

          {/* Right: preview */}
          <div className="flex-1 overflow-hidden">
            <SearchPreview item={selectedItem} />
          </div>
        </div>
      </div>
    </div>
  );
}
