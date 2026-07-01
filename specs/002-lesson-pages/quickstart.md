# Quickstart Validation Guide: Lesson Editor Enhancements

**Feature**: 002-lesson-pages
**Date**: 2026-06-30

---

## Prerequisites

```bash
docker compose up -d postgres
pnpm install
pnpm dev   # starts all apps
```

Admin panel: http://localhost:3002  
Login token: `supersecret` (ADMIN_TOKEN)

---

## Scenario 1: Block Drag-and-Drop (P1)

**Goal**: Verify drag handle xuất hiện và reorder được lưu.

1. Mở admin → chọn một Roadmap → mở một lesson node
2. Thêm ít nhất 3 blocks khác nhau (ví dụ: Heading, Paragraph, Image)
3. Hover vào block thứ 2 → kiểm tra drag handle ⠿ xuất hiện bên trái
4. Kéo block thứ 2 lên trên block thứ 1
5. Chờ 2 giây (debounce save) → status bar hiện "Saved"
6. Reload trang → blocks vẫn theo thứ tự mới

**Expected**: Thứ tự mới persist sau reload. Status "Saved" xuất hiện trong 2-3 giây.

---

## Scenario 2: TOC Block (P2a)

**Goal**: Verify TOC tự tạo và cập nhật real-time.

1. Mở một lesson trong editor
2. Thêm các blocks: `# Giới thiệu` (H1), `## Cài đặt` (H2), `### Bước 1` (H3)
3. Gõ `/toc` → chọn "Table of Contents" từ slash menu
4. Kiểm tra TOC hiển thị 3 mục với thụt lề đúng cấp bậc
5. Thêm `## Nâng cao` (H2) mới vào cuối → kiểm tra TOC cập nhật trong 1 giây
6. Xóa `### Bước 1` → kiểm tra TOC cập nhật

**Expected**: TOC reactive, thụt lề H1 > H2 > H3 đúng, anchor links click được.

---

## Scenario 3: Icon và Cover (P2b — verify existing)

**Goal**: Verify icon/cover đã hoạt động (không cần thay đổi code).

1. Mở lesson trong admin → kiểm tra vùng cover phía trên tiêu đề
2. Nhấn "Add cover" → upload ảnh hoặc dán URL
3. Nhấn icon emoji (mặc định 📄) → chọn icon mới từ picker
4. Reload → icon và cover vẫn hiển thị đúng

**Expected**: Cover và icon persist. Optimistic update (thay đổi ngay không cần chờ API).

---

## Scenario 4: Toggle Block với Drag (P1 edge case)

**Goal**: Verify kéo toggle block mang theo children.

1. Tạo toggle block với 3 items bên trong
2. Thêm một Heading block phía trên toggle
3. Kéo toggle block lên trên Heading
4. Kiểm tra cả 3 items bên trong toggle vẫn đầy đủ ở vị trí mới

**Expected**: Toggle và toàn bộ children di chuyển cùng nhau.

---

## Scenario 5: TOC khi không có Heading (edge case)

**Goal**: Verify empty state của TOC.

1. Tạo lesson mới với chỉ Paragraph blocks (không có heading)
2. Thêm TOC block

**Expected**: TOC hiển thị "Chưa có tiêu đề nào" thay vì danh sách trống hoặc crash.

---

## Build & Test Validation

```bash
# Type check
pnpm build

# Unit tests
pnpm --filter @vizteck/core test
pnpm --filter @vizteck/admin test

# Lint
pnpm lint
```
