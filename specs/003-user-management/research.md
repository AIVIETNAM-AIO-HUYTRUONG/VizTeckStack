# Research: User Management

## Auth Strategy

**Decision**: Stateless JWT (access token only, no refresh token)

**Rationale**:
- NestJS Passport.js với `passport-jwt` là chuẩn ecosystem
- Stateless = không cần session store, phù hợp scale hiện tại (< 100 users)
- No refresh token: session duration = 24h (idle timeout per spec SC), acceptable cho internal tool
- Giữ nguyên `localStorage('admin_token')` key → `apiFetch` trong admin không cần thay đổi

**Alternatives considered**:
- HttpOnly cookie session: Phức tạp hơn, cần CSRF protection, không align với Bearer pattern hiện tại
- Refresh token: Over-engineering cho < 100 internal users; thêm sau nếu cần

---

## Password Storage

**Decision**: `bcrypt` với `cost factor = 12`

**Rationale**:
- Industry standard cho password hashing trong Node.js
- Cost 12 ≈ 300ms/hash trên modern hardware: cân bằng security vs UX
- Native `@types/bcrypt` support

**Alternatives considered**:
- `argon2`: Superior algorithm nhưng thêm native build complexity; overkill cho < 100 users

---

## Email Service

**Decision**: `nodemailer` với SMTP config qua env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)

**Rationale**:
- Zero vendor lock-in; user tự chọn provider (Gmail, SendGrid, Resend, etc.)
- Lightest dependency; không cần SDK riêng của từng provider

**Alternatives considered**:
- Resend SDK: Tốt hơn về API nhưng vendor lock-in
- Mailgun: Tương tự Resend

**Note**: Nếu SMTP không được cấu hình, invite email sẽ log ra console (dev fallback). Cần document trong `.env.example`.

---

## Role Enforcement

**Decision**: NestJS custom `@Roles(...)` decorator + `RolesGuard` tại API layer; Next.js `middleware.ts` tại client layer

**Rationale**:
- API guard là primary enforcement (server-side, không thể bypass)
- Next.js middleware chỉ là UX guard (redirect sớm, tránh flash)
- 3 roles: `SUPER_ADMIN` (toàn quyền), `EDITOR` (tạo/sửa content), `VIEWER` (read-only)

**Role permission matrix**:

| Action | SUPER_ADMIN | EDITOR | VIEWER |
|--------|------------|--------|--------|
| User Management | ✅ | ❌ | ❌ |
| Create/Edit Roadmap | ✅ | ✅ | ❌ |
| Create/Edit Lesson | ✅ | ✅ | ❌ |
| Delete Roadmap | ✅ | ❌ | ❌ |
| View content (admin) | ✅ | ✅ | ✅ |

---

## AdminGuard Migration

**Decision**: Replace `apps/api-gateway/src/auth/admin.guard.ts` (static token) với `JwtAuthGuard` (Passport JWT)

**Migration strategy**:
1. Thêm `JwtAuthGuard` mới
2. Replace tất cả `@UseGuards(AdminGuard)` → `@UseGuards(JwtAuthGuard, RolesGuard)`
3. `apiFetch` trong admin giữ nguyên — JWT được store tại `localStorage('admin_token')`, Bearer header format giữ nguyên
4. `ADMIN_TOKEN` env var deprecated sau khi feature hoàn thành

**Risk**: Breaking change cho tất cả API routes. Cần implement auth endpoints trước khi replace guard.

---

## FetchFn Pattern (Core-First)

**Decision**: `packages/core` auth/user services nhận `fetchFn: (url: string, init?: RequestInit) => Promise<Response>` thay vì import `apiFetch` trực tiếp

**Rationale**: Giống `ApolloLike` pattern — tách dependency injection, cho phép apps inject client phù hợp

**Alternatives considered**:
- Import `apiFetch` trong core: Vi phạm Package Boundary (core không được import từ apps)
- GraphQL cho user management: Over-complex; user management là CRUD đơn giản, REST phù hợp hơn
