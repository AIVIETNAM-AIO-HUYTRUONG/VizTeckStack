# Notion Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm tính năng comments cho lesson pages: user có thể comment trên một page (node-level), admin có thể reply và resolve comments. Chỉ admin thấy comments panel.

**Architecture:** Prisma `Comment` model → REST CRUD endpoints → `CommentSidebar` React component trong admin. Comment scope là `nodeId` (page-level), có optional `blockId` cho block-level comments (nhưng UI phase này chỉ build page-level). Không có realtime — poll mỗi 30s hoặc manual refresh.

**Tech Stack:** Prisma, NestJS REST, React state (no WebSocket), `fetch` API.

## Global Constraints

- Page-level comments chỉ (không build inline block comments trong phase này).
- Tailwind semantic tokens only.
- No new npm packages.
- Conventional Commits.

---

## Codebase Context

- `packages/db/prisma/schema.prisma` — thêm `Comment` model.
- `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts` — thêm comment endpoints.
- Admin lesson page: `apps/admin/src/app/roadmaps/[id]/lessons/[nodeId]/page.tsx`.
- `LessonPageShell` slot pattern: `coverSlot`, `titleSlot`, `contentSlot` — Comment sidebar là NGOÀI shell, floating panel.

---

## Task 1: Prisma Comment Model

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_comment_model/`

**Interfaces:**
- Produces: `Comment` Prisma model

- [ ] **Step 1: Thêm `Comment` model vào schema**

Mở `packages/db/prisma/schema.prisma`. Thêm sau `Edge` model:

```prisma
model Comment {
  id        String   @id @default(cuid())
  nodeId    String
  blockId   String?  // null = page-level comment
  text      String
  resolved  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  node      Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@index([nodeId])
}
```

Thêm relation vào `Node` model:

```prisma
model Node {
  // ... existing fields ...
  comments   Comment[]
}
```

- [ ] **Step 2: Tạo migration**

```bash
pnpm --filter @vizteck/db db:migrate
```

Khi prompt tên migration: `add_comment_model`. Expected: migration file created, applied to DB.

- [ ] **Step 3: Verify schema**

```bash
pnpm --filter @vizteck/db db:studio
```

Prisma Studio mở → xem bảng `Comment` xuất hiện với các fields đúng. Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations/
git commit -m "feat: add Comment model to Prisma schema"
```

---

## Task 2: REST Comment Endpoints

**Files:**
- Modify: `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`

**Interfaces:**
- `GET /api/nodes/:nodeId/comments` → `Comment[]`
- `POST /api/nodes/:nodeId/comments` body: `{ text: string; blockId?: string }` → `Comment`
- `PATCH /api/comments/:id/resolve` → `Comment`
- `DELETE /api/comments/:id` (AdminGuard)

- [ ] **Step 1: Inject PrismaClient trong controller**

Xem constructor hiện tại của `RoadmapRestController`. Nếu chưa có `db: PrismaService`, inject theo pattern hiện tại của project.

- [ ] **Step 2: Thêm GET comments endpoint**

Mở `apps/api-gateway/src/roadmap/roadmap.rest.controller.ts`. Thêm:

```typescript
@Get('nodes/:nodeId/comments')
@ApiOperation({ summary: 'Get page-level comments for a node' })
async getComments(@Param('nodeId') nodeId: string) {
  return this.db.comment.findMany({
    where: { nodeId, blockId: null },
    orderBy: { createdAt: 'asc' },
  });
}
```

- [ ] **Step 3: Thêm POST comment endpoint**

```typescript
@Post('nodes/:nodeId/comments')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Add a comment to a node' })
async createComment(
  @Param('nodeId') nodeId: string,
  @Body() body: { text: string; blockId?: string },
) {
  return this.db.comment.create({
    data: { nodeId, text: body.text, blockId: body.blockId ?? null },
  });
}
```

- [ ] **Step 4: Thêm PATCH resolve và DELETE endpoints**

```typescript
@Patch('comments/:id/resolve')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Toggle resolved state of a comment' })
async resolveComment(@Param('id') id: string) {
  const comment = await this.db.comment.findUniqueOrThrow({ where: { id } });
  return this.db.comment.update({ where: { id }, data: { resolved: !comment.resolved } });
}

@Delete('comments/:id')
@UseGuards(AdminGuard)
@ApiOperation({ summary: 'Delete a comment' })
async deleteComment(@Param('id') id: string) {
  await this.db.comment.delete({ where: { id } });
  return { deleted: true };
}
```

- [ ] **Step 5: Build api-gateway**

```bash
pnpm --filter @vizteck/api-gateway build
```

Expected: exits 0.

- [ ] **Step 6: Test thủ công với curl**

```bash
pnpm dev
# Lấy nodeId từ DB hoặc admin UI
curl -X POST http://localhost:3000/api/nodes/<nodeId>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer supersecret" \
  -d '{"text":"Test comment"}'
# Expected: {"id":"...","nodeId":"...","text":"Test comment","resolved":false,...}

curl http://localhost:3000/api/nodes/<nodeId>/comments
# Expected: [{"id":"...","text":"Test comment",...}]
```

- [ ] **Step 7: Commit**

```bash
git add apps/api-gateway/src/roadmap/roadmap.rest.controller.ts
git commit -m "feat: add comment CRUD REST endpoints"
```

---

## Task 3: CommentSidebar UI (Admin only)

