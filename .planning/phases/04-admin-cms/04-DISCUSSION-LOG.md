# Phase 4: Admin CMS - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 4-Admin CMS
**Areas discussed:** Graph editor scope, Save Graph UX, Roadmap CRUD form

---

## Graph Editor Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Drag + save positions only | Reposition nodes already in DB; matches SC3 literally | |
| Add + delete nodes from canvas | Full canvas editing; needs more UI + API calls | |
| Manage nodes via separate form | Canvas = drag only; add/delete via list outside canvas | |
| Full edit except lesson content | Add/delete nodes, edit title/type; lesson text in 04-03 | ✓ |

**User's choice:** Full edit — drag + add/delete nodes + edit title/type (not lesson content).

**Notes (free-text from user):**
- Layout: canvas (top) + node inventory list (bottom)
- Right-click canvas → form panel right → create node at that position (type + title)
- "Add" in inventory → same form panel → creates unplaced node
- Drag from inventory → drop on canvas → places node
- Click node on canvas → side panel edit (title, type)
- Delete from canvas = unplace (stays in inventory)
- Delete from inventory = permanent (with warning); cascade deletes edges
- Unplaced nodes also saved to DB → requires `Node.positionX/Y` to be nullable (schema migration)

### Delete edge behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Auto-delete edges | Delete node → cascade delete all connected edges | ✓ |
| Confirm dialog if has edges | Warn before delete when node has connections | |

**Notes:** Warning is shown when deleting from inventory list. Canvas delete (unplace) has no edge issue since edges stay with placed nodes.

---

## Save Graph UX

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit Save Graph button | Batch API call on click; toast success/error | ✓ |
| Auto-save after each change | Debounced; no Save button | |

**User's choice:** Explicit Save Graph button.

### Navigate away behavior
| Option | Description | Selected |
|--------|-------------|----------|
| No warning | Admin self-responsible | |
| Unsaved changes warning | Confirm dialog + button indicator | ✓ |

**User's choice:** Warning "Unsaved changes" when navigating away.

### What Save Graph persists
| Option | Description | Selected |
|--------|-------------|----------|
| Only placed nodes | Unplaced stay local only | |
| All nodes including unplaced | DB stores unplaced; schema change needed | ✓ |

**User's choice:** Save all nodes (placed + unplaced).

---

## Roadmap CRUD Form

### Fields
| Field | Selected |
|-------|----------|
| Title (required) | ✓ |
| Slug (auto-generated) | ✓ |
| Description | |
| Cover Image URL | |

**User's choice:** Title + Slug only.

### Slug generation
| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generate from title | Admin can override; auto-fills as user types | ✓ |
| Manual input | Admin types slug manually | |

### Form placement
| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | No separate route needed | ✓ |
| Separate page /roadmaps/new | Needs new route | |
| Inline in list | Complex expand pattern | |

**User's choice:** Modal dialog for both Create and Edit.

---

## Claude's Discretion

- Admin app uses same design tokens as apps/web (indigo/emerald/fonts/bg) — not explicitly discussed but Phase 3 DEC-03-04 already locked the design system
- ThemeToggle in admin header — consistent with apps/web behavior

## Deferred Ideas

- coverImage field for roadmap CRUD — deferred, not in scope Phase 4
- Description field — deferred
- Undo/Redo in graph editor — deferred (React Flow `useUndoRedo` hook available for later)
- Bulk node operations — deferred
- Real-time collaboration — out of scope v1
