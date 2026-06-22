# Turbo Terminal UI (TUI) Upgrade

**Date:** 2026-06-22  
**Status:** Approved

## Goal

Enable Turborepo's built-in Terminal UI for all commands in local development, with explicit stream-mode override in CI to preserve machine-readable output.

## Context

- Turborepo **v2.9.18** is installed and supports `--ui tui` natively
- Current `turbo.json` has no `ui` setting — defaults to stream mode for all commands
- CI pipeline (`ci.yml`) runs `pnpm build`, `pnpm lint`, `pnpm test` in a GitHub Actions non-interactive environment

## Approach

**Approach 1: `turbo.json` global config + CI script override** (selected)

Set `"ui": "tui"` once at the root of `turbo.json`. Override to stream mode in CI by passing `--ui stream` via pnpm's `--` arg forwarding.

Rejected alternatives:
- **Approach 2 (script-level flags):** Verbose, easy to miss new scripts
- **Approach 3 (env var):** `TURBO_UI` is not a supported Turbo env var

## Changes

### 1. `turbo.json` — add `"ui": "tui"`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":   { "cache": false, "persistent": true },
    "test":  { "dependsOn": ["^build"] },
    "lint":  {},
    "proto:gen": {
      "inputs": ["packages/proto/**/*.proto"],
      "outputs": ["packages/proto/generated/**"],
      "cache": true
    }
  }
}
```

**Effect:** `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint` all launch TUI — split-pane view with per-service logs, real-time task status, and scrollable output per package.

### 2. `.github/workflows/ci.yml` — override to stream in CI

```yaml
- name: Build
  run: pnpm build -- --ui stream

- name: Lint
  run: pnpm lint -- --ui stream

- name: Test
  run: pnpm test -- --ui stream
```

`pnpm <script> -- <flags>` forwards flags to the underlying `turbo run <task>` call.  
GitHub Actions already sets `CI=true` which Turbo detects, but the explicit `--ui stream` documents intent and removes reliance on implicit env-var behavior.

## Scope

| File | Lines changed |
|------|--------------|
| `turbo.json` | +1 |
| `.github/workflows/ci.yml` | +3 (one per command) |

**Total: 4 lines across 2 files.**

## Developer Experience

After this change:
- `pnpm dev` — TUI shows 4 panels: `web`, `admin`, `api-gateway`, `svc-roadmap`. Navigate between them with arrow keys, scroll logs per service.
- `pnpm build` — TUI shows dependency-ordered build progress with cached task indicators.
- `pnpm test` / `pnpm lint` — TUI shows pass/fail per package inline.
- CI — unchanged output format, stream mode as before.

## Requirements

- Terminal must support TUI (Windows Terminal, iTerm2, VS Code integrated terminal — all supported). Legacy `cmd.exe` falls back gracefully.
- No new dependencies required.