**Files:**
- Create: `apps/admin/src/features/lessons/components/CommentSidebar.tsx`
- Modify: `apps/admin/src/app/roadmaps/[id]/lessons/[nodeId]/page.tsx`

**Interfaces:**
- `CommentSidebarProps`: `{ nodeId: string; open: boolean; onClose: () => void }`
- Comment type (local): `{ id: string; text: string; resolved: boolean; createdAt: string }`

- [ ] **Step 1: Tạo `CommentSidebar.tsx`**

Tạo `apps/admin/src/features/lessons/components/CommentSidebar.tsx`:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';

interface Comment {
  id: string;
  text: string;
  resolved: boolean;
  createdAt: string;
}

interface CommentSidebarProps {
  nodeId: string;
  open: boolean;
  onClose: () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken() { return localStorage.getItem('admin_token') ?? ''; }

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...init?.headers },
  });
}

export function CommentSidebar({ nodeId, open, onClose }: CommentSidebarProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    apiFetch(`/api/nodes/${nodeId}/comments`).then(r => r.json()).then(setComments);
  }, [open, nodeId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await apiFetch(`/api/nodes/${nodeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    const newComment = await res.json() as Comment;
    setComments(prev => [...prev, newComment]);
    setText('');
  }

  async function toggleResolve(id: string) {
    const res = await apiFetch(`/api/comments/${id}/resolve`, { method: 'PATCH' });
    const updated = await res.json() as Comment;
    setComments(prev => prev.map(c => c.id === id ? updated : c));
  }

  async function remove(id: string) {
    await apiFetch(`/api/comments/${id}`, { method: 'DELETE' });
    setComments(prev => prev.filter(c => c.id !== id));
  }

  if (!open) return null;

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-bg-0 border-l border-border flex flex-col z-40 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-1">Comments</h2>
        <button type="button" onClick={onClose} className="text-text-3 hover:text-text-1 text-lg">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 && (
          <p className="text-text-3 text-sm text-center mt-8">No comments yet.</p>
        )}
        {comments.map(c => (
          <div key={c.id} className={`rounded-xl p-3 border ${c.resolved ? 'border-border opacity-50' : 'border-border bg-bg-1'}`}>
            <p className={`text-sm text-text-1 ${c.resolved ? 'line-through' : ''}`}>{c.text}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-text-3">{new Date(c.createdAt).toLocaleDateString()}</span>
              <button
                type="button"
                onClick={() => toggleResolve(c.id)}
                className="text-[10px] text-indigo hover:underline"
              >
                {c.resolved ? 'Unresolve' : 'Resolve'}
              </button>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="text-[10px] text-red-500 hover:underline ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="border-t border-border p-4 space-y-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e as any); } }}
          rows={3}
          placeholder="Add a comment… (Enter to submit)"
          className="w-full text-sm bg-bg-1 border border-border rounded-lg px-3 py-2 text-text-1 resize-none outline-none focus:border-indigo"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-full text-xs py-1.5 bg-indigo text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Comment
        </button>
      </form>
    </aside>
  );
}
```

- [ ] **Step 2: Thêm CommentSidebar trigger vào lesson page**

Mở `apps/admin/src/app/roadmaps/[id]/lessons/[nodeId]/page.tsx`. Tìm toolbar hoặc header area. Thêm:

```tsx
import { CommentSidebar } from '@/features/lessons/components/CommentSidebar';

// Trong component:
const [showComments, setShowComments] = useState(false);

// Button trigger (thêm vào toolbar hoặc page header):
<button
  type="button"
  onClick={() => setShowComments(true)}
  className="text-sm text-text-3 hover:text-text-1 flex items-center gap-1.5 transition-colors"
  title="Comments"
>
  💬 Comments
</button>

// Ở cuối JSX:
<CommentSidebar
  nodeId={nodeId}
  open={showComments}
  onClose={() => setShowComments(false)}
/>
```

- [ ] **Step 3: Build và test**

```bash
pnpm --filter @vizteck/admin build
pnpm dev
```

Vào admin lesson → click "💬 Comments" → sidebar mở → gõ comment → Enter → comment xuất hiện → click Resolve → text strikethrough.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/features/lessons/components/CommentSidebar.tsx \
        apps/admin/src/app/roadmaps/\[id\]/lessons/\[nodeId\]/page.tsx
git commit -m "feat: add comment sidebar to admin lesson editor"
```

---

## Self-Review

**Spec coverage:**
- ✅ Comment model (Prisma) → Task 1
- ✅ CRUD endpoints (GET, POST, PATCH resolve, DELETE) → Task 2
- ✅ CommentSidebar UI (admin) → Task 3
- ⏭ Block-level inline comments — skip for now (blockId field in schema đã sẵn sàng khi cần)
- ⏭ Realtime — skip (poll / manual refresh đủ cho phase này)

**Thứ tự bắt buộc:** Task 1 (schema) → Task 2 (endpoints, cần schema) → Task 3 (UI, cần endpoints). Không có task nào độc lập.

**Placeholder scan:** Task 3 Step 2 — "Tìm toolbar hoặc header area" là instruction thực tế, cần đọc page.tsx trước khi edit. Không phải TBD.

**Type safety:** `Comment` type local định nghĩa trong sidebar — mirror Prisma shape, đủ để không cần shared type. Upgrade khi cần.
