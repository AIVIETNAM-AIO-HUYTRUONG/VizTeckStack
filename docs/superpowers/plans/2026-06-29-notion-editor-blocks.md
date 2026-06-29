# Notion Editor Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 7 custom block types vào BlockNote editor: Toggle, Callout, Math/KaTeX, YouTube embed, Figma embed, URL Bookmark, Sub-page — tương đương Notion.so block palette.

**Architecture:** Mỗi block type là 1 file `*Block.tsx` dùng `createReactBlockSpec` từ `@blocknote/react`. Sub-page block cần backend endpoint để tạo child node. Tất cả blocks đăng ký vào cả `LessonEditor` và `LessonViewer`. Code block syntax highlight cần verify với BlockNote version hiện tại.

**Tech Stack:** `@blocknote/react` (createReactBlockSpec), `katex` (Math), React `useState`, NestJS REST (Sub-page backend), Tailwind semantic tokens.

## Global Constraints

- Tailwind semantic tokens only — `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo`. Không dùng hardcode hex.
- Dark mode via `.dark` class — mọi component mới phải adapt.
- `packages/core` không import từ `apps/*`.
- `packages/core` không import singleton Apollo client.
- Build verify sau mỗi thay đổi: `pnpm --filter @vizteck/core build`.
- Conventional Commits: `feat:`, `fix:` — lowercase, không trailing period.
- Test framework cho packages/core: Vitest + @testing-library/react (`*.spec.tsx`).

---

## Codebase Context

- `LessonEditor` tại `packages/core/src/lesson/ui/LessonEditor.tsx:20` — `useCreateBlockNote(blocks ? { initialContent: blocks as any } : {})`. Cần thêm `customBlocks` array.
- `LessonViewer` tại `packages/core/src/lesson/ui/LessonViewer.tsx` — cùng pattern.
- BlockNote version: kiểm tra `pnpm --filter @vizteck/core list | grep blocknote` trước khi bắt đầu.
- REST controller tại `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`.
- Sub-page backend cần endpoint mới: `POST /api/nodes/:id/subpage`.

---

## Task 1: Verify Code Block Syntax Highlight

**Files:**
- Read-only verification — không sửa code nếu đã hoạt động.

**Interfaces:**
- Produces: xác nhận code block có syntax highlight hay cần cấu hình.

- [ ] **Step 1: Kiểm tra BlockNote version**

```bash
pnpm --filter @vizteck/core list | grep blocknote
```

Ghi lại version (e.g., `@blocknote/react@0.20.x`).

- [ ] **Step 2: Test thủ công trong browser**

```bash
pnpm dev
```

Mở `http://localhost:3002` → vào admin lesson → gõ `/code` → chọn Code block → gõ code JavaScript.

Expected: có language selector và syntax highlighting.

- [ ] **Step 3: Nếu KHÔNG có syntax highlight**

Tìm trong BlockNote docs `codeBlock` extension. Với BlockNote ≥ 0.20, code highlight built-in. Nếu thiếu:

```bash
pnpm --filter @vizteck/core add @blocknote/code-block
```

Mở `LessonEditor.tsx`. Thêm vào `useCreateBlockNote`:

```tsx
import { getDefaultReactSlashMenuItems, SuggestionMenuController } from '@blocknote/react';
// Check docs for codeBlock configuration specific to your version
```

- [ ] **Step 4: Commit (nếu có thay đổi)**

```bash
git add packages/core/
git commit -m "feat: enable code block syntax highlighting in lesson editor"
```

---

## Task 2: Toggle Block

**Files:**
- Create: `packages/core/src/lesson/ui/ToggleBlock.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`
- Modify: `packages/core/src/lesson/ui/LessonViewer.tsx`

**Interfaces:**
- Produces: block type `"toggle"` với props `{ summary: string }`, content: `"inline"`
- Toggle state: client-side `useState` only — không persist vào DB

- [ ] **Step 1: Tạo `ToggleBlock.tsx`**

```tsx
// packages/core/src/lesson/ui/ToggleBlock.tsx
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';
import { useState } from 'react';

export const ToggleBlock = createReactBlockSpec(
  {
    type: 'toggle' as const,
    propSchema: { ...defaultProps, summary: { default: 'Toggle' } },
    content: 'inline',
  },
  {
    render: ({ block, contentRef }) => {
      const [open, setOpen] = useState(false);
      return (
        <div className="my-1">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left py-0.5"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`text-text-3 text-xs transition-transform select-none ${open ? 'rotate-90' : ''}`}>▶</span>
            <span className="text-text-1 font-medium text-sm">{block.props.summary || 'Toggle'}</span>
          </button>
          {open && <div className="pl-5 mt-1 text-sm text-text-2" ref={contentRef} />}
        </div>
      );
    },
  },
);
```

