# graph-editor — Sub-feature Graph Editor (Admin)

Toàn bộ UI và hooks cho canvas kéo thả roadmap graph trong admin.

## Các file

| File | Vai trò |
|------|---------|
| `hooks/useGraphEditor.ts` | `useAdminGraphEditor(id, slug)` — inject `adminApolloClient` vào `useGraphEditor` từ core |
| `hooks/useGraphDraft.ts` | Re-export `useGraphDraft` từ `@vizteck/core` |
| `hooks/useNodeActions.ts` | Handlers tương tác canvas: drop, connect, delete — **giữ ở admin** vì dùng `useRouter` của Next.js |
| `components/GraphToolbar.tsx` | Toolbar phía trên canvas: save, status, theme toggle |
| `components/NodeInventory.tsx` | Palette bên trái: danh sách node chưa đặt lên canvas |
| `components/NodeSidePanel.tsx` | Panel bên phải: chi tiết node đang chọn |

## Tại sao useNodeActions ở đây thay vì core?

`useNodeActions` dùng `useRouter()` của Next.js và các URL patterns của admin — không thể đặt trong `packages/core` vì core không phụ thuộc vào Next.js.

## Lưu ý về drag payload

`NodeInventory` gửi 2 dạng drag data:
- Node hiện có: UUID thuần — `"clx123..."`
- Roadmap mới: `"newRoadmap:<id>:<slug>:<encodeURIComponent(title))"` — parse với `parts.slice(3).join(':')` rồi `decodeURIComponent`
