# Contract: TOC Custom Block

**Type**: BlockNote Custom Block Definition
**Package**: `packages/core`

---

## Block Definition

```typescript
// packages/core/src/lesson/content-editor/blocks/TocBlock.tsx

BlockType: "toc"
Props: {}          // không có config props
Content: "none"    // không có inline content
Children: "none"   // không có children blocks
```

## Render Contract

### Edit mode (trong LessonEditor)
```
[Mục lục]
• Heading 1 text        ← level H1, không thụt lề
  • Heading 2 text      ← level H2, thụt lề 1 cấp
    • Heading 3 text    ← level H3, thụt lề 2 cấp
[Chưa có tiêu đề nào]  ← hiển thị khi không có heading nào
```

- Click vào mục → scroll đến heading tương ứng
- TOC tự cập nhật real-time khi editor thay đổi
- Readonly UI (không editable bên trong TOC block)

### View mode (trong LessonViewer)
- Cùng render như edit mode, không có gì thay đổi

## Data Flow

```
editor.document (BlockNote)
  └─ filter(block.type === 'heading')
  └─ map({ label, anchor: block.id, level })
  └─ render list với anchor href="#${block.id}"
```

## Integration Points

- **Đăng ký block**: Pass vào `customBlocks` array của `useCreateBlockNote`
- **Slash command**: `/toc` hoặc `/mục lục` → insert TocBlock
- **Toolbar**: Không cần thêm vào formatting toolbar

## Constraints

- TOC chỉ liệt kê headings trong **cùng một lesson** — không traverse sang node/lesson khác
- Anchor scroll hoạt động trong view mode nhờ `block.id` được BlockNote render làm `data-id` attribute
- Nếu không có heading: hiển thị placeholder, không crash