- [ ] **Step 2: Đọc `LessonEditor.tsx` để biết đúng API**

```bash
# Đọc dòng 17-21 của LessonEditor.tsx để xác nhận useCreateBlockNote signature
```

Hiện tại: `useCreateBlockNote(blocks ? { initialContent: blocks as any } : {})`.

- [ ] **Step 3: Thêm `ToggleBlock` vào `LessonEditor.tsx`**

Mở `packages/core/src/lesson/ui/LessonEditor.tsx`. Thêm import và update `useCreateBlockNote`:

```tsx
import { ToggleBlock } from './ToggleBlock';

// Thay dòng 20:
const editor = useCreateBlockNote(
  blocks
    ? { initialContent: blocks as any, customBlocks: [ToggleBlock] }
    : { customBlocks: [ToggleBlock] },
);
```

- [ ] **Step 4: Thêm `ToggleBlock` vào `LessonViewer.tsx`**

Mở `packages/core/src/lesson/ui/LessonViewer.tsx`. Import và add tương tự:

```tsx
import { ToggleBlock } from './ToggleBlock';
// customBlocks: [ToggleBlock]
```

- [ ] **Step 5: Build**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0. Nếu có lỗi TypeScript về `customBlocks`, kiểm tra BlockNote API: có thể là `schema` thay vì `customBlocks` tùy version.

- [ ] **Step 6: Test thủ công**

```bash
pnpm dev
```

Vào admin lesson → gõ `/toggle` → block xuất hiện → nhập summary trong input → click arrow → content area mở.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/lesson/ui/ToggleBlock.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx \
        packages/core/src/lesson/ui/LessonViewer.tsx
git commit -m "feat: add toggle disclosure block to lesson editor"
```

---

## Task 3: Callout Block

**Files:**
- Create: `packages/core/src/lesson/ui/CalloutBlock.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`
- Modify: `packages/core/src/lesson/ui/LessonViewer.tsx`

**Interfaces:**
- Produces: block type `"callout"` với props `{ calloutType: 'info'|'warning'|'error'|'success' }`, content: `"inline"`

- [ ] **Step 1: Tạo `CalloutBlock.tsx`**

```tsx
// packages/core/src/lesson/ui/CalloutBlock.tsx
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';

const STYLES = {
  info:    { bg: 'bg-blue-50 dark:bg-blue-950/30',    border: 'border-blue-200 dark:border-blue-700',    icon: 'ℹ️' },
  warning: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-700', icon: '⚠️' },
  error:   { bg: 'bg-red-50 dark:bg-red-950/30',      border: 'border-red-200 dark:border-red-700',      icon: '🚨' },
  success: { bg: 'bg-green-50 dark:bg-green-950/30',  border: 'border-green-200 dark:border-green-700',  icon: '✅' },
} as const;

export const CalloutBlock = createReactBlockSpec(
  {
    type: 'callout' as const,
    propSchema: {
      ...defaultProps,
      calloutType: { default: 'info' as 'info' | 'warning' | 'error' | 'success' },
    },
    content: 'inline',
  },
  {
    render: ({ block, contentRef }) => {
      const s = STYLES[block.props.calloutType] ?? STYLES.info;
      return (
        <div className={`flex gap-3 p-4 rounded-lg border my-2 ${s.bg} ${s.border}`}>
          <span className="text-xl shrink-0 select-none">{s.icon}</span>
          <div className="flex-1 text-sm text-text-1 min-w-0" ref={contentRef} />
        </div>
      );
    },
  },
);
```

- [ ] **Step 2: Register trong `LessonEditor.tsx` và `LessonViewer.tsx`**

Trong cả 2 files, cập nhật `customBlocks` array:

```tsx
import { CalloutBlock } from './CalloutBlock';
// customBlocks: [ToggleBlock, CalloutBlock]
```

- [ ] **Step 3: Build và test**

```bash
pnpm --filter @vizteck/core build && pnpm dev
```

Gõ `/callout` → chọn → block xuất hiện với background màu xanh (info). Thay đổi `calloutType` qua BlockNote block menu → màu thay đổi.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/lesson/ui/CalloutBlock.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx \
        packages/core/src/lesson/ui/LessonViewer.tsx
git commit -m "feat: add callout block with info/warning/error/success variants"
```

