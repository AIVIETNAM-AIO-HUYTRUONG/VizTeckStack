@../../rules/frontend.md
@../../rules/testing.md

# Admin App

- Port 3002, Next.js 15
- `src/features/` = admin-only wrappers and UI only — all business logic in `@vizteck/core`
- Graph editor page (`roadmaps/[id]/page.tsx`) is standalone — does NOT use AdminLayout
- `apiFetch` in `src/lib/api.ts` auto-attaches `localStorage('admin_token')` and redirects on 401
- Auth token stored in `localStorage('admin_token')` — single static token, no user management
