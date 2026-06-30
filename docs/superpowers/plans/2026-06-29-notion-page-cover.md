# Notion Page Cover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp cover image feature thành Notion-level: **Gradient cover picker** (12 presets) và **Unsplash photo picker** (search + proxy endpoint). Upload và Paste URL đã có sẵn.

**Architecture:** Gradient: pure frontend, lưu `gradient:<css>` string vào `coverImage` field. `CoverDisplay` detect prefix và apply CSS. Unsplash: proxy endpoint trong api-gateway để ẩn API key. Admin `CoverUploadModal` thêm 2 tabs mới.

**Tech Stack:** Tailwind (gradient presets), NestJS REST (Unsplash proxy), `fetch` API.

## Global Constraints

- Tailwind semantic tokens. Gradient CSS dùng hex trực tiếp (là giá trị data, không phải Tailwind class).
- `UNSPLASH_ACCESS_KEY` env var trong `apps/api-gateway` — không commit key thật.
- Không thêm npm package mới cho gradient.
- Conventional Commits.

---

## Codebase Context

- `CoverDisplay.tsx` tại `packages/core/src/lesson/ui/CoverDisplay.tsx:22-32` — hiện check `showImage = !!coverImage && !imgError` và render `<img>` hoặc fallback gradient div.
- `CoverImage.tsx` tại `apps/admin/src/features/lessons/components/CoverImage.tsx` — hover controls: Upload, Paste URL, Remove.
- `CoverUploadModal.tsx` tại `apps/admin/src/features/lessons/components/CoverUploadModal.tsx` — uploadthing modal.
- REST controller: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`.

---

## Task 1: Gradient Cover Picker

**Files:**
- Create: `packages/core/src/lesson/ui/gradients.ts`
- Modify: `packages/core/src/lesson/ui/CoverDisplay.tsx`
- Modify: `apps/admin/src/features/lessons/components/CoverImage.tsx`

**Interfaces:**
- `coverImage` value khi là gradient: `"gradient:linear-gradient(...)"` (prefix `gradient:`)
- `CoverDisplay` detect prefix → apply as `style.backgroundImage`, không dùng `<img>`
- `toGradientValue(css)` và `isGradient(value)` export từ `@vizteck/core`

- [ ] **Step 1: Tạo `gradients.ts`**

```ts
// packages/core/src/lesson/ui/gradients.ts
export const GRADIENT_PREFIX = 'gradient:';

export const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #fd7043 0%, #ffca28 100%)',
  'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f9f586 0%, #2ecc71 100%)',
];

export function isGradient(value: string | null | undefined): boolean {
  return !!value?.startsWith(GRADIENT_PREFIX);
}

export function toGradientValue(css: string): string {
  return `${GRADIENT_PREFIX}${css}`;
}

export function extractGradientCss(value: string): string {
  return value.startsWith(GRADIENT_PREFIX) ? value.slice(GRADIENT_PREFIX.length) : value;
}
```

- [ ] **Step 2: Export từ `packages/core`**

Mở `packages/core/src/index.ts`. Thêm:

```ts
export { COVER_GRADIENTS, isGradient, toGradientValue, extractGradientCss, GRADIENT_PREFIX } from './lesson/ui/gradients';
```

- [ ] **Step 3: Update `CoverDisplay` để render gradient**

Mở `packages/core/src/lesson/ui/CoverDisplay.tsx`. Thêm import và logic:

```tsx
import { isGradient, extractGradientCss } from './gradients';

// Trong component, trước `showImage`:
if (coverImage && isGradient(coverImage)) {
  return (
    <div className="relative w-full h-[200px]">
      <div
        className="w-full h-full"
        style={{ backgroundImage: extractGradientCss(coverImage) }}
        aria-hidden="true"
      />
      {breadcrumb.length > 0 && (
        <div className="absolute top-3 left-4">
          <BreadcrumbDisplay items={breadcrumb} variant="overlay" getLinkHref={getLinkHref} />
        </div>
      )}
      <div
        className={`absolute left-4 -bottom-5 w-10 h-10 bg-bg-0 border border-border rounded-lg flex items-center justify-center text-2xl z-10 select-none${onIconClick ? ' cursor-pointer hover:border-indigo transition-colors' : ''}`}
        onClick={onIconClick}
        {...(onIconClick ? { role: 'button', tabIndex: 0 } : {})}
      >
        {icon || '📄'}
      </div>
    </div>
  );
}

