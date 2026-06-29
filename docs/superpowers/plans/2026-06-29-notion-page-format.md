# Notion Page Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 3 page format options giống Notion: **Full-width toggle**, **Font family/size per page**, và **Word count** hiển thị trong editor.

**Architecture:** Full-width và Word count là pure frontend (localStorage + derive từ editor state). Font preferences cần Prisma field + REST API + `LessonPageShell` props.

**Tech Stack:** React `useState`/`useEffect`/`localStorage`, BlockNote `editor.document`, Prisma schema migration, NestJS REST.

## Global Constraints

- Tailwind semantic tokens — `font-sans`, `font-serif`, `font-mono` (Tailwind built-in, không cần hex).
- `packages/core` không import từ `apps/*`.
- Dark mode via `.dark` class.
- Sau Prisma schema change: `pnpm --filter @vizteck/db db:migrate`.
- Build verify: `pnpm --filter @vizteck/core build`.
- Conventional Commits.

---

## Codebase Context

- `LessonPageShell.tsx` tại `packages/core/src/lesson/ui/LessonPageShell.tsx:49` — content wrapper hiện dùng `max-w-[860px] mx-auto`.
- `LessonEditor.tsx` tại `packages/core/src/lesson/ui/LessonEditor.tsx:97` — status bar ở dòng 74-90.
- `LessonPageShellProps` tại file trên — hiện có `mode, node, breadcrumb, coverSlot, titleSlot, contentSlot, getLinkHref`.
- Admin lesson page: `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`.

---

## Task 1: Full-Width Mode Toggle

**Files:**
- Modify: `packages/core/src/lesson/ui/LessonPageShell.tsx`

**Interfaces:**
- Không thay đổi `LessonPageShellProps` — state internal, persist qua localStorage.
- Produces: toggle button trong shell header, `vizteck:full-width` localStorage key.

- [ ] **Step 1: Đọc `LessonPageShell.tsx` để xác định content wrapper class**

Tìm `max-w-[860px]` trong file — đây là container cần toggle.

- [ ] **Step 2: Thêm full-width state và button**

Mở `packages/core/src/lesson/ui/LessonPageShell.tsx`. Thêm state sau import:

```tsx
import { useState, useEffect } from 'react';

// Trong component body (trước return):
const [fullWidth, setFullWidth] = useState(false);
useEffect(() => {
  setFullWidth(localStorage.getItem('vizteck:full-width') === 'true');
}, []);

function toggleFullWidth() {
  setFullWidth((v) => {
    const next = !v;
    localStorage.setItem('vizteck:full-width', String(next));
    return next;
  });
}
```

Thay đổi content wrapper class:

```tsx
// Thay: className="max-w-[860px] mx-auto px-6 md:px-12 pb-12 pt-8"
// Thành:
className={`mx-auto px-6 md:px-12 pb-12 pt-8 transition-all ${fullWidth ? 'max-w-full' : 'max-w-[860px]'}`}
```

Thêm toggle button. Tìm chỗ phù hợp trong shell (sau cover, trước title) hoặc floating button:

```tsx
// Trong content section, thêm button ở góc phải:
<div className="flex justify-end mb-2">
  <button
    type="button"
    onClick={toggleFullWidth}
    title={fullWidth ? 'Narrow view' : 'Full-width view'}
    className="text-text-3 hover:text-text-1 text-sm transition-colors px-1"
    aria-label={fullWidth ? 'Switch to narrow view' : 'Switch to full-width view'}
  >
    {fullWidth ? '⊡' : '⊞'}
  </button>
</div>
```

- [ ] **Step 3: Build và test**

```bash
pnpm --filter @vizteck/core build && pnpm dev
```

Vào lesson → click ⊞ → content mở rộng. Reload → state giữ. Click ⊡ → narrow lại.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/lesson/ui/LessonPageShell.tsx
git commit -m "feat: add full-width mode toggle to lesson page"
```

---

## Task 2: Word Count trong Editor

**Files:**
- Create: `packages/core/src/lesson/ui/wordCount.ts`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`

