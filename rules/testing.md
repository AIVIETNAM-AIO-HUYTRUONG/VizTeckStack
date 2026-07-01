# Testing Rules

## Framework by package
| Package | Framework | File pattern |
|---------|-----------|-------------|
| `apps/admin` | Vitest + @testing-library/react | `*.spec.tsx` in `src/` |
| `packages/core` | Vitest + @testing-library/react | alongside source in `src/` |
| `packages/lesson` | shim only | no specs |
| `apps/api-gateway` | Jest + ts-jest | `*.spec.ts` in `src/` |
| `apps/e2e` | Playwright | needs all apps running |

## Commands
```bash
pnpm --filter @vizteck/admin test
pnpm --filter @vizteck/admin test -- --watch
pnpm --filter @vizteck/e2e test:e2e    # headless
pnpm --filter @vizteck/e2e test:headed # headed
```

## Rules
- E2E tests require `pnpm dev` running — they are separate from `pnpm test`
- Write specs alongside source files, not in a separate `__tests__/` folder
- Test behavior, not implementation — avoid testing internal state
