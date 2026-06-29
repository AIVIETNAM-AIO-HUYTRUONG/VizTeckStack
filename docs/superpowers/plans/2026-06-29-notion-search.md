# Notion Search UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện Search modal thành Notion-level UX: keyboard navigation (↑↓ Enter), recent pages khi query rỗng, và Ctrl+. mở trong tab mới.

**Architecture:** Tất cả thay đổi trong `packages/core/src/lesson/ui/`. Không cần backend mới. Recent pages dùng `localStorage`. `SearchModal.tsx` hiện có `selectedItem: Item | null` state — cần refactor sang `selectedIdx: number` để hỗ trợ keyboard nav đúng.

**Tech Stack:** React hooks (`useState`, `useEffect`, `useRef`), localStorage, existing `useSearch` hook, existing `SearchResultItem`/`SearchPreview` components.

## Global Constraints

- Tailwind semantic tokens only.
- `packages/core` không import từ `apps/*`.
- Không thêm npm packages mới — dùng React built-ins.
- Build verify: `pnpm --filter @vizteck/core build`.
- Test: `pnpm --filter @vizteck/core test` — 4 SearchModal specs phải pass.
- Conventional Commits: lowercase, no period.

---

## Codebase Context

- `SearchModal.tsx` tại `packages/core/src/lesson/ui/SearchModal.tsx:20` — hiện dùng `selectedItem: Item | null` state, không có keyboard handler, không có hint bar.
- `SearchResultItem` tại `packages/core/src/lesson/ui/SearchResultItem.tsx` — nhận `isSelected` và `onMouseEnter` props (đã có).
- `SearchPreview` tại `packages/core/src/lesson/ui/SearchPreview.tsx` — nhận `item: Item | null`.
- `useSearch` tại `packages/core/src/lesson/ui/useSearch.ts` — trả về `{ query, setQuery, titleOnly, setTitleOnly, grouped, loading }`.
- Existing spec tại `packages/core/src/lesson/ui/SearchModal.spec.tsx` — test: open/closed state, backdrop click, title-only toggle.

---

## Task 1: Keyboard Navigation trong Search Modal

**Files:**
- Modify: `packages/core/src/lesson/ui/SearchModal.tsx`

**Interfaces:**
- Không thay đổi `SearchModalProps` — chỉ refactor internal state.
- `selectedIdx: number` (-1 = không có selection) thay cho `selectedItem: Item | null`.

- [ ] **Step 1: Đọc SearchModal.tsx hiện tại**

```bash
# Đọc file để nắm exact structure trước khi edit
```

File hiện có: `selectedItem` state (line 20), không có `handleKeyDown`, không có `listRef`, không có hint bar.

- [ ] **Step 2: Viết failing test cho keyboard nav**

Thêm vào `packages/core/src/lesson/ui/SearchModal.spec.tsx`:

```tsx
it('navigates results with arrow keys', async () => {
  const user = userEvent.setup();
  const getLessonHref = (slug: string, id: string) => `/roadmap/${slug}/node/${id}`;
  render(<SearchModal open onClose={vi.fn()} getLessonHref={getLessonHref} />);

  const input = screen.getByPlaceholderText(/search/i);
  await user.type(input, 'lesson');
  // After mocked results load, first ArrowDown should select first item
  await user.keyboard('{ArrowDown}');
  const items = screen.getAllByRole('button', { name: /lesson/i });
  // First item should be aria-selected
  expect(items[0]).toHaveAttribute('aria-selected', 'true');
});
```

- [ ] **Step 3: Run test để xác nhận fail**

```bash
pnpm --filter @vizteck/core test -- --reporter=verbose SearchModal
```

Expected: test mới FAIL (keyboard nav chưa có).

- [ ] **Step 4: Refactor SearchModal với keyboard nav**

Mở `packages/core/src/lesson/ui/SearchModal.tsx`. Thay toàn bộ file:

```tsx
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
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); }
    else { setQuery(''); setSelectedIdx(-1); }
  }, [open, setQuery]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const allItems = grouped.flatMap((g) => g.items).filter((i): i is Item => !!i);
  const selectedItem = allItems[selectedIdx] ?? null;

  function navigate(item: Item) {
    const href = item.type === 'LESSON'
      ? getLessonHref(item.roadmapSlug, item.id, item.roadmapId)
      : (getRoadmapHref?.(item.roadmapSlug) ?? getLessonHref(item.roadmapSlug, item.id, item.roadmapId));
    window.location.href = href;
    onClose();
  }

  function openInNewTab(item: Item) {
    const href = item.type === 'LESSON'
      ? getLessonHref(item.roadmapSlug, item.id, item.roadmapId)
      : (getRoadmapHref?.(item.roadmapSlug) ?? getLessonHref(item.roadmapSlug, item.id, item.roadmapId));
    window.open(href, '_blank', 'noopener');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => {
        const next = Math.min(i + 1, allItems.length - 1);
        setTimeout(() => listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }), 0);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => {
        const next = Math.max(i - 1, 0);
        setTimeout(() => listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }), 0);
        return next;
      });
    } else if (e.key === 'Enter' && selectedItem) {
      e.preventDefault();
      navigate(selectedItem);
    } else if ((e.ctrlKey || e.metaKey) && e.key === '.' && selectedItem) {
      e.preventDefault();
      openInNewTab(selectedItem);
    }
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
        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <span className="text-text-3 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or ask a question..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-text-1 placeholder:text-text-3 text-sm outline-none"
          />
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-xs">
          <button
            type="button"
            onClick={() => setTitleOnly((v) => !v)}
            className={`px-2 py-1 rounded border transition-colors ${
              titleOnly ? 'border-indigo text-indigo bg-indigo/5' : 'border-border text-text-3 hover:text-text-1'
            }`}
          >
            Title only
          </button>
        </div>

        {/* Results + Preview */}
        <div className="flex flex-1 overflow-hidden">
          <div ref={listRef} className="w-[55%] overflow-y-auto px-2 py-2 border-r border-border">
            {loading && (
              <div className="space-y-1 px-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-bg-2 animate-pulse rounded-md" />)}
              </div>
            )}
            {!loading && query.length === 0 && (
              <p className="text-text-3 text-sm text-center py-8">Type to search across all lessons…</p>
            )}
            {!loading && query.length === 1 && (
              <p className="text-text-3 text-sm text-center py-6">Keep typing…</p>
            )}
            {!loading && query.length >= 2 && allItems.length === 0 && (
              <p className="text-text-3 text-sm text-center py-6">No results for &ldquo;{query}&rdquo;</p>
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
                      aria-selected={selectedItem?.id === item.id}
                      onMouseEnter={() => setSelectedIdx(allItems.indexOf(item as Item))}
                      onClick={() => navigate(item as Item)}
                    />
                  ) : null,
                )}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            <SearchPreview item={selectedItem} />
          </div>
        </div>

        {/* Keyboard hint bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-xs text-text-3">
          <span><kbd className="font-mono bg-bg-2 px-1 rounded text-[10px]">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-bg-2 px-1 rounded text-[10px]">↵</kbd> open</span>
          <span><kbd className="font-mono bg-bg-2 px-1 rounded text-[10px]">Ctrl+.</kbd> new tab</span>
          <span><kbd className="font-mono bg-bg-2 px-1 rounded text-[10px]">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @vizteck/core test -- --reporter=verbose SearchModal
```

Expected: tất cả SearchModal tests PASS (existing 4 + new keyboard nav test).

- [ ] **Step 6: Build**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/lesson/ui/SearchModal.tsx \
        packages/core/src/lesson/ui/SearchModal.spec.tsx
git commit -m "feat: add keyboard navigation and hints to search modal"
```

---

## Task 2: Recent Pages khi Search Query Rỗng

**Files:**
- Create: `packages/core/src/lesson/ui/useRecentPages.ts`
- Modify: `packages/core/src/lesson/ui/SearchModal.tsx`
- Modify: `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx` (hoặc client wrapper)

**Interfaces:**
- Produces: `useRecentPages()` → `{ getRecent(): RecentPage[], trackVisit(page: RecentPage): void }`
- `RecentPage`: `{ id: string; title: string; type: string; roadmapSlug: string; roadmapId: string; icon?: string | null }`

- [ ] **Step 1: Tạo `useRecentPages.ts`**

```ts
// packages/core/src/lesson/ui/useRecentPages.ts
'use client';
import { useCallback } from 'react';

const KEY = 'vizteck:recent-pages';
const MAX = 10;

export interface RecentPage {
  id: string;
  title: string;
  type: string;
  roadmapSlug: string;
  roadmapId: string;
  icon?: string | null;
}