**Interfaces:**
- Produces: `countWords(blocks: unknown[]): number` — pure function, exportable.
- Word count hiện trong status bar của `LessonEditor` cạnh save status.

- [ ] **Step 1: Tạo `wordCount.ts`**

```ts
// packages/core/src/lesson/ui/wordCount.ts
type AnyBlock = { content?: unknown; children?: AnyBlock[] };

function extractText(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return (content as { text?: string; content?: unknown }[])
      .map((c) => c.text ?? extractText(c.content))
      .join(' ');
  }
  return '';
}

export function countWords(blocks: AnyBlock[]): number {
  const texts = blocks.flatMap((b) => [
    extractText(b.content),
    ...(b.children?.map((c) => extractText(c.content)) ?? []),
  ]);
  const combined = texts.join(' ').trim();
  return combined ? combined.split(/\s+/).length : 0;
}
```

- [ ] **Step 2: Viết test**

Tạo `packages/core/src/lesson/ui/wordCount.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { countWords } from './wordCount';

describe('countWords', () => {
  it('returns 0 for empty blocks', () => {
    expect(countWords([])).toBe(0);
  });

  it('counts words in inline content', () => {
    const blocks = [{ content: [{ text: 'Hello world' }] }];
    expect(countWords(blocks)).toBe(2);
  });

  it('counts words across multiple blocks', () => {
    const blocks = [
      { content: [{ text: 'Hello world' }] },
      { content: [{ text: 'foo bar baz' }] },
    ];
    expect(countWords(blocks)).toBe(5);
  });

  it('handles blocks with no content', () => {
    const blocks = [{ content: null }, { content: [] }];
    expect(countWords(blocks as any)).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @vizteck/core test -- wordCount
```

Expected: 4 tests PASS.

- [ ] **Step 4: Thêm word count vào `LessonEditor` status bar**

Mở `packages/core/src/lesson/ui/LessonEditor.tsx`. Import và thêm vào status bar:

```tsx
import { countWords } from './wordCount';

// Trong component, derive word count từ editor state:
// editor.document trả về Block[] — cast as any[] để pass vào countWords
// Cần listen vào editor changes — dùng onEditorContentChange hoặc derive từ handleChange

// Thêm state:
const [wordCount, setWordCount] = useState(0);

// Trong handleChange (đã có), thêm:
setWordCount(countWords(editor.document as any));

// Khởi tạo khi mount:
useEffect(() => {
  setWordCount(countWords(editor.document as any));
}, [editor]);

// Trong JSX status bar (dòng 74-90), thêm sau save status:
<span className="text-xs text-text-3 ml-auto">{wordCount} words</span>
```

- [ ] **Step 5: Build**

```bash
pnpm --filter @vizteck/core build
```

- [ ] **Step 6: Test thủ công**

```bash
pnpm dev
```

Vào admin lesson → gõ text → word count cập nhật real-time cạnh "Saved".

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/lesson/ui/wordCount.ts \
        packages/core/src/lesson/ui/wordCount.spec.ts \
        packages/core/src/lesson/ui/LessonEditor.tsx
git commit -m "feat: add word count to lesson editor status bar"
```

---

## Task 3: Font Family & Size Per Page

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: migration `add_node_font_preferences`
- Modify: `apps/api-gateway/src/domain/repositories/roadmap.repository.ts`
- Modify: `apps/api-gateway/src/infrastructure/database/prisma-roadmap.repository.ts`
- Create: `apps/api-gateway/src/application/use-cases/node/update-node-font.use-case.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.module.ts`
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`
- Modify: `packages/core/src/lesson/ui/LessonPageShell.tsx`
- Modify: `packages/core/src/lesson/types.ts`
- Create: `apps/admin/src/features/lessons/components/FontPreferences.tsx`