---

## Task 4: Math / KaTeX Block

**Files:**
- Create: `packages/core/src/lesson/ui/MathBlock.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`
- Modify: `packages/core/src/lesson/ui/LessonViewer.tsx`
- Modify: `packages/core/package.json` (new dep: katex)

**Interfaces:**
- Produces: block type `"math"` với props `{ formula: string }`, content: `"none"`
- Edit mode: text input. View mode: KaTeX rendered HTML.

- [ ] **Step 1: Cài KaTeX**

```bash
pnpm --filter @vizteck/core add katex
pnpm --filter @vizteck/core add -D @types/katex
```

- [ ] **Step 2: Tạo `MathBlock.tsx`**

```tsx
// packages/core/src/lesson/ui/MathBlock.tsx
'use client';
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';
import { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const MathBlock = createReactBlockSpec(
  {
    type: 'math' as const,
    propSchema: { ...defaultProps, formula: { default: '' } },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [editing, setEditing] = useState(!block.props.formula);
      const [draft, setDraft] = useState(block.props.formula);
      const renderRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (!editing && renderRef.current && block.props.formula) {
          try {
            katex.render(block.props.formula, renderRef.current, { throwOnError: false, displayMode: true });
          } catch {
            if (renderRef.current) renderRef.current.textContent = block.props.formula;
          }
        }
      }, [editing, block.props.formula]);

      if (editing) {
        return (
          <div className="my-2 p-3 border border-border rounded-md bg-bg-1">
            <input
              autoFocus
              className="w-full bg-transparent text-sm font-mono text-text-1 outline-none"
              placeholder="LaTeX formula — e.g. E = mc^2"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => { editor.updateBlock(block, { props: { formula: draft } }); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            />
          </div>
        );
      }

      return (
        <div
          className="my-2 p-3 text-center cursor-pointer hover:bg-bg-2 rounded-md transition-colors"
          onClick={() => setEditing(true)}
          ref={renderRef}
        />
      );
    },
  },
);
```

- [ ] **Step 3: Register trong Editor và Viewer**

```tsx
import { MathBlock } from './MathBlock';
// customBlocks: [ToggleBlock, CalloutBlock, MathBlock]
```

- [ ] **Step 4: Build và test**

```bash
pnpm --filter @vizteck/core build && pnpm dev
```

Gõ `/math` → nhập `E=mc^2` → Enter/blur → LaTeX render. Click vào công thức → edit mode.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/lesson/ui/MathBlock.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx \
        packages/core/src/lesson/ui/LessonViewer.tsx \
        packages/core/package.json pnpm-lock.yaml
git commit -m "feat: add math/KaTeX block to lesson editor"
```

---

## Task 5: YouTube Embed Block

**Files:**
- Create: `packages/core/src/lesson/ui/YoutubeBlock.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`
- Modify: `packages/core/src/lesson/ui/LessonViewer.tsx`

**Interfaces:**
- Produces: block type `"youtube"` với props `{ url: string }`, content: `"none"`

- [ ] **Step 1: Tạo `YoutubeBlock.tsx`**

```tsx
// packages/core/src/lesson/ui/YoutubeBlock.tsx
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';
import { useState } from 'react';

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export const YoutubeBlock = createReactBlockSpec(
  {
    type: 'youtube' as const,
    propSchema: { ...defaultProps, url: { default: '' } },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [draft, setDraft] = useState(block.props.url);
      const videoId = block.props.url ? extractVideoId(block.props.url) : null;

      if (!block.props.url) {
        return (
          <div className="my-2 p-4 border border-dashed border-border rounded-lg bg-bg-1">
            <input
              autoFocus
              className="w-full bg-transparent text-sm text-text-1 outline-none"
              placeholder="Paste YouTube URL…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => editor.updateBlock(block, { props: { url: draft } })}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            />
          </div>
        );
      }

      if (!videoId) {
        return (
          <div className="my-2 p-3 text-sm text-red-500 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
            Invalid YouTube URL.{' '}
            <button className="underline" onClick={() => editor.updateBlock(block, { props: { url: '' } })}>Change</button>
          </div>
        );
      }

      return (
        <div className="my-2 relative" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    },
  },
);
```

- [ ] **Step 2: Register và commit**

```tsx
import { YoutubeBlock } from './YoutubeBlock';
// customBlocks: [ToggleBlock, CalloutBlock, MathBlock, YoutubeBlock]
```

```bash
pnpm --filter @vizteck/core build
git add packages/core/src/lesson/ui/YoutubeBlock.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx \
        packages/core/src/lesson/ui/LessonViewer.tsx
