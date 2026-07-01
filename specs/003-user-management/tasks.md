# Tasks: User Management

**Input**: Design documents from `specs/003-user-management/`

**Branch**: `feature/003-user-management` (from `develop`)

**Auth provider**: Clerk — handles login, logout, sessions, invite emails, password management.

**Organization**: Tasks grouped by user story — each story independently testable.

**Tests**: Not requested in spec — no test tasks generated. Use `quickstart.md` for manual validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking incomplete dependencies)
- **[Story]**: Maps to user story from spec.md

## Path Conventions (VizTeckStack monorepo)

| Location | Purpose |
|----------|---------|
| `packages/db/prisma/schema.prisma` | DB schema — AuditLog only (User data in Clerk) |
| `packages/core/src/auth/` | AuthUser types + useAuth hook (wraps Clerk React hooks) |
| `packages/core/src/user-management/` | User CRUD service + hooks (ApolloLike pattern) |
| `apps/api-gateway/src/auth/` | ClerkAuthGuard, RolesGuard, me resolver |
| `apps/api-gateway/src/users/` | User CRUD GraphQL resolvers (calls Clerk API) |
| `apps/admin/src/features/auth/` | Admin auth hooks + login page |
| `apps/admin/src/features/user-management/` | Admin user management UI + useAdminUsers wrapper |

---

## Phase 1: Setup

**Purpose**: Create feature branch and install Clerk dependencies.

- [X] T001 Create and checkout branch `feature/003-user-management` from `develop` *(manual — run `git checkout develop && git checkout -b feature/003-user-management`)*
- [X] T002 Install `@clerk/backend` in `apps/api-gateway`: `pnpm add @clerk/backend --filter @vizteck/api-gateway`
- [X] T003 [P] Install `@clerk/nextjs` in `apps/admin`: `pnpm add @clerk/nextjs --filter @vizteck/admin`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema + core types — MUST complete before any user story work.

**⚠️ CRITICAL**: All user story phases depend on these tasks.

- [X] T004 Add `AuditLog` model and `AuditAction` enum to `packages/db/prisma/schema.prisma` — `actorId`/`targetId` are `String` (Clerk userId, no FK) — see `specs/003-user-management/data-model.md`
- [X] T005 Run `pnpm --filter @vizteck/db db:migrate` to apply schema — verifies migration compiles
- [X] T006 [P] Create `packages/core/src/auth/types.ts` — export `AuthUser { id: string, email: string, name: string, role: UserRole }`, `UserRole` enum (`SUPER_ADMIN | EDITOR | VIEWER`) matching Clerk `publicMetadata.role`
- [X] T007 [P] Create `packages/core/src/user-management/types.ts` — export `ClerkUser { id, email, name, role: UserRole, status: string, createdAt: string, lastSignInAt?: string }` (mapped from Clerk API response)

**Checkpoint**: `pnpm build` passes. Foundation ready.

---

## Phase 3: User Story 1 — Login / Logout (Priority: P1) 🎯 MVP

**Goal**: Thay thế `AdminGuard` static token bằng Clerk JWT. Login page dùng Clerk `<SignIn>`. Toàn bộ admin bảo vệ bởi `clerkMiddleware`.

**Independent Test**: Chạy Scenario 1 trong `quickstart.md` — login với Clerk account, verify `me` query trả về đúng role, logout.

### API Layer (api-gateway)

