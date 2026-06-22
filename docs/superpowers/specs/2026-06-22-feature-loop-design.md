# Feature Loop — Design Spec

**Date:** 2026-06-22
**Status:** Approved

---

## Overview

`/feature-loop` là một Claude Code skill orchestrator tự động hóa toàn bộ quy trình phát triển tính năng cho VizTeckStack. Developer trigger một lệnh, Claude dẫn qua 5 bước (Plan → Design → Code → Test → Ship), dừng lại ở mỗi checkpoint để nhận approve trước khi tiếp tục.

---

## Trigger

```
/feature-loop <feature-name>    # Bắt đầu loop mới
/feature-loop resume            # Tiếp tục từ bước bị ngắt
```

---

## Skill Mapping

| Bước | Mục tiêu | Skill chính | Skill phụ |
|------|-----------|-------------|-----------|
| B1: Plan | Làm rõ requirement, scope, edge cases | `brainstorming` | — |
| B2: Design | Tạo implementation plan chi tiết | `superpowers:writing-plans` | — |
| B3: Code | Build feature theo plan | `feature-dev:feature-dev` | `code-simplifier` |
| B4: Test | Unit/integration + E2E browser | `qa` | `code-review` + Playwright MCP |
| B5: Ship | Pass Husky hooks, tạo PR, CI/CD | `verify` | `superpowers:finishing-a-development-branch` |

---

## Output Artifacts

| Bước | File được tạo |
|------|--------------|
| B1 | `docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md` |
| B2 | `docs/superpowers/plans/YYYY-MM-DD-<feature>-plan.md` |
| B3 | Code commit trên branch `feature/<name>` |
| B4 | Test report trong terminal |
| B5 | Pull Request trên GitHub, CI pass |

---

## Orchestration Flow

```
/feature-loop <feature-name>
        │
        ▼
[INIT] Tạo TodoList 5 bước
       Ghi .claude/loop-state.json: { feature, step: 1, branch }
        │
        ▼
[B1] Invoke brainstorming
     → Hỏi requirement, scope, edge cases
     → Lưu design doc tại docs/superpowers/specs/
        │
        ▼
[CHECKPOINT 1] Tóm tắt kết quả B1 + "Tiếp tục B2 (Implementation Plan)?"
        │ yes
        ▼
[B2] Invoke superpowers:writing-plans
     → Tạo plan chi tiết từ design doc B1
        │
        ▼
[CHECKPOINT 2] Tóm tắt kết quả B2 + "Tiếp tục B3 (Coding)?"
        │ yes
        ▼
[B3] Invoke feature-dev:feature-dev
     → Code theo plan trên branch feature/<name>
     → Invoke code-simplifier sau khi code xong
        │
        ▼
[CHECKPOINT 3] Tóm tắt code changes + "Tiếp tục B4 (Testing)?"
        │ yes
        ▼
[B4] Invoke qa           → unit + integration tests
     Invoke code-review  → review diff
     Invoke Playwright MCP → E2E browser tests (navigate, click, screenshot, assert)
        │
        ▼
[CHECKPOINT 4] Test report đầy đủ + "Tiếp tục B5 (Ship)?"
        │ yes (chỉ khi tất cả tests pass)
        ▼
[B5] Invoke verify → chạy Husky pre-commit hooks
     Invoke superpowers:finishing-a-development-branch → tạo PR lên develop
     CI/CD tự chạy trên GitHub Actions (lint → test → build)
        │
        ▼
[DONE] Xóa .claude/loop-state.json
       Báo cáo PR URL + CI status
```

---

## Checkpoint Format

Sau mỗi bước, Claude trình bày:

```
─────────────────────────────────────
✅ B1 HOÀN THÀNH — Plan
─────────────────────────────────────
Design doc: docs/superpowers/specs/2026-06-22-<feature>-design.md

[Tóm tắt ngắn: scope đã xác định, approach được chọn, edge cases...]

→ Tiếp tục B2 (Implementation Plan)? [yes / no / chỉnh sửa]
─────────────────────────────────────
```

---

## Error Handling

| Tình huống | Xử lý |
|------------|-------|
| Sub-skill báo lỗi | Dừng, report rõ lỗi, giữ state — gõ `/feature-loop resume` sau khi fix |
| B4 tests fail | Không tự động sang B5 — liệt kê failures, đợi developer fix, chạy lại B4 |
| B5 Husky fail | Report hook nào fail + gợi ý fix, đợi approve trước khi retry |
| B5 CI fail | Link đến GitHub Actions log, không close PR — developer fix trên cùng branch |

---

## State File

`.claude/loop-state.json` (gitignored):

```json
{
  "feature": "add-lesson-export",
  "branch": "feature/add-lesson-export",
  "currentStep": 3,
  "completedSteps": [1, 2],
  "artifacts": {
    "designDoc": "docs/superpowers/specs/2026-06-22-add-lesson-export-design.md",
    "planDoc": "docs/superpowers/plans/2026-06-22-add-lesson-export-plan.md"
  },
  "startedAt": "2026-06-22T10:00:00Z"
}
```

---

## Resume

Nếu session bị ngắt giữa chừng:

```
/feature-loop resume
→ Đọc .claude/loop-state.json
→ Tiếp tục từ currentStep với đầy đủ context
```

---

## Constraints

- B5 chỉ chạy khi B4 pass hoàn toàn — không ship code chưa qua test.
- Playwright E2E yêu cầu `pnpm dev` đang chạy (tất cả apps). Claude sẽ nhắc developer nếu chưa chạy.
- Branch phải là `feature/<name>` — không chạy trực tiếp trên `develop` hoặc `main`.
- `.claude/loop-state.json` phải được thêm vào `.gitignore`.
