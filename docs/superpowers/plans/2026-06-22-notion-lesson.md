# Notion Lesson Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete three unfinished pieces of the lesson feature — MiniGraph real data with current-node highlight, LessonEditor debounce autosave, and Progress card UI polish.

**Architecture:** Four existing files modified; no new files, no API/DB/proto changes. The lesson Server Component fetches roadmap data in parallel and threads it down to MiniGraph. LessonEditor swaps its manual Save button for BlockNoteView's `onChange` → 2-second debounce → `onSave`. Progress card gets a styled placeholder bar.

**Tech Stack:** Next.js 15 App Router (Server Components), BlockNote (`@blocknote/react`, `@blocknote/mantine`), React 19, TypeScript strict, Vitest.

## Global Constraints

- Tailwind: always use semantic tokens (`bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `bg-indigo`) — never hardcode hex in Tailwind class names.
- TypeScript strict: no new `any` unless the existing file already uses it with no feasible alternative.
- `apps/web` fetches must use `{ cache: 'no-store' }` — do not add caching.
- `LessonEditorProps { initialContentJson, onSave }` must remain unchanged — admin consumer requires no update.
- Conventional Commits format for every commit: `feat:`, `fix:`, `chore:` — lowercase, no trailing period.

---

### Task 1: MiniGraph `currentNodeId` highlight

**Files:**
- Modify: `apps/web/src/features/lesson/components/MiniGraph.tsx`

**Interfaces:**
- Produces: `MiniGraphProps.currentNodeId?: string` — Task 2 passes `node.id` here.
- Current node renders `r={9}` with `stroke="white" strokeWidth={2}`; all others keep `r={6}` no stroke.

- [ ] **Step 1: Add `currentNodeId` to `MiniGraphProps` and function signature**

Open `apps/web/src/features/lesson/components/MiniGraph.tsx`. Find:

```tsx
interface MiniGraphProps {
  nodes: MiniGraphNode[];
  edges: MiniGraphEdge[];
  width?: number;
  height?: number;
}
```

Replace with:

```tsx
interface MiniGraphProps {
  nodes: MiniGraphNode[];
  edges: MiniGraphEdge[];
  width?: number;
  height?: number;
  currentNodeId?: string;
}
```

Find the function signature:

```tsx
export function MiniGraph({
  nodes,
  edges,
  width = 240,
  height = 120,
}: MiniGraphProps) {
```

Replace with:

```tsx
export function MiniGraph({
  nodes,
  edges,
  width = 240,
  height = 120,
  currentNodeId,
}: MiniGraphProps) {
```

- [ ] **Step 2: Add highlight logic to the circle render**

Find the circle render block (near the bottom of the file):

```tsx
      {nodes.map((n) => {
        const pos = posById.get(n.id);
        if (!pos) return null;
        const fill = n.type === 'ROADMAP' ? '#4F46E5' : '#059669';
        return (
          <circle key={n.id} cx={pos.cx} cy={pos.cy} r={6} fill={fill} />
        );
      })}
```

Replace with:

```tsx
      {nodes.map((n) => {
        const pos = posById.get(n.id);
        if (!pos) return null;
        const fill = n.type === 'ROADMAP' ? '#4F46E5' : '#059669';
        const isCurrent = n.id === currentNodeId;
        return (
          <circle
            key={n.id}
            cx={pos.cx}
            cy={pos.cy}
            r={isCurrent ? 9 : 6}
            fill={fill}
            stroke={isCurrent ? 'white' : 'none'}
            strokeWidth={isCurrent ? 2 : 0}
          />
        );
      })}
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm --filter @vizteck/web exec tsc --noEmit
```

Expected: exits 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/lesson/components/MiniGraph.tsx
git commit -m "feat: add currentNodeId highlight to MiniGraph"
```

---

### Task 2: LessonLayout — wire roadmap data to MiniGraph + polish progress card

**Files:**
- Modify: `apps/web/src/features/lesson/components/LessonLayout.tsx`

**Interfaces:**
- Consumes: `MiniGraphProps.currentNodeId` (Task 1)
- Consumes: `NodeItem` from `@/features/lesson/services/node.service` (already imported)
- Consumes: `EdgeItem` from `@/features/roadmap/services/roadmap.service` (new import)
- Produces: `LessonLayoutProps.roadmapNodes: NodeItem[]` and `LessonLayoutProps.roadmapEdges: EdgeItem[]` — Task 3 passes these from the Server Component.

- [ ] **Step 1: Import `EdgeItem` and extend `LessonLayoutProps`**

Open `apps/web/src/features/lesson/components/LessonLayout.tsx`.

Add after the existing import of `NodeItem`:

```tsx
import type { EdgeItem } from '@/features/roadmap/services/roadmap.service';
```

Find the interface:

```tsx
interface LessonLayoutProps {
  slug: string;
  node: NodeItem;
}
```

Replace with:

```tsx
interface LessonLayoutProps {
  slug: string;
  node: NodeItem;
  roadmapNodes: NodeItem[];
  roadmapEdges: EdgeItem[];
}
```

Update the function signature:

```tsx
export function LessonLayout({ slug, node, roadmapNodes, roadmapEdges }: LessonLayoutProps) {
```

- [ ] **Step 2: Map roadmap data and pass to MiniGraph**

Add these two constants at the top of the function body (before the `return`):

```tsx
  const miniNodes = roadmapNodes
    .filter((n) => n.positionX != null && n.positionY != null)
    .map((n) => ({ id: n.id, x: n.positionX, y: n.positionY, type: n.type }));

  const miniEdges = roadmapEdges.map((e) => ({
    sourceId: e.sourceId,
    targetId: e.targetId,
  }));
```

Find the existing `<MiniGraph>` call (currently `nodes={[]} edges={[]}`):

```tsx
          <MiniGraph nodes={[]} edges={[]} width={240} height={100} />
```

Replace with:

```tsx
          <MiniGraph
            nodes={miniNodes}
            edges={miniEdges}
            currentNodeId={node.id}
            width={240}
            height={100}
          />
```

- [ ] **Step 3: Replace the progress card placeholder**

Find the progress card's inner content. Currently it looks like:

```tsx
        <div className="bg-bg-1 border border-border rounded-lg p-5">
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">
            Progress
          </h3>
          <p className="text-[12px] text-text-3 mt-2">
            Progress tracking coming soon.
          </p>
        </div>
```

Replace with:

```tsx
        <div className="bg-bg-1 border border-border rounded-lg p-5">
          <h3 className="font-display font-bold text-sm text-text-1 mb-3">
            Progress
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-bg-2 rounded-full h-1.5">
              <div className="bg-indigo h-1.5 rounded-full w-0" />
            </div>
            <span className="text-[11px] text-text-3 whitespace-nowrap">0%</span>
          </div>
          <span className="inline-block mt-2 text-[11px] text-text-3 bg-bg-2 rounded-full px-2 py-0.5">
            Coming soon
          </span>
        </div>
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm --filter @vizteck/web exec tsc --noEmit
```

Expected: exits 0, no errors. (TypeScript will flag the `positionX != null` filter as always-true since the type says `number` — this is safe to ignore; the runtime value from the API can be null.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/lesson/components/LessonLayout.tsx
git commit -m "feat: wire roadmap data to MiniGraph and polish progress card"
```

---

### Task 3: Lesson page — parallel roadmap fetch

**Files:**
- Modify: `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`

**Interfaces:**
- Consumes: `LessonLayoutProps.roadmapNodes` and `.roadmapEdges` (Task 2)
- Consumes: `fetchRoadmap` from `@/features/roadmap/services/roadmap.service` (exists, not yet imported here)
- Degrades gracefully: if `fetchRoadmap` rejects, `roadmapNodes = []` and `roadmapEdges = []` — MiniGraph shows its blank SVG.

- [ ] **Step 1: Add `fetchRoadmap` import**

Open `apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx`. Add:

```tsx
import { fetchRoadmap } from '@/features/roadmap/services/roadmap.service';
```

- [ ] **Step 2: Replace the fetch block and `LessonLayout` call**

Find the current try/catch and `return <LessonLayout ...>`:

```tsx
  let node: Awaited<ReturnType<typeof fetchNode>>;
  try {
    node = await fetchNode(id);
  } catch {
    return (
      <div className="text-text-3 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  return <LessonLayout slug={slug} node={node} />;
```

Replace entirely with:

```tsx
  const [nodeResult, roadmapResult] = await Promise.allSettled([
    fetchNode(id),
    fetchRoadmap(slug),
  ]);

  if (nodeResult.status === 'rejected') {
    return (
      <div className="text-text-3 text-sm text-center py-16">
        Lesson not found.
      </div>
    );
  }

  const roadmapNodes =
    roadmapResult.status === 'fulfilled' ? roadmapResult.value.nodes : [];
  const roadmapEdges =
    roadmapResult.status === 'fulfilled' ? roadmapResult.value.edges : [];

  return (
    <LessonLayout
      slug={slug}
      node={nodeResult.value}
      roadmapNodes={roadmapNodes}
      roadmapEdges={roadmapEdges}
    />
  );
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm --filter @vizteck/web exec tsc --noEmit
```

Expected: exits 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/roadmap/[slug]/node/[id]/page.tsx
git commit -m "feat: fetch roadmap in parallel on lesson page for MiniGraph"
```

---

### Task 4: LessonEditor — replace button with debounce autosave

**Files:**
- Modify: `packages/lesson/src/LessonEditor.tsx`

**Interfaces:**
- `LessonEditorProps { initialContentJson: string; onSave: (contentJson: string) => Promise<void> }` — **unchanged**.
- Admin consumer at `apps/admin/src/app/roadmaps/[id]/nodes/[nodeId]/page.tsx` requires zero changes.

**Pattern:**
- `BlockNoteView` receives an `onChange` callback (stable via `useCallback`).
- `onChange` clears any pending debounce timer, sets a new 2000 ms timer.
- When timer fires: guard with `isSavingRef.current` (ref, not state — avoids stale closure), call `onSave`, update `saveStatus`.
- Two separate timer refs: `debounceTimerRef` (pre-save debounce) and `idleTimerRef` (post-save "Saved → idle" reset).
- `onSaveRef` keeps the latest `onSave` prop without triggering re-subscriptions.

- [ ] **Step 1: Replace the entire file**

Full replacement for `packages/lesson/src/LessonEditor.tsx`:

```tsx
"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { parseBlocks } from "./utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface LessonEditorProps {
  initialContentJson: string;
  onSave: (contentJson: string) => Promise<void>;
}

export function LessonEditor({ initialContentJson, onSave }: LessonEditorProps) {
  const blocks = parseBlocks(initialContentJson);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote(blocks ? { initialContent: blocks as any } : {});

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; });

  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const executeSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus("saving");
    try {
      await onSaveRef.current(JSON.stringify(editor.document));
      isSavingRef.current = false;
      setSaveStatus("saved");
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
        idleTimerRef.current = null;
      }, 2000);
    } catch {
      isSavingRef.current = false;
      setSaveStatus("error");
    }
  }, [editor]);

  const handleChange = useCallback(() => {
    if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void executeSave();
    }, 2000);
  }, [executeSave]);

  return (
    <div>
      <div className="flex justify-end mb-2 min-h-[28px] items-center">
        {saveStatus === "saving" && (
          <span className="text-xs text-text-3">Saving…</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-text-3">Saved</span>
        )}
        {saveStatus === "error" && (
          <button
            type="button"
            onClick={() => void executeSave()}
            className="text-xs text-red-500 hover:underline cursor-pointer"
          >
            Failed to save — click to retry
          </button>
        )}
      </div>

      <div
        className="bg-bg-1 border border-border rounded-md px-6 py-4"
        style={{ minHeight: 400 }}
      >
        <BlockNoteView editor={editor} editable={true} theme={theme} onChange={handleChange} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build `packages/lesson` to catch type errors**

```bash
pnpm --filter @vizteck/lesson exec tsc --noEmit
```

Expected: exits 0, no errors.

- [ ] **Step 3: Verify admin consumer still type-checks**

```bash
pnpm --filter @vizteck/admin exec tsc --noEmit
```

Expected: exits 0, no errors. The `LessonEditorProps` is unchanged so no impact on the admin page.

- [ ] **Step 4: Commit**

```bash
git add packages/lesson/src/LessonEditor.tsx
git commit -m "feat: replace manual save button with debounce autosave in LessonEditor"
```

---

### Task 5: Full suite verification

- [ ] **Step 1: Run full lint**

```bash
pnpm lint
```

Expected: all packages exit 0.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: all existing tests pass. The changes are additive (new props with defaults, no changed signatures).

- [ ] **Step 3: Rebuild `packages/lesson` dist**

The autosave changes are in `packages/lesson/src`. Admin imports the built dist. Rebuild to ensure the dist is current:

```bash
pnpm --filter @vizteck/lesson build
```

Expected: `packages/lesson/dist/` is updated with no errors.

- [ ] **Step 4: Commit lint/build artifacts if anything changed**

```bash
git status
```

If `packages/lesson/dist/` has changes (rebuilt dist files), stage and commit:

```bash
git add packages/lesson/dist/
git commit -m "chore: rebuild lesson package dist"
```

If nothing changed (Turborepo cache hit), skip this step.
