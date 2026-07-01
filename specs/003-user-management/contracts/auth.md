# Contract: Auth

**Provider**: Clerk — handles all login, logout, session, password management, and invitation flows.

**Admin frontend**: Uses `@clerk/nextjs` (`ClerkProvider`, `<SignIn>`, `clerkMiddleware`, `useUser`, `useAuth`).

**API Gateway**: Uses `@clerk/backend` to verify Clerk JWT on every protected GraphQL operation.

---

## Clerk-handled flows (no custom code needed)

| Flow | Mechanism |
|------|-----------|
| Login | `<SignIn />` component from `@clerk/nextjs` at `/login` |
| Logout | `signOut()` from `useAuth()` Clerk hook |
| Set password (invite) | Clerk's hosted page via invitation link — no custom `/set-password` page needed |
| Password change | Clerk's user profile UI |
| Session management | Clerk's JWT + session cookies |
| Route protection | `clerkMiddleware()` in `apps/admin/src/middleware.ts` |

---

## GraphQL Schema

**Source files**:
- `apps/api-gateway/src/auth/auth.dto.ts` — @ObjectType definitions
- `apps/api-gateway/src/auth/auth.resolver.ts` — resolver

```graphql
enum UserRole {
  SUPER_ADMIN
  EDITOR
  VIEWER
}

type AuthUser {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
}
```

### `me` Query — lấy thông tin user hiện tại

**Guard**: `ClerkAuthGuard` (verify Clerk JWT từ `Authorization: Bearer <clerk_session_token>`)

```graphql
query {
  me {
    id
    email
    name
    role
  }
}
```

**Response**: `AuthUser` — data lấy từ Clerk JWT claims (`publicMetadata.role`)

**Errors**:
- Token invalid/expired → `UNAUTHENTICATED`
- No token → `UNAUTHENTICATED`

---

## NestJS Guard Implementation

`ClerkAuthGuard` trong `apps/api-gateway/src/auth/clerk-auth.guard.ts`:

```typescript
// Verify Clerk JWT using @clerk/backend
import { verifyToken } from '@clerk/backend';

const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
// payload.sub = Clerk userId
// payload.email = user email (from session claims)
// payload.publicMetadata.role = UserRole
```

---

## Environment Variables

| Var | Where | Notes |
|-----|-------|-------|
| `CLERK_SECRET_KEY` | `apps/api-gateway` | Verify JWTs + call Clerk API |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `apps/admin` | ClerkProvider (public) |
| `CLERK_SECRET_KEY` | `apps/admin` | Server-side Clerk operations |

Get từ [Clerk Dashboard](https://dashboard.clerk.com) → API Keys.