**Interfaces:**
- Produces: `PATCH /api/nodes/:id/font` body `{ fontFamily?: string; fontSize?: string }` → `{ id, fontFamily, fontSize }`
- `LessonPageShell` nhận `fontFamily?: 'default'|'serif'|'mono'` và `fontSize?: 'default'|'small'|'large'`
- `LessonShellNode` thêm `fontFamily?: string | null; fontSize?: string | null`

- [ ] **Step 1: Thêm fields vào Prisma schema**

Mở `packages/db/prisma/schema.prisma`. Thêm vào `Node`:

```prisma
model Node {
  // ... existing fields
  fontFamily  String?  @default("default")
  fontSize    String?  @default("default")
  // ...
}
```

- [ ] **Step 2: Migration**

```bash
DATABASE_URL="postgresql://vizteck:vizteck@localhost:5432/vizteckstack" \
  pnpm --filter @vizteck/db db:migrate
```

Nhập tên: `add_node_font_preferences`.

- [ ] **Step 3: Domain + repository + use-case + endpoint**

Thêm vào `IRoadmapRepository`:

```typescript
updateNodeFont(nodeId: string, fontFamily?: string, fontSize?: string): Promise<{ id: string; fontFamily: string | null; fontSize: string | null }>;
```

Implement:

```typescript
async updateNodeFont(nodeId: string, fontFamily?: string, fontSize?: string) {
  return db.node.update({
    where: { id: nodeId },
    data: {
      ...(fontFamily !== undefined && { fontFamily }),
      ...(fontSize !== undefined && { fontSize }),
    },
    select: { id: true, fontFamily: true, fontSize: true },
  });
}
```

