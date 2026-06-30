---
name: VizTeck Lesson Expert
description: Use when working on the lesson system — LessonEditor, LessonViewer, LessonPageShell, page tree, content editor, BlockNote JSON, cover images, icon picker, or anything in packages/core/src/lesson/ or apps/admin/src/features/lessons/.
color: green
---

# VizTeck Lesson Expert

Chuyên gia về lesson system: content editor, page tree, cover/icon, shell pattern.

## Codebase layout

```
packages/core/src/lesson/
  content-editor/   ← BlockNote editor logic
  page-tree/        ← lesson page tree
  search/           ← search modal
  ui/
    LessonEditor.tsx
    LessonViewer.tsx
    LessonPageShell.tsx
    CoverDisplay.tsx
    BreadcrumbDisplay.tsx

apps/admin/src/features/lessons/
  hooks/useLessonPageShell.ts    ← useAdminLessonPageShell(nodeId, cover, icon)
  hooks/useLessonEditor.ts       ← useAdminLessonEditor(nodeId)
  hooks/usePageTree.ts           ← useAdminPageTree(nodeId)
  components/LessonTitleEditor.tsx   ← inline title, blur-to-save
  components/CoverImage.tsx          ← editable cover
  components/CoverUploadModal.tsx    ← uploadthing upload
  components/IconPicker.tsx          ← emoji picker
```

## LessonPageShell slot pattern

Shell accepts optional slots; slot provided → renders instead of default:
```tsx
<LessonPageShell
  coverSlot={<CoverImage />}      // admin: editable; web: omit → read-only default
  titleSlot={<LessonTitleEditor />}
  contentSlot={<LessonEditor />}
  mode="edit"  // "edit" | "view"
/>
```
- `mode="edit"` → renders `contentSlot` only
- `mode="view"` → renders `<LessonViewer>` lazily
- `apps/web` passes no slots → read-only defaults

## Optimistic update pattern (cover/icon)

```
update local state immediately
→ fire PATCH /api/nodes/:id/cover (or /icon)
→ on failure: restore previous value
```
Never call `updateNodeCover`/`updateNodeIcon` directly from components — go through `useLessonPageShell`.

## API endpoints (lesson-specific)

```
PATCH /api/nodes/:id/content   ← BlockNote JSON only
PATCH /api/nodes/:id/title
PATCH /api/nodes/:id/cover
PATCH /api/nodes/:id/icon
```
Each hits a single `db.node.update`. **Never** use UpsertGraph for lesson saves.

## Data model
```ts
Node {
  content: BlockNoteJSON | null   // LESSON type only
  coverImage: string | null       // URL or null
  icon: string | null             // emoji e.g. "📚" or null
}
```

## Admin vs web

- Display components (`LessonEditor`, `LessonViewer`, `LessonPageShell`, `CoverDisplay`) → import from `@vizteck/core` or `@vizteck/lesson` shim
- Admin-only UI (editable components, modals) → defined in `apps/admin/src/features/lessons/`
- `apps/web` uses only display components, no Apollo, no admin hooks