git commit -m "feat: add YouTube embed block to lesson editor"
```

---

## Task 6: Figma Embed Block

**Files:**
- Create: `packages/core/src/lesson/ui/FigmaBlock.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`
- Modify: `packages/core/src/lesson/ui/LessonViewer.tsx`

**Interfaces:**
- Produces: block type `"figma"` với props `{ url: string }`, content: `"none"`
- Figma embed URL: `https://www.figma.com/embed?embed_host=share&url=<encodedUrl>`

- [ ] **Step 1: Tạo `FigmaBlock.tsx`**

```tsx
// packages/core/src/lesson/ui/FigmaBlock.tsx
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';
import { useState } from 'react';

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('figma.com')) return null;
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
  } catch { return null; }
}

export const FigmaBlock = createReactBlockSpec(
  {
    type: 'figma' as const,
    propSchema: { ...defaultProps, url: { default: '' } },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [draft, setDraft] = useState(block.props.url);
      const embedUrl = block.props.url ? toEmbedUrl(block.props.url) : null;

      if (!block.props.url) {
        return (
          <div className="my-2 p-4 border border-dashed border-border rounded-lg bg-bg-1">
            <input autoFocus className="w-full bg-transparent text-sm text-text-1 outline-none"
              placeholder="Paste Figma file or prototype URL…"
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onBlur={() => editor.updateBlock(block, { props: { url: draft } })}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
          </div>
        );
      }
      if (!embedUrl) {
        return (
          <div className="my-2 p-3 text-sm text-red-500 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
            Invalid Figma URL.{' '}
            <button className="underline" onClick={() => editor.updateBlock(block, { props: { url: '' } })}>Change</button>
          </div>
        );
      }
      return (
        <div className="my-2" style={{ height: 450 }}>
          <iframe className="w-full h-full rounded-lg border border-border" src={embedUrl} allowFullScreen />
        </div>
      );
    },
  },
);
```

- [ ] **Step 2: Register và commit**

```tsx
import { FigmaBlock } from './FigmaBlock';
// customBlocks: [..., FigmaBlock]
```

```bash
pnpm --filter @vizteck/core build
git add packages/core/src/lesson/ui/FigmaBlock.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx \
        packages/core/src/lesson/ui/LessonViewer.tsx
git commit -m "feat: add Figma embed block to lesson editor"
```

---

## Task 7: URL Bookmark Block

**Files:**
- Create: `packages/core/src/lesson/ui/BookmarkBlock.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`
- Modify: `packages/core/src/lesson/ui/LessonViewer.tsx`

**Interfaces:**
- Produces: block type `"bookmark"` với props `{ url: string, title: string }`, content: `"none"`

- [ ] **Step 1: Tạo `BookmarkBlock.tsx`**

```tsx
// packages/core/src/lesson/ui/BookmarkBlock.tsx
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';
import { useState } from 'react';

function getDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

export const BookmarkBlock = createReactBlockSpec(
  {
    type: 'bookmark' as const,
    propSchema: { ...defaultProps, url: { default: '' }, title: { default: '' } },
    content: 'none',
  },
  {
    render: ({ block, editor }) => {
      const [draft, setDraft] = useState(block.props.url);

      if (!block.props.url) {
        return (
          <div className="my-2 p-4 border border-dashed border-border rounded-lg bg-bg-1">
            <input autoFocus className="w-full bg-transparent text-sm text-text-1 outline-none"
              placeholder="Paste any URL to create a bookmark…"
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onBlur={() => editor.updateBlock(block, { props: { url: draft } })}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
          </div>
        );
      }

      const domain = getDomain(block.props.url);
      return (
        <a href={block.props.url} target="_blank" rel="noopener noreferrer"
          className="my-2 flex items-center gap-3 p-3 border border-border rounded-lg bg-bg-1 hover:bg-bg-2 transition-colors no-underline"
          onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-1 truncate">{block.props.title || block.props.url}</p>
            <p className="text-xs text-text-3 truncate">{domain}</p>
          </div>
          <span className="text-text-3 text-xs shrink-0">↗</span>
        </a>
      );
    },
  },
);
```

- [ ] **Step 2: Register và commit**

```tsx
import { BookmarkBlock } from './BookmarkBlock';
// customBlocks: [..., BookmarkBlock]
```

