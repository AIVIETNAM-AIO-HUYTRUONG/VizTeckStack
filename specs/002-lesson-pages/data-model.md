# Data Model: Lesson Editor Enhancements

**Feature**: 002-lesson-pages
**Date**: 2026-06-30

---

## DB Schema Changes

**Không có thay đổi DB schema** cho P1 (drag-and-drop) và P2 (icon/cover/TOC).

| Field | Table | Trạng thái |
|-------|-------|-----------|
| `Node.content` | nodes | Đã có — lưu BlockNote JSON array (bao gồm block order và TocBlock) |
| `Node.icon` | nodes | Đã có — emoji string |
| `Node.coverImage` | nodes | Đã có — URL string |

P3 (Sharing) cần schema mới nhưng defer sang `003-user-management`.

---

## BlockNote Content Schema

`Node.content` lưu mảng JSON của BlockNote blocks. Sau khi implement feature này, schema hợp lệ sẽ bao gồm:

```typescript
// BlockNote block (existing)
type Block = {
  id: string          // UUID — stable, dùng làm anchor ID cho TOC
  type: BlockType
  props: Record<string, any>
  content: InlineContent[]
  children: Block[]
}

type BlockType =
  | 'paragraph'
  | 'heading'         // props.level: 1 | 2 | 3
  | 'bulletListItem'
  | 'numberedListItem'
  | 'checkListItem'
  | 'image'
  | 'video'
  | 'file'
  | 'table'
  | 'toc'             // NEW — custom block, no props, no content

// Heading block (existing, used by TOC)
type HeadingBlock = Block & {
  type: 'heading'
  props: {
    level: 1 | 2 | 3
    textColor: string
    backgroundColor: string
    textAlignment: 'left' | 'center' | 'right' | 'justify'
  }
  content: InlineContent[]   // plain text array — dùng để render TOC label
}

// TOC block (NEW)
type TocBlock = Block & {
  type: 'toc'
  props: {}       // không có props
  content: []     // không có inline content
  children: []    // không có children
}
```

---

## TOC Block — Derived Data

TOC không lưu gì riêng. Khi render:

```
editor.document
  → filter blocks where type === 'heading'
  → map each heading to { label: heading.content[0].text, anchor: heading.id, level: heading.props.level }
  → render as <ul> with indentation per level
```

Heading anchor format: `#${block.id}` — BlockNote đã render mỗi block với `data-id={block.id}`, dùng làm scroll target.

---

## Entities không thay đổi

```
Node (hiện có)
  id: String @id
  content: Json?          ← BlockNote JSON, bao gồm thứ tự blocks sau drag-drop + TocBlock
  icon: String?           ← emoji, đã có
  coverImage: String?     ← URL, đã có
  title: String
  type: NodeType
  ...
```
