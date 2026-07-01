# Contract: Users GraphQL Schema

**Transport**: GraphQL (`/graphql`) — code-first via NestJS.

**Implementation**: GraphQL resolvers gọi Clerk API (`clerkClient` từ `@clerk/backend`) thay vì DB trực tiếp.

**Source files**:
- `apps/api-gateway/src/users/users.dto.ts` — @ObjectType / @InputType
- `apps/api-gateway/src/users/users.service.ts` — Clerk API calls
- `apps/api-gateway/src/users/users.resolver.ts` — GraphQL resolver

**Auth**: Tất cả operations yêu cầu `ClerkAuthGuard`. CRUD chỉ cho `SUPER_ADMIN` (RolesGuard).

---

## Types

```graphql
type User {
  id: ID!           # Clerk userId (user_2abc...)
  email: String!
  name: String!
  role: UserRole!   # from Clerk publicMetadata.role
  status: String!   # 'active' | 'pending' (no Clerk account yet) | 'banned'
  createdAt: String!
  lastSignInAt: String
}
```

---

## Queries

### `users` — danh sách tất cả users

**Guard**: `ClerkAuthGuard` + `RolesGuard(SUPER_ADMIN)`

**Implementation**: `clerkClient.users.getUserList()`

```graphql
query {
  users {
    id
    email
    name
    role
    status
    createdAt
    lastSignInAt
  }
}
```

**Errors**:
- Không phải SUPER_ADMIN → `FORBIDDEN`

---

## Mutations

### `createUser` — tạo user mới và gửi invite email

**Guard**: `ClerkAuthGuard` + `RolesGuard(SUPER_ADMIN)`

**Implementation**:
1. `clerkClient.invitations.createInvitation({ emailAddress, publicMetadata: { role }, redirectUrl: '/dashboard' })` — Clerk tự gửi invite email
2. Ghi `AuditLog { actorId, targetId: invitation.id, action: CREATE }`

```graphql
mutation CreateUser($email: String!, $name: String!, $role: UserRole!) {
  createUser(email: $email, name: $name, role: $role) {
    id
    email
    name
    role
    status
  }
}
```

**Errors**:
- Email đã tồn tại → `CONFLICT` — `"Email already in use"`

---

### `updateUser` — cập nhật role của user

**Guard**: `ClerkAuthGuard` + `RolesGuard(SUPER_ADMIN)`

**Implementation**: `clerkClient.users.updateUser(id, { publicMetadata: { role } })`

```graphql
mutation UpdateUser($id: ID!, $role: UserRole!) {
  updateUser(id: $id, role: $role) {
    id
    email
    name
    role
  }
}
```

**Errors**:
- Cố hạ role của SUPER_ADMIN duy nhất → `BAD_USER_INPUT` — `"Cannot demote the only Super Admin"`

---

### `deleteUser` — xóa user

**Guard**: `ClerkAuthGuard` + `RolesGuard(SUPER_ADMIN)`

**Implementation**: `clerkClient.users.deleteUser(id)`

```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id)
}
```

**Response**: `Boolean`

**Errors**:
- Cố xóa SUPER_ADMIN duy nhất → `BAD_USER_INPUT` — `"Cannot delete the only Super Admin"`
- User không tồn tại → `NOT_FOUND`

---

### `resendInvite` — gửi lại invite email

**Guard**: `ClerkAuthGuard` + `RolesGuard(SUPER_ADMIN)`

**Implementation**: `clerkClient.invitations.revokeInvitation(id)` + `clerkClient.invitations.createInvitation({ emailAddress })`

```graphql
mutation ResendInvite($id: ID!) {
  resendInvite(id: $id)
}
```

**Response**: `Boolean`

**Errors**:
- User đã có Clerk account (không còn là pending invite) → `BAD_USER_INPUT` — `"User is already active"`

---

## Role Guard Matrix

| Role | `users` query | User mutations | Roadmap/Node mutations | Roadmap/Node queries |
|------|--------------|----------------|------------------------|---------------------|
| SUPER_ADMIN | ✅ | ✅ Full CRUD | ✅ | ✅ |
| EDITOR | `FORBIDDEN` | `FORBIDDEN` | ✅ | ✅ |
| VIEWER | `FORBIDDEN` | `FORBIDDEN` | `FORBIDDEN` | ✅ |

**Existing resolvers** (`roadmap.resolver.ts`, `node.resolver.ts`) — mutations migrate từ `AdminGuard` → `ClerkAuthGuard + RolesGuard(EDITOR+)`.