- [X] T008 [US1] Create `apps/api-gateway/src/auth/clerk-auth.guard.ts` — verify Clerk JWT bằng `verifyToken` from `@clerk/backend` (dùng `CLERK_SECRET_KEY`); extract `userId`, `email` từ claims, `role` từ `publicMetadata`; throw `UnauthorizedException` nếu token invalid
- [X] T009 [P] [US1] Create `apps/api-gateway/src/auth/roles.decorator.ts` — `@Roles(...roles: UserRole[])` custom decorator using `SetMetadata`
- [X] T010 [P] [US1] Create `apps/api-gateway/src/auth/roles.guard.ts` — `RolesGuard` reads `@Roles()` metadata, compares against `request.user.role`; pass nếu không có `@Roles()` decorator
- [X] T011 [US1] Create `apps/api-gateway/src/auth/auth.dto.ts` and `auth.resolver.ts` — @ObjectType AuthUserType (id, email, name, role); @Query me with `@UseGuards(ClerkAuthGuard)` — reads user từ request context — see `specs/003-user-management/contracts/auth.md`
- [X] T012 [US1] Create `apps/api-gateway/src/auth/auth.module.ts` — exports `ClerkAuthGuard`, `RolesGuard`; no JwtModule needed
- [X] T013 [US1] Update `apps/api-gateway/src/app.module.ts` — import `AuthModule`
- [X] T014 [US1] Replace `AdminGuard` with `ClerkAuthGuard` on existing resolver mutations — update `@UseGuards(AdminGuard)` → `@UseGuards(ClerkAuthGuard)` in `roadmap.resolver.ts`, `node.resolver.ts`, and `roadmap.rest.controller.ts`

### Core Layer

- [X] T015 [US1] Create `packages/core/src/auth/hooks/useAuth.ts` — wraps Clerk's `useUser()` + `useAuth()` from `@clerk/nextjs`: export `useAuth()` → `{ user: AuthUser | null, isLoading, logout }` (maps Clerk user + `publicMetadata.role` → `AuthUser`)

### Admin UI

