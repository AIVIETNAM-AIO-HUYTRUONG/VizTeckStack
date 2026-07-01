# Frontend Rules

## Tailwind
- Always use semantic tokens: `bg-bg-0/1/2`, `text-text-1/2/3`, `border-border`, `text-indigo`
- Never hardcode hex colors in Tailwind classes
- Dark mode is `darkMode: 'class'` — tokens adapt automatically, no `dark:` overrides needed for colors

## React
- No nested setState: derive data before entering `setState(prev => ...)` to avoid Strict Mode double-invoke
- Optimistic updates pattern: update local state → fire API → revert on failure (see `useLessonPageShell`)
- No `useEffect` for derived state — compute it during render

## Apollo (admin only)
- Inject `adminApolloClient` via `useAdmin*` wrapper hooks — never import it directly from `packages/core`
- Core hooks accept `ApolloLike` (`{ query, mutate }`) — keeps graphql@16/17 dual-instance safe

## Components
- **shadcn/ui first**: Always use shadcn components from `@vizteck/ui` before writing custom HTML. Install new shadcn components via `pnpm dlx shadcn@latest add <component>` from `packages/ui/`. Check `packages/ui/components.json` for current config.
- Display components live in `packages/core` — not in `apps/`
- Admin-only UI (editable variants, modals) lives in `apps/admin/src/features/`
- Use slot pattern for variants: `coverSlot`, `titleSlot`, `contentSlot` props on `LessonPageShell`