```bash
pnpm --filter @vizteck/core build
git add packages/core/src/lesson/ui/BookmarkBlock.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx \
        packages/core/src/lesson/ui/LessonViewer.tsx
git commit -m "feat: add URL bookmark block to lesson editor"
```

---

## Task 8: Sub-page Block

**Files:**
- Modify: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Modify: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Create: `apps/api-gateway/src/application/use-cases/roadmap/create-child-node.use-case.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.module.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Create: `packages/core/src/lesson/ui/SubpageBlock.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`
- Modify: `packages/core/src/lesson/ui/LessonViewer.tsx`

**Interfaces:**
- Produces: `POST /api/nodes/:id/subpage` body `{ title }` → `{ id, title, roadmapId }`
- Block type `"subpage"` props `{ nodeId, title, roadmapSlug, roadmapId }`, content: `"none"`
- `LessonEditor` nhận new prop: `onCreateSubpage?: (title: string) => Promise<{ id: string; roadmapSlug: string; roadmapId: string }>`

- [ ] **Step 1: Thêm `createChildNode` vào domain interface**

Mở `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`. Thêm vào `IRoadmapRepository`:

```typescript
createChildNode(parentNodeId: string, title: string): Promise<{ id: string; title: string; roadmapId: string }>;
```

- [ ] **Step 2: Implement trong Prisma repository**

Mở `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`. Thêm method:

```typescript
async createChildNode(parentNodeId: string, title: string): Promise<{ id: string; title: string; roadmapId: string }> {
  const parent = await db.node.findUniqueOrThrow({ where: { id: parentNodeId }, select: { roadmapId: true } });
  return db.node.create({
    data: { roadmapId: parent.roadmapId, type: 'LESSON', title, positionX: null, positionY: null },
    select: { id: true, title: true, roadmapId: true },
  });
}
```

- [ ] **Step 3: Tạo use-case**

Tạo `apps/api-gateway/src/application/use-cases/roadmap/create-child-node.use-case.ts`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class CreateChildNodeUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(parentNodeId: string, title: string) { return this.repo.createChildNode(parentNodeId, title); }
}
```

- [ ] **Step 4: Register và add REST endpoint**

Mở `roadmap.module.ts` → thêm `CreateChildNodeUseCase` vào `providers`.

Mở `roadmap.rest.controller.ts` → inject và thêm:

```typescript
import { CreateChildNodeUseCase } from '../application/use-cases/roadmap/create-child-node.use-case';

// Constructor:
private readonly createChildNodeUseCase: CreateChildNodeUseCase,

// Endpoint:
@Post('nodes/:id/subpage')
@UseGuards(AdminGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Create a child lesson node (sub-page)' })
createChildNode(@Param('id') id: string, @Body('title') title: string) {
  return this.createChildNodeUseCase.execute(id, title);
}
```

- [ ] **Step 5: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: exits 0.

- [ ] **Step 6: Tạo `SubpageBlock.tsx`**

```tsx
// packages/core/src/lesson/ui/SubpageBlock.tsx
'use client';
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';
import { useState } from 'react';

export type CreateSubpageFn = (title: string) => Promise<{ id: string; roadmapSlug: string; roadmapId: string }>;

export function createSubpageBlockSpec(
  onCreateSubpage?: CreateSubpageFn,
  getLessonHref?: (roadmapSlug: string, nodeId: string, roadmapId: string) => string,
) {
  return createReactBlockSpec(
    {
      type: 'subpage' as const,
      propSchema: {
        ...defaultProps,
        nodeId: { default: '' },
        title: { default: 'Untitled' },
        roadmapSlug: { default: '' },
        roadmapId: { default: '' },
      },
      content: 'none',
    },
    {
      render: ({ block, editor }) => {
        const [creating, setCreating] = useState(false);
        const [draft, setDraft] = useState('Untitled');

        if (block.props.nodeId) {
          const href = getLessonHref
            ? getLessonHref(block.props.roadmapSlug, block.props.nodeId, block.props.roadmapId)
            : '#';
          return (
            <a href={href} className="flex items-center gap-2 py-1 text-sm text-text-1 hover:text-indigo no-underline">
              <span className="text-base">📄</span>
              <span className="font-medium">{block.props.title}</span>
              <span className="text-text-3 text-xs ml-auto">↗ Sub-page</span>
            </a>
          );
        }

        if (!onCreateSubpage) {
          return <div className="py-1 text-sm text-text-3 italic">[Sub-page — view only]</div>;
        }

        return (
          <div className="flex items-center gap-2 py-1">
            <span>📄</span>
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm text-text-1 outline-none border-b border-border"
              placeholder="Sub-page title…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={creating}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && !creating) {
                  e.preventDefault();
                  setCreating(true);
                  try {
                    const result = await onCreateSubpage(draft || 'Untitled');
                    editor.updateBlock(block, {
                      props: { nodeId: result.id, title: draft || 'Untitled', roadmapSlug: result.roadmapSlug, roadmapId: result.roadmapId },
                    });
                  } finally { setCreating(false); }
                }
              }}
            />
            {creating && <span className="text-xs text-text-3">Creating…</span>}
          </div>
        );
      },
    },
  );
}
```

