# Data Model: User Management

**Auth provider**: Clerk — source of truth cho identity (email, password, sessions, invitations).
**DB role**: Chỉ lưu `AuditLog`. User data (email, name, role) lấy từ Clerk API hoặc JWT claims.

---

## Entities

### AuditLog

Lịch sử thao tác admin trên user accounts.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String (cuid) | PK | |
| `actorId` | String | NOT NULL | Clerk userId của người thực hiện (`user_2abc...`) |
| `targetId` | String | NOT NULL | Clerk userId của user bị tác động |
| `action` | Enum | NOT NULL | `CREATE \| UPDATE_ROLE \| DISABLE \| ENABLE \| DELETE \| RESET_INVITE` |
| `metadata` | Json | NULLABLE | Extra info (e.g., `{ oldRole: 'EDITOR', newRole: 'VIEWER' }`) |
| `createdAt` | DateTime | NOT NULL, DEFAULT now() | |

**Note**: `actorId` và `targetId` là String (Clerk userId) — không có FK đến DB User table vì không có bảng User trong DB.

---

## Enum Definitions

```
enum AuditAction {
  CREATE
  UPDATE_ROLE
  DISABLE
  ENABLE
  DELETE
  RESET_INVITE
}
```

**UserRole** không cần Prisma enum — role lưu trong Clerk `publicMetadata.role` dưới dạng string. Validate bằng TypeScript enum trong `packages/core/src/auth/types.ts`.

---

## Prisma Schema Changes

File: `packages/db/prisma/schema.prisma`

Add after existing models:

```prisma
model AuditLog {
  id        String      @id @default(cuid())
  actorId   String
  targetId  String
  action    AuditAction
  metadata  Json?
  createdAt DateTime    @default(now())
}

enum AuditAction {
  CREATE
  UPDATE_ROLE
  DISABLE
  ENABLE
  DELETE
  RESET_INVITE
}
```

**Migration required** (not `db:push`): Additive migration — safe.

---

## Clerk Data Model

User data và roles được quản lý trong Clerk:

| Clerk Field | Maps to | Notes |
|-------------|---------|-------|
| `user.id` | `actorId`/`targetId` trong AuditLog | Format: `user_2abc...` |
| `user.emailAddresses[0].emailAddress` | email | Primary email |
| `user.fullName` | name | `firstName + lastName` |
| `user.publicMetadata.role` | `UserRole` | `'SUPER_ADMIN' \| 'EDITOR' \| 'VIEWER'` |
| `user.publicMetadata.status` | `UserStatus` | `'active' \| 'disabled'` (optional, dùng Clerk's `banned` flag thay) |

**SUPER_ADMIN setup**: Tạo user trong Clerk Dashboard → set `publicMetadata: { role: 'SUPER_ADMIN' }` qua Clerk Dashboard hoặc API.