export function useRecentPages() {
  const getRecent = useCallback((): RecentPage[] => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RecentPage[]; }
    catch { return []; }
  }, []);

  const trackVisit = useCallback((page: RecentPage) => {
    if (typeof window === 'undefined') return;
    const prev = getRecent().filter((p) => p.id !== page.id);
    localStorage.setItem(KEY, JSON.stringify([page, ...prev].slice(0, MAX)));
  }, [getRecent]);

  return { getRecent, trackVisit };
}
```

- [ ] **Step 2: Track visit trong web lesson page**

Mở `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`. Nếu là Server Component, tạo client wrapper `LessonPageTracker.tsx` trong cùng thư mục:

```tsx
// apps/web/src/app/roadmap/[slug]/node/[id]/LessonPageTracker.tsx
'use client';
import { useEffect } from 'react';
import { useRecentPages } from '@vizteck/core';

interface Props {
  id: string; title: string; type: string;
  roadmapSlug: string; roadmapId: string; icon?: string | null;
}

export function LessonPageTracker({ id, title, type, roadmapSlug, roadmapId, icon }: Props) {
  const { trackVisit } = useRecentPages();
  useEffect(() => {
    trackVisit({ id, title, type, roadmapSlug, roadmapId, icon });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
```

Thêm `<LessonPageTracker>` vào lesson page:

```tsx
// Trong Server Component page:
import { LessonPageTracker } from './LessonPageTracker';
// Trong return:
<LessonPageTracker
  id={node.id} title={node.title} type={node.type}
  roadmapSlug={params.slug} roadmapId={node.roadmapId} icon={node.icon}
/>
```

- [ ] **Step 3: Hiển thị recent pages trong SearchModal khi query rỗng**

Mở `packages/core/src/lesson/ui/SearchModal.tsx`. Thêm import và logic:

```tsx
import { useRecentPages, type RecentPage } from './useRecentPages';

// Trong component body:
const { getRecent } = useRecentPages();

// Thay empty state "Type to search..." thành:
{!loading && query.length === 0 && (() => {
  const recent = getRecent();
  return (
    <div>
      {recent.length > 0 && <p className="text-xs text-text-3 font-medium px-3 py-1 mt-2">Recent</p>}
      {recent.map((page) => (
        <button
          key={page.id}
          type="button"
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-2 hover:bg-bg-2 rounded-md transition-colors text-left"
          onClick={() => {
            const href = page.type === 'LESSON'
              ? getLessonHref(page.roadmapSlug, page.id, page.roadmapId)
              : (getRoadmapHref?.(page.roadmapSlug) ?? '#');
            window.location.href = href;
            onClose();
          }}
        >
          <span className="text-xs">{page.icon || (page.type === 'LESSON' ? '📄' : '📁')}</span>
          <span className="truncate">{page.title}</span>
        </button>
      ))}
      {recent.length === 0 && (
        <p className="text-text-3 text-sm text-center py-8">Type to search across all lessons…</p>
      )}
    </div>
  );
})()}
```

- [ ] **Step 4: Export `useRecentPages` từ `packages/core`**

Mở `packages/core/src/index.ts`. Kiểm tra xem `export * from './lesson/ui/useRecentPages'` đã có chưa. Nếu chưa, thêm vào.

- [ ] **Step 5: Build**

```bash
pnpm --filter @vizteck/core build
pnpm --filter @vizteck/admin build
```

- [ ] **Step 6: Test thủ công**

```bash
pnpm dev
```

Mở lesson trên web → quay lại → Ctrl+K → thấy "Recent" section với lesson vừa xem.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/lesson/ui/useRecentPages.ts \
        packages/core/src/lesson/ui/SearchModal.tsx \
        packages/core/src/index.ts \
        apps/web/src/app/roadmap/
git commit -m "feat: show recent pages in search modal when query is empty"
```

---

## Self-Review

**Spec coverage:**
- ✅ Keyboard navigation ↑↓ Enter → Task 1
- ✅ Ctrl+. open in new tab → Task 1 (built into `handleKeyDown`)
- ✅ Empty state hint → Task 1 (replaced with "Type to search...")
- ✅ Keyboard hint bar → Task 1
- ✅ Recent pages → Task 2

**Placeholder scan:** Không có TBD.

**Type consistency:** `RecentPage` trong `useRecentPages.ts` có `id, title, type, roadmapSlug, roadmapId` — nhất quán với cách `navigate()` trong SearchModal dùng `item.roadmapSlug`, `item.id`, `item.roadmapId`.