- [X] T016 [US1] Update `apps/admin/src/app/layout.tsx` — wrap children với `<ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}`
- [X] T017 [US1] Create `apps/admin/src/features/auth/hooks/useAdminAuth.ts` — `useAdminAuth()` re-exports `useAuth()` từ `packages/core/src/auth/hooks/useAuth.ts`
- [X] T018 [US1] Create `apps/admin/src/app/login/page.tsx` — standalone page (no AdminLayout); render `<SignIn />` from `@clerk/nextjs` centered; Clerk tự redirect sau login
- [X] T019 [US1] Create `apps/admin/middleware.ts` — thay logic cũ bằng `clerkMiddleware()` from `@clerk/nextjs` (file nằm ở root của app, không phải trong src/)
- [X] T020 [US1] Add env vars to `apps/admin/.env.example` và `apps/api-gateway/.env.example` — `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

**Checkpoint US1**: Login qua Clerk → dashboard. Không session → /login. Logout xong không vào được /dashboard. Chạy Scenario 1 và 4 trong `quickstart.md`.

---

## Phase 4: User Story 2 — Quản lý User CRUD (Priority: P2)

**Goal**: SUPER_ADMIN tạo/sửa/xóa users qua Clerk API. Clerk tự gửi invite email. Danh sách users lấy từ Clerk.

**Independent Test**: Chạy Scenario 2 và 5 trong `quickstart.md` — tạo user → Clerk gửi invite → user click link → set password trên Clerk page → login thành công.

### API Layer (api-gateway)

- [X] T021 [US2] Create `apps/api-gateway/src/users/users.service.ts` — dùng `clerkClient` từ `@clerk/backend`: `list()` gọi `getUserList()`, `create(dto)` gọi `createInvitation()` với `publicMetadata: { role }`, `update(id, dto)` gọi `updateUser()` để set publicMetadata, `delete(id)` gọi `deleteUser()`, `resendInvite(id)` revoke + tạo invitation mới; ghi `AuditLog` cho mỗi mutation
- [X] T022 [US2] Create `apps/api-gateway/src/users/users.dto.ts` and `users.resolver.ts` — @ObjectType UserType; @Query users (ClerkAuthGuard + RolesGuard SUPER_ADMIN); @Mutation createUser, updateUser, deleteUser, resendInvite — see `specs/003-user-management/contracts/users.md`
- [X] T023 [US2] Create `apps/api-gateway/src/users/users.module.ts` — imports `AuthModule` (for guards); exports `UsersService`
- [X] T024 [US2] Update `apps/api-gateway/src/app.module.ts` — import `UsersModule`

### Core Layer

- [X] T025 [US2] Create `packages/core/src/user-management/user.service.ts` — `list(client: ApolloLike)`, `create(client, dto)`, `update(client, id, dto)`, `remove(client, id)`, `resendInvite(client, id)` — gọi GraphQL mutations từ `contracts/users.md`
- [X] T026 [US2] Create `packages/core/src/user-management/hooks/useUsers.ts` — `useUsers(client: ApolloLike)` hook: `{ users, isLoading, createUser, updateUser, deleteUser, resendInvite }` with optimistic updates

### Admin UI

- [X] T027 [US2] Create `apps/admin/src/features/user-management/hooks/useAdminUsers.ts` — `useAdminUsers()` → `useUsers(adminApolloClient)`
- [X] T028 [P] [US2] Create `apps/admin/src/features/user-management/components/UserList.tsx` — shadcn `Table` showing name, email, role badge, status; action buttons: Edit, Delete, Resend Invite (pending only)
- [X] T029 [P] [US2] Create `apps/admin/src/features/user-management/components/UserFormModal.tsx` — shadcn `Dialog` với email (disabled on edit), name, role `Select`; calls `createUser` hoặc `updateUser`
- [X] T030 [US2] Create `apps/admin/src/app/admin/users/page.tsx` — renders `<UserList>` với `<UserFormModal>` using `useAdminUsers()`; uses `AdminLayout`

**Checkpoint US2**: SUPER_ADMIN vào `/admin/users`, tạo user, Clerk gửi invite, user set password, đăng nhập. Chạy Scenario 2 và 5.

---

## Phase 5: User Story 3 — Phân quyền theo Role (Priority: P3)

**Goal**: EDITOR và VIEWER không vào được User Management. VIEWER không thể edit content. Role lấy từ Clerk `publicMetadata.role` trong JWT.

**Independent Test**: Chạy Scenario 3 trong `quickstart.md`.

### API Layer

- [X] T031 [US3] Add `@UseGuards(ClerkAuthGuard, RolesGuard)` + `@Roles(EDITOR, SUPER_ADMIN)` to mutations in `apps/api-gateway/src/roadmap/roadmap.resolver.ts` — createRoadmap, updateRoadmap, deleteRoadmap, upsertGraph
- [X] T032 [P] [US3] Add `@UseGuards(ClerkAuthGuard, RolesGuard)` + `@Roles(EDITOR, SUPER_ADMIN)` to mutations in `apps/api-gateway/src/roadmap/node.resolver.ts` — updateNodeContent, updateNodeTitle, updateNodeCover, updateNodeIcon

### Admin UI

- [X] T033 [US3] Update admin sidebar nav component (find in `apps/admin/src/`) — conditionally render "Users" link only khi `user.role === 'SUPER_ADMIN'`
- [X] T034 [P] [US3] Update lesson editor page in `apps/admin/src/app/` — hide edit controls (LessonEditor, title editor, cover/icon buttons) khi `user.role === 'VIEWER'`

**Checkpoint US3**: Chạy Scenario 3.

---

## Phase 6: Polish & Verification

- [X] T035 Export new types từ `packages/core/src/index.ts`: `AuthUser`, `UserRole`, `ClerkUser`
- [X] T036 Add "Users" vào sidebar navigation (update wherever nav items are defined in `apps/admin/src/`)
- [X] T037 [P] Run `pnpm lint` từ root — fix all linting errors
- [X] T038 [P] Run `pnpm build` từ root — fix all TypeScript/build errors ✓ (9/9 tasks successful)
- [ ] T039 Run all 5 scenarios in `specs/003-user-management/quickstart.md` manually
- [X] T040 Commit: `feat: add multi-user auth and role-based access control via Clerk`

---

## Phase 7: Convergence

- [X] T041 Fix `deleteRoadmap` in `apps/api-gateway/src/roadmap/roadmap.resolver.ts` — change `@Roles(EDITOR, SUPER_ADMIN)` → `@Roles(SUPER_ADMIN)` only per FR-012 (contradicts)
- [X] T042 Add SUPER_ADMIN role check to `apps/admin/src/app/admin/users/page.tsx` — redirect non-SUPER_ADMIN users away (e.g. to `/roadmaps`) so US3/AC3 is enforced client-side (partial)
- [X] T043 Wrap `createInvitation` in try/catch in `apps/api-gateway/src/users/users.service.ts` — rethrow Clerk duplicate-email error as `BadRequestException('Email đã được sử dụng')` per US2/AC5 (partial)
- [X] T044 [P] Delete dead file `apps/admin/src/hooks/useAuthGuard.ts` — no callers remain after Clerk migration (unrequested)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — BLOCKS Phase 4 and 5
- **Phase 4 (US2)**: Depends on Phase 3 (ClerkAuthGuard + RolesGuard must exist)
- **Phase 5 (US3)**: Depends on Phase 4 (role assignment phải hoạt động)
- **Phase 6 (Polish)**: Depends on all desired user stories

### Critical Path

```
T002-T003 (install @clerk/backend + @clerk/nextjs)
  → T004-T005 (DB AuditLog schema)
    → T006-T007 (core types)
      → T008-T014 (ClerkAuthGuard + me resolver + AdminGuard migration)
        → T015-T020 (useAuth hook + ClerkProvider + login page + middleware)  ← US1 complete
          → T021-T030 (user CRUD via Clerk API + admin UI)                    ← US2 complete
            → T031-T034 (role enforcement on resolvers + UI)                  ← US3 complete