Use-case `update-node-font.use-case.ts`:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import type { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository';

@Injectable()
export class UpdateNodeFontUseCase {
  constructor(@Inject('IRoadmapRepository') private readonly repo: IRoadmapRepository) {}
  execute(nodeId: string, fontFamily?: string, fontSize?: string) {
    return this.repo.updateNodeFont(nodeId, fontFamily, fontSize);
  }
}
```

Register trong `roadmap.module.ts`. Endpoint:

```typescript
@Patch('nodes/:id/font')
@UseGuards(AdminGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update per-page font family and size' })
@ApiParam({ name: 'id', type: String })
updateNodeFont(
  @Param('id') id: string,
  @Body('fontFamily') fontFamily?: string,
  @Body('fontSize') fontSize?: string,
) {
  return this.updateNodeFontUseCase.execute(id, fontFamily, fontSize);
}
```

- [ ] **Step 4: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

- [ ] **Step 5: Thêm `fontFamily` và `fontSize` vào `LessonShellNode` type**

Mở `packages/core/src/lesson/types.ts`. Thêm vào `LessonShellNode`:

```typescript
export interface LessonShellNode {
  id: string;
  title: string;
  coverImage: string | null;
  icon: string | null;
  content: string | null;
  type: 'LESSON' | 'ROADMAP';
  fontFamily?: string | null;   // ← thêm
  fontSize?: string | null;     // ← thêm
}
```

- [ ] **Step 6: Apply font class trong `LessonPageShell`**

Mở `packages/core/src/lesson/ui/LessonPageShell.tsx`. Thêm vào `LessonPageShellProps` và content wrapper:

```tsx
// Interface (destructure từ props):
// fontFamily và fontSize đọc từ node.fontFamily / node.fontSize

const FONT_CLASS: Record<string, string> = {
  default: 'font-sans', serif: 'font-serif', mono: 'font-mono',
};
const SIZE_CLASS: Record<string, string> = {
  default: 'text-base', small: 'text-sm', large: 'text-lg',
};

// Trong component:
const fontClass = FONT_CLASS[node.fontFamily ?? 'default'] ?? 'font-sans';
const sizeClass = SIZE_CLASS[node.fontSize ?? 'default'] ?? 'text-base';

// Content wrapper:
className={`mx-auto px-6 md:px-12 pb-12 pt-8 transition-all ${fullWidth ? 'max-w-full' : 'max-w-[860px]'} ${fontClass} ${sizeClass}`}
```

- [ ] **Step 7: Tạo `FontPreferences.tsx`**

```tsx
// apps/admin/src/features/lessons/components/FontPreferences.tsx
'use client';
import { useState } from 'react';

const FAMILIES = [
  { value: 'default', label: 'Sans' },
  { value: 'serif',   label: 'Serif' },
  { value: 'mono',    label: 'Mono' },
] as const;

const SIZES = [
  { value: 'small',   label: 'Sm' },
  { value: 'default', label: 'Md' },
  { value: 'large',   label: 'Lg' },
] as const;

interface FontPreferencesProps {
  nodeId: string;
  initialFamily: string;
  initialSize: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : ''}`,
  'Content-Type': 'application/json',
});

export function FontPreferences({ nodeId, initialFamily, initialSize }: FontPreferencesProps) {
  const [family, setFamily] = useState(initialFamily || 'default');
  const [size, setSize] = useState(initialSize || 'default');

  async function save(nextFamily: string, nextSize: string) {
    await fetch(`${API}/api/nodes/${nodeId}/font`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ fontFamily: nextFamily, fontSize: nextSize }),
    });
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <select
        value={family}
        onChange={(e) => { setFamily(e.target.value); save(e.target.value, size); }}
        className="bg-bg-1 border border-border rounded px-2 py-1 text-text-2 outline-none text-xs"
      >
        {FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <div className="flex border border-border rounded overflow-hidden">
        {SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { setSize(s.value); save(family, s.value); }}
            className={`px-2 py-1 transition-colors text-xs ${size === s.value ? 'bg-bg-2 text-text-1' : 'text-text-3 hover:text-text-2'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Mount trong admin lesson page**

Mở `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx`. Import và render cạnh `LessonActions`:

```tsx
import { FontPreferences } from '@/features/lessons/components/FontPreferences';

<FontPreferences
  nodeId={nodeId}
  initialFamily={node.fontFamily ?? 'default'}
  initialSize={node.fontSize ?? 'default'}
/>
```

Pass `fontFamily` và `fontSize` vào `LessonPageShell` qua `node` prop (sẽ có sau khi `LessonShellNode` được update và node fetch trả về đủ fields).

- [ ] **Step 9: Build toàn bộ và test**

```bash
pnpm --filter @vizteck/api-gateway build
pnpm --filter @vizteck/core build
pnpm --filter @vizteck/admin build
pnpm dev
```

Vào admin lesson → chọn "Serif" → content đổi font. Chọn "Lg" → text lớn hơn. Reload → persist.

- [ ] **Step 10: Commit**

```bash
git add packages/db/prisma/ \
        apps/api-gateway/src/ \
        packages/core/src/lesson/types.ts \
        packages/core/src/lesson/ui/LessonPageShell.tsx \
        apps/admin/src/features/lessons/components/FontPreferences.tsx \
        apps/admin/src/app/roadmaps/
git commit -m "feat: add per-page font family and size preferences"
```

---

## Self-Review

**Spec coverage:**
- ✅ Full-width toggle → Task 1
- ✅ Word count → Task 2
- ✅ Font family/size per page → Task 3

**Thứ tự:** Tasks 1 và 2 độc lập, có thể làm song song. Task 3 cần migration nên làm cuối.

**Placeholder scan:** Không có TBD. Task 1 "tìm chỗ phù hợp" — button đặt trong content section header ngay sau cover/title, trước actual content.

**Type consistency:** `node.fontFamily` và `node.fontSize` là `string | null` từ Prisma. `FONT_CLASS[key] ?? 'font-sans'` xử lý `undefined` và `null` đúng.
