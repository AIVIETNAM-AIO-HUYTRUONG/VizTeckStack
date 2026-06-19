---
status: testing
phase: 03-public-viewer
source: [03-VERIFICATION.md]
started: 2026-06-19T01:19:05.720Z
updated: 2026-06-19T01:19:05.720Z
---

## Current Test

number: 1
name: Home Page Card Rendering
expected: |
  Browser render of http://localhost:3001 with api-gateway running shows a card grid of roadmaps, no auth required, card links navigate to /roadmap/[slug]
awaiting: user response

## Tests

### 1. Home Page Card Rendering
expected: Browser shows 3-column card grid at http://localhost:3001, no login required, each card links to /roadmap/[slug]
result: [pending]

### 2. Read-Only Graph (No Drag)
expected: Navigate to /roadmap/[slug]; try to drag a node; node is locked and cannot be moved
result: [pending]

### 3. LESSON Node Click
expected: Click a LESSON node; BlockNoteView renders readable formatted text (not raw JSON) at /roadmap/[slug]/node/[id]
result: [pending]

### 4. ROADMAP Node Click
expected: Click a ROADMAP node with targetRoadmapId; navigates to /roadmap/[targetRoadmapId] (internal route only, no external redirect)
result: [pending]

### 5. next build Without api-gateway
expected: `cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3000 pnpm exec next build` exits 0 with NO api-gateway running; all 3 routes appear in output with revalidate shown
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