// Tiếp tục với existing logic (showImage check)
```

- [ ] **Step 4: Viết test**

Thêm vào `packages/core/src/lesson/ui/CoverDisplay.spec.tsx` (tạo nếu chưa có):

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoverDisplay } from './CoverDisplay';

describe('CoverDisplay gradient', () => {
  it('renders gradient div when coverImage starts with gradient:', () => {
    const { container } = render(
      <CoverDisplay
        coverImage="gradient:linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        icon={null}
        breadcrumb={[]}
      />
    );
    const div = container.querySelector('[style*="linear-gradient"]');
    expect(div).toBeTruthy();
  });

  it('renders img when coverImage is a URL', () => {
    render(
      <CoverDisplay coverImage="https://example.com/img.jpg" icon={null} breadcrumb={[]} />
    );
    expect(screen.getByRole('img', { name: 'cover' })).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @vizteck/core test -- CoverDisplay
```

Expected: PASS.

- [ ] **Step 6: Thêm Gradient tab vào `CoverImage.tsx`**

Mở `apps/admin/src/features/lessons/components/CoverImage.tsx`. Thêm import và gradient picker:

```tsx
import { COVER_GRADIENTS, toGradientValue } from '@vizteck/lesson'; // hoặc @vizteck/core

// Thêm state cho active tab (chỉ cần nếu có UI chuyển tab):
// Hiện CoverImage có: Upload button (modal), Paste URL button (inline input)
// Thêm: Gradient button (inline picker)
const [showGradients, setShowGradients] = useState(false);

// Trong hover controls, thêm button "Gradient":
<button
  type="button"
  onClick={() => setShowGradients((v) => !v)}
  className="bg-black/50 backdrop-blur-sm border border-white/20 rounded px-2.5 py-1 text-xs text-white hover:bg-black/70 transition-colors"
>
  Gradient
</button>

// Gradient picker panel (hiện khi showGradients = true):
{showGradients && (
  <div className="absolute bottom-12 right-3 z-20 bg-bg-0 border border-border rounded-xl shadow-xl p-3 w-64">
    <p className="text-xs text-text-3 mb-2">Choose gradient</p>
    <div className="grid grid-cols-4 gap-1.5">
      {COVER_GRADIENTS.map((gradient) => (
        <button
          key={gradient}
          type="button"
          onClick={() => { onCoverChange(toGradientValue(gradient)); setShowGradients(false); }}
          className="h-10 rounded-md cursor-pointer hover:scale-105 transition-transform hover:ring-2 hover:ring-indigo ring-offset-1"
          style={{ backgroundImage: gradient }}
          aria-label="Select gradient"
        />
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 7: Build và test thủ công**

```bash
pnpm --filter @vizteck/core build
pnpm --filter @vizteck/admin build
pnpm dev
```

Hover cover → click "Gradient" → picker mở → chọn gradient → cover đổi ngay. Web viewer cũng hiển thị đúng gradient.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/lesson/ui/gradients.ts \
        packages/core/src/lesson/ui/CoverDisplay.tsx \
        packages/core/src/lesson/ui/CoverDisplay.spec.tsx \
        packages/core/src/index.ts \
        apps/admin/src/features/lessons/components/CoverImage.tsx
git commit -m "feat: add gradient cover picker to lesson cover editor"
```

---

## Task 2: Unsplash Cover Picker

**Files:**
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Modify: `apps/api-gateway/.env.example`
- Modify: `apps/admin/src/features/lessons/components/CoverUploadModal.tsx`

**Interfaces:**
- Produces: `GET /api/unsplash/search?q=<query>` → `{ results: UnsplashPhoto[] }`
- `UnsplashPhoto`: `{ url: string; thumbUrl: string; authorName: string; downloadLink: string }`
- Không cần AdminGuard — web cũng có thể dùng (search là public Unsplash API)

- [ ] **Step 1: Thêm Unsplash proxy endpoint**

Mở `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`. Thêm endpoint (không cần use-case — đây là thin proxy):

```typescript
@Get('unsplash/search')
@ApiOperation({ summary: 'Search Unsplash photos for cover images (proxy)' })
async searchUnsplash(@Query('q') q: string) {
  if (!q?.trim()) return { results: [] };
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return { results: [], error: 'UNSPLASH_ACCESS_KEY not configured' };

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
  if (!res.ok) return { results: [] };

  const data = await res.json() as { results: any[] };
  return {
    results: (data.results ?? []).map((p: any) => ({
      url: p.urls.regular as string,
      thumbUrl: p.urls.thumb as string,
      authorName: p.user.name as string,
      downloadLink: p.links.download_location as string,
    })),
  };
}
```

- [ ] **Step 2: Thêm key vào `.env.example`**

Mở `apps/api-gateway/.env.example`. Thêm:

```
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

- [ ] **Step 3: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

Test (không có key):

```bash
pnpm dev
curl "http://localhost:3000/api/unsplash/search?q=nature"
```

Expected: `{"results":[],"error":"UNSPLASH_ACCESS_KEY not configured"}`.

- [ ] **Step 4: Commit backend**

```bash
git add apps/api-gateway/src/roadmap/roadmap.rest.controller.ts \
        apps/api-gateway/.env.example
git commit -m "feat: add Unsplash photo search proxy endpoint"
```

- [ ] **Step 5: Thêm Unsplash tab vào `CoverUploadModal`**

Mở `apps/admin/src/features/lessons/components/CoverUploadModal.tsx`. Thêm state và UI:

```tsx
'use client';
import { useState } from 'react';

// Trong component (cạnh existing uploadthing state):
type Tab = 'upload' | 'unsplash';
const [tab, setTab] = useState<Tab>('upload');
const [uQuery, setUQuery] = useState('');
const [uResults, setUResults] = useState<{ url: string; thumbUrl: string; authorName: string; downloadLink: string }[]>([]);
const [uLoading, setULoading] = useState(false);

async function searchUnsplash(q: string) {
  if (!q.trim()) return;
  setULoading(true);
  try {
    const token = localStorage.getItem('admin_token') ?? '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/unsplash/search?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json() as { results: typeof uResults };
    setUResults(data.results ?? []);
  } finally { setULoading(false); }
}

async function selectPhoto(photo: typeof uResults[0]) {
  // Unsplash API requirement: trigger download
  const token = localStorage.getItem('admin_token') ?? '';
  fetch(photo.downloadLink, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  onUploaded(photo.url);
}

// Tab switcher (thêm trước existing upload UI):
<div className="flex border-b border-border mb-4">
  {(['upload', 'unsplash'] as Tab[]).map((t) => (
    <button key={t} type="button"
      onClick={() => setTab(t)}
      className={`px-4 py-2 text-xs capitalize transition-colors ${tab === t ? 'border-b-2 border-indigo text-indigo' : 'text-text-3 hover:text-text-2'}`}
    >
      {t === 'upload' ? 'Upload' : 'Unsplash'}
    </button>
  ))}
</div>

{tab === 'unsplash' && (
  <div className="space-y-3">
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Search Unsplash…"
        value={uQuery}
        onChange={(e) => setUQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') searchUnsplash(uQuery); }}
        className="flex-1 text-sm bg-bg-1 border border-border rounded-lg px-3 py-2 text-text-1 outline-none focus:border-indigo"
      />
      <button type="button" onClick={() => searchUnsplash(uQuery)} disabled={uLoading}
        className="px-3 py-2 text-xs rounded-lg bg-indigo text-white disabled:opacity-50">
        {uLoading ? '…' : 'Search'}
      </button>
    </div>
    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
      {uResults.map((p) => (
        <button key={p.url} type="button" onClick={() => selectPhoto(p)}
          className="relative aspect-video rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.thumbUrl} alt={p.authorName} className="w-full h-full object-cover" />
          <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate">
            {p.authorName}
          </span>
        </button>
      ))}
    </div>
    {!uLoading && uResults.length === 0 && uQuery && (
      <p className="text-text-3 text-xs text-center">No photos found for &ldquo;{uQuery}&rdquo;</p>
    )}
  </div>
)}

{tab === 'upload' && (/* existing upload UI */)}
```

- [ ] **Step 6: Build và test**

```bash
pnpm --filter @vizteck/admin build
pnpm dev
```

Cần `UNSPLASH_ACCESS_KEY` trong `apps/api-gateway/.env`. Vào admin lesson → hover cover → Upload → tab "Unsplash" → search "mountain" → click ảnh → cover update.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/features/lessons/components/CoverUploadModal.tsx
git commit -m "feat: add Unsplash photo picker tab to cover upload modal"
```

---

## Self-Review

**Spec coverage:**
- ✅ Gradient cover picker → Task 1
- ✅ Unsplash cover picker → Task 2
- Upload (đã có sẵn — không cần implement)
- Paste URL (đã có sẵn — không cần implement)

**Thứ tự:** Tasks 1 và 2 độc lập. Task 1 không cần backend.

**Placeholder scan:** Task 2 Step 5 — "existing upload UI" cần đọc `CoverUploadModal.tsx` thực tế để biết exact JSX structure trước khi thêm tab switcher. Không phải TBD — là instruction để đọc file trước khi edit.

**Type consistency:** `toGradientValue(css)` → lưu `"gradient:linear-gradient(...)"` → `isGradient(value)` detect → `extractGradientCss(value)` → `style.backgroundImage` — chain nhất quán.
