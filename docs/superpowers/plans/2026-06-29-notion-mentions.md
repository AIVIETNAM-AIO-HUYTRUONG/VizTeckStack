# Notion Mentions (@mentions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm `@mention` cho lesson pages trong BlockNote editor — gõ `@` → dropdown search pages → chọn → insert inline link đến page đó.

**Architecture:** BlockNote `createReactInlineContentSpec` tạo `mention` inline content type. Trigger `@` trong editor → custom suggestion menu (BlockNote SuggestionMenu) gọi existing search API → chọn page → insert `<Mention>` inline component. Không cần model mới.

**Tech Stack:** `@blocknote/react` (`createReactInlineContentSpec`, `SuggestionMenuController`, `getDefaultReactSlashMenuItems`), existing search API `GET /api/roadmaps/search?q=`.

## Global Constraints

- Không thêm npm packages ngoài đã cài.
- Verify `@blocknote/react` version trong `packages/core/package.json` trước khi dùng API.
- Mention chỉ link đến pages trong cùng project (không mention user vì không có user system).
- Tailwind semantic tokens only.
- Conventional Commits.

---

## ⚠️ Pre-Implementation Check

**BlockNote API compatibility:** `createReactInlineContentSpec` và `SuggestionMenuController` API có thể thay đổi theo version. Đọc `node_modules/@blocknote/react/dist/types/` hoặc BlockNote docs trước khi implement.

---

## Codebase Context

- `packages/core/src/lesson/ui/LessonEditor.tsx` — `useCreateBlockNote({ initialContent, customBlocks })`. Chưa có `customInlineContentSpecs`.
- Search API: `GET /api/roadmaps/search?q=<query>` — đã có trong `roadmap.rest.controller.ts`.
- `packages/core/package.json` — xác nhận `@blocknote/react` version.

---

## Task 1: Verify BlockNote Version và API

**Files:**
- Read: `packages/core/package.json`
- Read: `node_modules/@blocknote/react/package.json`

**Interfaces:**
- Produces: confirmation rằng `createReactInlineContentSpec` và `SuggestionMenuController` tồn tại và signature của chúng.

- [ ] **Step 1: Đọc BlockNote version**

```bash
cat packages/core/package.json | grep blocknote
```

Expected: version string như `"@blocknote/react": "^0.x.y"`.

- [ ] **Step 2: Verify API availability**

```bash
# Check createReactInlineContentSpec
grep -r "createReactInlineContentSpec" node_modules/@blocknote/react/dist/ --include="*.d.ts" | head -5

# Check SuggestionMenuController
grep -r "SuggestionMenuController" node_modules/@blocknote/react/dist/ --include="*.d.ts" | head -5
```

- [ ] **Step 3: Đọc type signatures**

```bash
# Tìm signature của createReactInlineContentSpec
grep -A 5 "createReactInlineContentSpec" node_modules/@blocknote/react/dist/types/index.d.ts
```

Expected: function với `{ type, content?, propSchema?, render }` argument.

- [ ] **Step 4: Decision point**

Nếu API tồn tại và ổn định → tiếp tục Tasks 2-3.

Nếu API không tồn tại hoặc đã deprecated → dùng fallback: custom BlockNote slash command `/mention` thay thế suggestion menu, hoặc defer sang version upgrade.

---

## Task 2: MentionSpec và MentionComponent

**Files:**
- Create: `packages/core/src/lesson/ui/MentionSpec.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`

**Interfaces:**
- `mention` inline content spec với props: `{ pageId: string; pageTitle: string; pageHref: string }`
- `MentionSpec` export từ file
- `LessonEditor` props mới: `getLessonHref?: (nodeId: string) => string` (để render clickable link trong mention)

- [ ] **Step 1: Đọc `LessonEditor.tsx` hiện tại**

Xác định: `useCreateBlockNote` call, existing `customBlocks`, props interface.

- [ ] **Step 2: Tạo `MentionSpec.tsx`**

Tạo `packages/core/src/lesson/ui/MentionSpec.tsx`:

```tsx
import { createReactInlineContentSpec } from '@blocknote/react';

export const MentionSpec = createReactInlineContentSpec(
  {
    type: 'mention' as const,
    propSchema: {
      pageId: { default: '' as string },
      pageTitle: { default: '' as string },
      pageHref: { default: '' as string },
    },
    content: 'none' as const,
  },
  {
    render: ({ inlineContent }) => (
      <a
        href={inlineContent.props.pageHref}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo/10 text-indigo text-sm hover:bg-indigo/20 transition-colors no-underline"
        onClick={(e) => { e.stopPropagation(); }}
        contentEditable={false}
      >
        📄 {inlineContent.props.pageTitle}
      </a>
    ),
  },
);
```

- [ ] **Step 3: Thêm MentionSpec vào LessonEditor**

Mở `packages/core/src/lesson/ui/LessonEditor.tsx`. Update `useCreateBlockNote`:

```tsx
import { MentionSpec } from './MentionSpec';

// Trong useCreateBlockNote call, thêm customInlineContentSpecs:
const editor = useCreateBlockNote(
  blocks ? {
    initialContent: blocks as any,
    customBlocks,
    customInlineContentSpecs: { mention: MentionSpec },
  } : {
    customBlocks,
    customInlineContentSpecs: { mention: MentionSpec },
  }
);
```

