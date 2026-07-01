# Quickstart: User Management Validation

## Prerequisites

```bash
# 1. DB running
docker compose up -d postgres

# 2. Apply schema (AuditLog table)
pnpm --filter @vizteck/db db:migrate

# 3. Start all apps
pnpm dev
# admin: http://localhost:3002
# api:   http://localhost:3000
```

**Clerk setup** (one-time, trước khi test):
1. Tạo account tại [clerk.com](https://clerk.com) → tạo application mới
2. Lấy keys từ Dashboard → API Keys
3. Tạo SUPER_ADMIN user trong Clerk Dashboard → Users → Add user
4. Vào user vừa tạo → Metadata → Public metadata → set `{ "role": "SUPER_ADMIN" }`

**Required env vars**:

`apps/api-gateway/.env`:
```
DATABASE_URL=postgresql://vizteck:vizteck@localhost:5432/vizteckstack
CLERK_SECRET_KEY=sk_test_xxx
```

`apps/admin/.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

---

## Scenario 1: Login / Logout (US1 — P1)

```
1. Mở http://localhost:3002
2. Expect: redirect đến /login (Clerk SignIn component)
3. Nhập email + password của SUPER_ADMIN vừa tạo trong Clerk
4. Expect: redirect đến /dashboard, thấy tên user ở header
5. Gọi GraphQL me query với Clerk session token
6. Expect: { id, email, name, role: "SUPER_ADMIN" }
7. Bấm Logout (Clerk signOut)
8. Expect: về /login
9. Thử vào /dashboard trực tiếp
10. Expect: redirect về /login (clerkMiddleware)
```

---

## Scenario 2: Create User + Invite (US2 — P2)

```
1. Đăng nhập với SUPER_ADMIN
2. Vào /admin/users
3. Expect: thấy danh sách users từ Clerk
4. Bấm "Add User", nhập email=editor@test.com, name=Editor Test, role=EDITOR
5. Bấm Submit
6. Expect: user xuất hiện trong list với status=pending
7. Kiểm tra email editor@test.com: có invite email từ Clerk
8. Click invite link → Clerk's hosted set-password page → nhập password mới
9. Expect: đăng nhập với editor@test.com thành công
10. Verify: me query trả về role=EDITOR
```

---

## Scenario 3: Role Enforcement (US3 — P3)

```
1. Đăng nhập với editor@test.com (EDITOR)
2. Expect: không thấy menu "Users" trong sidebar
3. Thử truy cập /admin/users trực tiếp
4. Expect: redirect hoặc 403
5. Gọi GraphQL mutation createUser với EDITOR token
6. Expect: FORBIDDEN error
7. Đăng nhập lại với SUPER_ADMIN
8. Thay role editor@test.com từ EDITOR → VIEWER
9. Đăng nhập lại với editor@test.com
10. Expect: không thể edit lesson (read-only UI)
```

---

## Scenario 4: Edge Case — Cannot Delete Last Super Admin

```
1. Đăng nhập SUPER_ADMIN
2. Gọi GraphQL deleteUser với id của SUPER_ADMIN account
3. Expect: BAD_USER_INPUT "Cannot delete the only Super Admin"
4. Gọi updateUser với role=EDITOR cho SUPER_ADMIN
5. Expect: BAD_USER_INPUT "Cannot demote the only Super Admin"
```

---

## Scenario 5: Resend Invite

```
1. Đăng nhập SUPER_ADMIN
2. Tìm PENDING user trong danh sách
3. Bấm "Resend Invite"
4. Expect: true, Clerk gửi email mới
5. Thử resend với ACTIVE user (đã set password)
6. Expect: BAD_USER_INPUT "User is already active"
```

---

## GraphQL Smoke Tests

```bash
# Lấy Clerk session token từ browser DevTools → Application → Cookies → __session
TOKEN="<clerk_session_token>"

# me query
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ me { id email name role } }"}'

# users query (SUPER_ADMIN only)
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ users { id email name role status } }"}'

# createUser mutation
curl -X POST http://localhost:3000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createUser(email: \"test@test.com\", name: \"Test\", role: EDITOR) { id email status } }"}'
```

---

## Expected Outcomes per Success Criterion

| SC | Criterion | How to verify |
|----|-----------|---------------|
| SC-001 | Login < 3s | Timer từ click Submit đến /dashboard |
| SC-002 | 100% routes protected | Thử mọi admin route khi chưa đăng nhập |
| SC-003 | Tạo user < 30s | Timer từ "Add User" đến thấy user trong list |
| SC-004 | Role enforcement < 60s | Đổi role trong Clerk → thử action bị restrict |
| SC-005 | 0 last-admin deletion | Scenario 4 |
| SC-006 | Email < 2min | Check email sau khi tạo user (Clerk gửi) |
