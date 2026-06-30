# Contract: Block Drag-and-Drop

**Type**: UI Behavior Contract
**Component**: `LessonEditor` trong `packages/core`

---

## Trigger

BlockNote's `SideMenu` được enable trong `useCreateBlockNote` config.

## UX Contract

```
Hover vào block
  └─ SideMenu xuất hiện bên trái block
       ├─ ⠿ drag handle (kéo để reorder)
       └─ + add block button (tùy chọn)

Kéo handle ⠿
  └─ Block highlight + ghost image
  └─ Drop indicator (đường kẻ ngang) hiển thị tại vị trí drop
  └─ Thả → block đến vị trí mới

Toggle/accordion block
  └─ Kéo block cha → children di chuyển cùng (BlockNote xử lý nội bộ)
```

## Persistence Contract

```
onDrop (BlockNote internal)
  └─ editor.document thay đổi thứ tự
  └─ editor.onChange callback fired
  └─ onSave(contentJson) called (debounce 2s)
  └─ updateLessonContent(client, nodeId, contentJson) — GraphQL mutation
  └─ Node.content updated in DB
```

**Không cần API endpoint mới.** Dùng mutation `UpdateNodeContentDocument` hiện có.

## Error Contract

- Nếu save thất bại: LessonEditor hiển thị "Failed to save — click to retry" (đã có)
- Nếu drag thả ngoài vùng hợp lệ: BlockNote revert về vị trí cũ (built-in)

## Constraints

- Drag chỉ trong cùng một lesson — không drag block sang lesson khác
- Mobile: touch drag phụ thuộc BlockNote support (không yêu cầu trong v1)