- [ ] **Step 4: Build core để check TypeScript**

```bash
pnpm --filter @vizteck/core build
```

Expected: exits 0. Nếu lỗi TypeScript về `customInlineContentSpecs` → xem BlockNote types để xác định đúng key name.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/lesson/ui/MentionSpec.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx
git commit -m "feat: add mention inline content spec to BlockNote editor"
```

---

## Task 3: @-Mention Suggestion Menu

**Files:**
- Create: `packages/core/src/lesson/ui/MentionSuggestionMenu.tsx`
- Modify: `packages/core/src/lesson/ui/LessonEditor.tsx`

**Interfaces:**
- `MentionSuggestionMenuProps`: `{ editor: BlockNoteEditor; apiUrl: string; getLessonHref: (nodeId: string) => string }`
- Trigger: `@` character in editor
- Search result type: `{ id: string; title: string; type: string }` (match search API response)

- [ ] **Step 1: Tạo `MentionSuggestionMenu.tsx`**

Tạo `packages/core/src/lesson/ui/MentionSuggestionMenu.tsx`:

```tsx
'use client';
import { SuggestionMenuController } from '@blocknote/react';
import type { BlockNoteEditor } from '@blocknote/core';
import { useState, useCallback } from 'react';

interface SearchResult { id: string; title: string; type: string }

interface MentionSuggestionMenuProps {
  editor: BlockNoteEditor;
  apiUrl: string;
  getLessonHref: (nodeId: string) => string;
}

export function MentionSuggestionMenu({ editor, apiUrl, getLessonHref }: MentionSuggestionMenuProps) {
  const getItems = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      if (!query.trim()) return [];
      const res = await fetch(`${apiUrl}/api/roadmaps/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json() as SearchResult[];
      return data.slice(0, 8);
    },
    [apiUrl],
  );

  return (
    <SuggestionMenuController
      triggerCharacter="@"
      getItems={getItems}
      onItemClick={(item: SearchResult) => {
        editor.insertInlineContent([
          {
            type: 'mention',
            props: {
              pageId: item.id,
              pageTitle: item.title,
              pageHref: getLessonHref(item.id),
            },
          },
          ' ',
        ]);
      }}
      itemRenderer={(item: SearchResult) => (
        <div className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-bg-1 text-sm text-text-1">
          <span>{item.type === 'LESSON' ? '📄' : '📁'}</span>
          <span>{item.title}</span>
        </div>
      )}
    />
  );
}
```

- [ ] **Step 2: Thêm props vào `LessonEditorProps`**

Mở `packages/core/src/lesson/ui/LessonEditor.tsx`. Thêm props:

```tsx
interface LessonEditorProps {
  // ... existing ...
  apiUrl?: string;
  getLessonHref?: (nodeId: string) => string;
}
```

- [ ] **Step 3: Render `MentionSuggestionMenu` trong `LessonEditor`**

Trong JSX của `LessonEditor`, sau `<BlockNoteView>`:

```tsx
{apiUrl && getLessonHref && (
  <MentionSuggestionMenu
    editor={editor}
    apiUrl={apiUrl}
    getLessonHref={getLessonHref}
  />
)}
```

- [ ] **Step 4: Wiring trong admin**

Mở `apps/admin/src/features/lessons/components/LessonEditor.tsx` (admin wrapper). Truyền props:

```tsx
<LessonEditorCore
  // ... existing props ...
  apiUrl={process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}
  getLessonHref={(nodeId) => `/roadmaps/${roadmapId}/lessons/${nodeId}`}
/>
```

- [ ] **Step 5: Build core và admin**

```bash
pnpm --filter @vizteck/core build
pnpm --filter @vizteck/admin build
```

Expected: cả hai exits 0.

- [ ] **Step 6: Test thủ công**

```bash
pnpm dev
```

Vào admin lesson editor → gõ `@` → dropdown xuất hiện → gõ tên page → chọn → mention link inline xuất hiện.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/lesson/ui/MentionSuggestionMenu.tsx \
        packages/core/src/lesson/ui/LessonEditor.tsx
git commit -m "feat: add @mention suggestion menu to lesson editor"
```

---

## Self-Review

**Spec coverage:**
- ✅ `@` trigger → mention suggestion menu → Task 3
- ✅ Search existing pages via API → Task 3 `getItems`
- ✅ Insert mention inline content → Task 3 `onItemClick`
- ✅ Render mention as clickable link → Task 2 `MentionSpec.render`
- ⏭ User mentions (không có user system)
- ⏭ Date mentions (`@Today`, `@Tomorrow`) — Phase sau

**Thứ tự:** Task 1 (version check) → Task 2 (spec) → Task 3 (menu). Task 1 là gate — nếu BlockNote API không available, Tasks 2-3 không thể implement theo spec này.

**Fallback nếu `SuggestionMenuController` không đúng API:** BlockNote có thể dùng `useBlockNote` hook với custom suggestion handling. Đọc BlockNote changelog cho version hiện tại.

**`apiUrl` cần truyền từ admin:** `packages/core` không import env vars của Next.js. Pattern này (truyền qua props) consistent với `ApolloLike` pattern của project.