```

### Parallel Opportunities within US1 (after T008)

```
Sau khi T008 (ClerkAuthGuard) xong:
  → T009: roles.decorator.ts  ┐ parallel
  → T010: roles.guard.ts      ┘

Sau khi T012 (auth.module) xong:
  → T015: core/useAuth.ts              ┐
  → T016: admin layout ClerkProvider   ┤ parallel
  → T017: admin/useAdminAuth.ts        ┘
```

---

## Implementation Strategy

### MVP First (US1 only — 20 tasks)

1. Phase 1 (T001–T003): Setup branch + Clerk deps
2. Phase 2 (T004–T007): DB schema + core types
3. Phase 3 (T008–T020): Clerk guard + login page + middleware + AdminGuard migration
4. **STOP và VALIDATE**: Scenario 1 + 4 trong quickstart.md
5. Commit: `feat: add clerk authentication and admin login page`

### Incremental Delivery

1. US1 (Clerk auth) → validate → commit
2. US2 (user CRUD via Clerk API) → validate → commit
3. US3 (role enforcement) → validate → commit
4. Polish → PR

---

## Notes

- **Clerk là source of truth**: Email, password, sessions, invite emails — Clerk quản lý tất cả
- **Roles trong Clerk `publicMetadata`**: `{ "role": "SUPER_ADMIN" }` — set khi tạo user qua admin; đọc từ JWT claims trong NestJS guard
- **Không có DB User table**: AuditLog chỉ lưu `actorId String` (Clerk userId)
- **Clerk invitation flow**: `createUser` gọi `clerkClient.invitations.createInvitation()` — Clerk tự gửi email + host set-password page — không cần tạo `/set-password` page trong admin
- **`<ClerkProvider>`**: Wrap `apps/admin/src/app/layout.tsx` — Clerk handles session state toàn bộ app
- **`clerkMiddleware()`**: Thay thế toàn bộ `middleware.ts` cũ — bảo vệ routes tự động
- `AdminGuard` + `ADMIN_TOKEN` env var bị xóa hoàn toàn sau T014
- Set-password page (`/set-password`) KHÔNG cần tạo — Clerk's hosted page xử lý
- Login page `/login` chỉ render `<SignIn />` từ `@clerk/nextjs` — Clerk tự redirect sau login thành công
- `CLERK_SECRET_KEY`: cả `apps/api-gateway` (verify JWT + Clerk API) và `apps/admin` (Next.js server) đều cần
