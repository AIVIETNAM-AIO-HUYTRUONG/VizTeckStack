@../../rules/frontend.md

# Web App (Public Viewer)

- Port 3001, Next.js 15 SSG
- Shows only `Roadmap.status = PUBLIC`
- All fetches use `{ cache: 'no-store' }` — intentional, reflects admin changes immediately
- Display components imported from `@vizteck/core` — no local feature logic
- No auth, no Apollo — plain REST fetches via `src/lib/api.ts`