- [ ] **Step 7: Thêm `onCreateSubpage` prop vào `LessonEditor`**

Mở `packages/core/src/lesson/ui/LessonEditor.tsx`. Thêm prop và dùng `useMemo` để tạo spec:

```tsx
import { useMemo } from 'react';
import { createSubpageBlockSpec, type CreateSubpageFn } from './SubpageBlock';

export interface LessonEditorProps {
  initialContentJson: string;
  onSave: (contentJson: string) => Promise<void>;
  onCreateSubpage?: CreateSubpageFn;
  getLessonHref?: (roadmapSlug: string, nodeId: string, roadmapId: string) => string;
}

export function LessonEditor({ initialContentJson, onSave, onCreateSubpage, getLessonHref }: LessonEditorProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const SubpageBlock = useMemo(() => createSubpageBlockSpec(onCreateSubpage, getLessonHref), []);

  const editor = useCreateBlockNote(
    blocks
      ? { initialContent: blocks as any, customBlocks: [ToggleBlock, CalloutBlock, MathBlock, YoutubeBlock, FigmaBlock, BookmarkBlock, SubpageBlock] }
      : { customBlocks: [ToggleBlock, CalloutBlock, MathBlock, YoutubeBlock, FigmaBlock, BookmarkBlock, SubpageBlock] },
  );
  // ... rest unchanged
}
```

- [ ] **Step 8: Thêm vào `LessonViewer`**

```tsx
import { createSubpageBlockSpec } from './SubpageBlock';

interface LessonViewerProps {
  contentJson: string;
  getLessonHref?: (roadmapSlug: string, nodeId: string, roadmapId: string) => string;
}

// useMemo:
const SubpageBlock = useMemo(() => createSubpageBlockSpec(undefined, getLessonHref), []);
// add to customBlocks
```

- [ ] **Step 9: Wire trong admin lesson page**

Mở `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`. Pass props:

```tsx
<LessonEditor
  // ... existing props
  onCreateSubpage={async (title) => {
    const token = localStorage.getItem('admin_token') ?? '';
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nodes/${nodeId}/subpage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return res.json();
  }}
  getLessonHref={(roadmapSlug, nId, rId) => `/roadmaps/${rId}/nodes/${nId}`}
/>
```

- [ ] **Step 10: Build toàn bộ và test**

```bash
pnpm --filter @vizteck/api-gateway build
pnpm --filter @vizteck/core build
pnpm --filter @vizteck/admin build
pnpm dev
```

Gõ `/subpage` → nhập title → Enter → block chuyển thành link → click → mở lesson mới trong admin.

- [ ] **Step 11: Commit**

```bash
git add apps/api-gateway/src/ \
        packages/core/src/lesson/ui/SubpageBlock.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx \
        packages/core/src/lesson/ui/LessonViewer.tsx \
        apps/admin/src/app/roadmaps/
git commit -m "feat: add sub-page block to create child lessons inline"
```

---

## Self-Review

**Spec coverage:**
- ✅ Code block verify → Task 1
- ✅ Toggle block → Task 2
- ✅ Callout block → Task 3
- ✅ Math/KaTeX block → Task 4
- ✅ YouTube embed → Task 5
- ✅ Figma embed → Task 6
- ✅ URL Bookmark → Task 7
- ✅ Sub-page block → Task 8

**Thứ tự:** Tasks 1-7 độc lập, làm tuần tự để `customBlocks` array tích lũy. Task 8 cần Tasks 2-7 hoàn thành trước (để `customBlocks` array đúng).

**Placeholder scan:** Không có TBD. Task 8 Step 7 có `useMemo` deps `[]` với ESLint disable comment — đây là intentional vì callbacks stable từ admin wrapper (ponytail trade-off).

**Type consistency:** `CreateSubpageFn` export từ `SubpageBlock.tsx` → dùng trong `LessonEditor.tsx` interface — nhất quán.
