# Feature Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `/feature-loop` Claude Code skill that orchestrates full feature development (Plan → Design → Code → Test → Ship) with checkpoint-based approval at each step.

**Architecture:** A single global skill file at `C:\Users\lh222\.claude\skills\feature-loop.md` containing complete orchestration instructions for Claude. State is persisted between steps in `.claude/loop-state.json` (project-local, gitignored). The skill invokes existing sub-skills (`brainstorming`, `superpowers:writing-plans`, `feature-dev:feature-dev`, `qa`, `code-review`, `verify`, `superpowers:finishing-a-development-branch`) at each step and pauses at every checkpoint for developer approval.

**Tech Stack:** Claude Code Skill system (markdown instruction files), JSON state file, existing VizTeckStack skills and Playwright MCP plugin.

## Global Constraints

- Skill file must be placed at `C:\Users\lh222\.claude\skills\feature-loop.md` (global — available in all projects)
- `.claude/loop-state.json` must be added to root `.gitignore`
- B5 (Ship) must never run unless B4 (Test) passed completely
- Branch naming: `feature/<name>` — kebab-case, no uppercase
- Playwright E2E requires all apps running via `pnpm dev`; skill must warn if not confirmed
- The skill file is markdown — no compilation step. Validation = manual invocation.

---

### Task 1: Add loop-state.json to .gitignore

**Files:**
- Modify: `.gitignore`

**Interfaces:**
- Produces: `.claude/loop-state.json` is untracked in all future git operations

- [ ] **Step 1: Add the entry to .gitignore**

Append to `.gitignore` (after the last line):

```
# Feature Loop state (local session tracking)
.claude/loop-state.json
```

- [ ] **Step 2: Verify it is ignored**

```bash
echo '{}' > .claude/loop-state.json
git status
```

Expected: `.claude/loop-state.json` does NOT appear in untracked files.

```bash
rm .claude/loop-state.json
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore .claude/loop-state.json for feature-loop skill"
```

---

### Task 2: Create the feature-loop skill file

**Files:**
- Create: `C:\Users\lh222\.claude\skills\feature-loop.md`

**Interfaces:**
- Produces: `/feature-loop <name>` and `/feature-loop resume` triggers available in all Claude Code sessions

- [ ] **Step 1: Create the skill file with full content**

Create `C:\Users\lh222\.claude\skills\feature-loop.md` with the following content:

````markdown
---
name: feature-loop
description: Orchestrates full feature development: B1 Plan → B2 Design → B3 Code → B4 Test → B5 Ship. Pauses at each checkpoint for developer approval before proceeding.
---

# Feature Loop Engineering

Automated feature development orchestrator for VizTeckStack. One command drives the full lifecycle — Plan → Design → Code → Test → Ship — stopping at each checkpoint so you stay in control.

## How to Use

```
/feature-loop <feature-name>    # Start a new loop (e.g. /feature-loop add-lesson-export)
/feature-loop resume            # Continue from last interrupted step
```

`<feature-name>` becomes the Git branch name: `feature/<feature-name>`. Use kebab-case only.

---

## INIT — Starting a New Loop

When invoked with a feature name (not "resume"):

1. Parse the feature name from the argument. Convert to kebab-case if needed.
2. Set `branch = "feature/<feature-name>"`.
3. Announce:
   ```
   ═══════════════════════════════════════
   🔁 FEATURE LOOP — <feature-name>
   ═══════════════════════════════════════
   Branch: feature/<feature-name>
   Steps: B1 Plan → B2 Design → B3 Code → B4 Test → B5 Ship
   ```
4. Create a TodoList with these 5 items (all pending):
   - "B1: Clarify plan (brainstorming)"
   - "B2: Create implementation plan (writing-plans)"
   - "B3: Build feature (feature-dev)"
   - "B4: Test — unit + E2E (qa + playwright)"
   - "B5: Ship — Husky + PR + CI (verify)"
5. Write `.claude/loop-state.json`:
   ```json
   {
     "feature": "<feature-name>",
     "branch": "feature/<feature-name>",
     "currentStep": 1,
     "completedSteps": [],
     "artifacts": {},
     "startedAt": "<current ISO timestamp>"
   }
   ```
6. Proceed to B1.

---

## B1: Plan — Clarify Requirements

**Mark B1 as in_progress in TodoList.**

Announce: `▶ B1: Clarifying feature requirements with brainstorming skill...`

Invoke the `brainstorming` skill. The brainstorming skill will:
- Ask clarifying questions about the feature (scope, requirements, edge cases)
- Produce a design doc saved to `docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md`

Once brainstorming completes:
1. Mark B1 as completed in TodoList.
2. Update `.claude/loop-state.json`: set `currentStep = 2`, add `1` to `completedSteps`, set `artifacts.designDoc = <path to design doc>`.
3. Show **CHECKPOINT 1**:

```
─────────────────────────────────────
✅ B1 HOÀN THÀNH — Plan
─────────────────────────────────────
Design doc: docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md

<2-3 sentence summary: what the feature does, chosen approach, key edge cases identified>

→ Tiếp tục B2 (Implementation Plan)? [yes / no / chỉnh sửa]
─────────────────────────────────────
```

Wait for user response:
- **yes** → proceed to B2
- **no** → stop, keep state
- **chỉnh sửa** → re-invoke brainstorming with feedback, then show checkpoint again

---

## B2: Design — Implementation Plan

**Mark B2 as in_progress in TodoList.**

Announce: `▶ B2: Creating implementation plan with writing-plans skill...`

Invoke the `superpowers:writing-plans` skill, passing the design doc path from `artifacts.designDoc` as context.

Once writing-plans completes:
1. Mark B2 as completed in TodoList.
2. Update `.claude/loop-state.json`: set `currentStep = 3`, add `2` to `completedSteps`, set `artifacts.planDoc = <path to plan doc>`.
3. Show **CHECKPOINT 2**:

```
─────────────────────────────────────
✅ B2 HOÀN THÀNH — Implementation Plan
─────────────────────────────────────
Plan doc: docs/superpowers/plans/YYYY-MM-DD-<feature>-plan.md

<Summary: number of tasks, key files to be created/modified, estimated scope>

→ Tiếp tục B3 (Coding)? [yes / no / chỉnh sửa]
─────────────────────────────────────
```

Wait for user response:
- **yes** → proceed to B3
- **no** → stop, keep state
- **chỉnh sửa** → re-invoke writing-plans with feedback

---

## B3: Code — Build Feature

**Mark B3 as in_progress in TodoList.**

Announce: `▶ B3: Building feature with feature-dev skill on branch feature/<feature-name>...`

First verify the correct branch is checked out:
```bash
git branch --show-current
```
If not on `feature/<feature-name>`, create/checkout it:
```bash
git checkout develop && git pull origin develop
git checkout -b feature/<feature-name>
```

Invoke the `feature-dev:feature-dev` skill, passing the plan doc from `artifacts.planDoc` as context.

After feature-dev completes, invoke `code-simplifier` to clean up the implementation.

Once both complete:
1. Mark B3 as completed in TodoList.
2. Update `.claude/loop-state.json`: set `currentStep = 4`, add `3` to `completedSteps`.
3. Show **CHECKPOINT 3**:

```
─────────────────────────────────────
✅ B3 HOÀN THÀNH — Code
─────────────────────────────────────
Branch: feature/<feature-name>

<Summary: files created/modified, commit count, key changes>

→ Tiếp tục B4 (Testing)? [yes / no]
─────────────────────────────────────
```

Wait for user response. If **yes**, proceed to B4.

---

## B4: Test — Quality Assurance

**Mark B4 as in_progress in TodoList.**

Announce: `▶ B4: Running tests — unit, code review, and E2E browser tests...`

### B4a: Unit + Integration Tests
Invoke the `qa` skill. This runs the full test suite for affected packages.

### B4b: Code Review
Invoke the `code-review` skill on the current diff vs `develop`.

### B4c: E2E Browser Tests (Playwright)
Before running E2E, confirm apps are running:

```
⚠️  Playwright E2E cần tất cả apps đang chạy.
Bạn đã chạy `pnpm dev` chưa? [yes / no]
```

If **no**: instruct the developer to run `pnpm dev` in a separate terminal, wait for confirmation.

If **yes**: use Playwright MCP tools to:
1. Navigate to `http://localhost:3001` (web) and `http://localhost:3002` (admin)
2. Take a screenshot to verify apps are running
3. Test the golden path for the new feature (navigate, interact, assert expected UI)
4. Test edge cases identified during B1
5. Report pass/fail for each scenario

### B4 Outcome

**If all pass:**
1. Mark B4 as completed in TodoList.
2. Update `.claude/loop-state.json`: set `currentStep = 5`, add `4` to `completedSteps`.
3. Show **CHECKPOINT 4**:

```
─────────────────────────────────────
✅ B4 HOÀN THÀNH — Tests Pass
─────────────────────────────────────
Unit tests:   ✅ <N> passed
Code review:  ✅ No blocking issues
E2E tests:    ✅ <M> scenarios passed

→ Tiếp tục B5 (Ship)? [yes / no]
─────────────────────────────────────
```

**If any fail:**
```
─────────────────────────────────────
❌ B4 THẤT BẠI — Không thể tiếp tục B5
─────────────────────────────────────
Failures:
<list each failure with file/test name and error message>

Fix the failures then run `/feature-loop resume` to retry B4.
─────────────────────────────────────
```

Do NOT proceed to B5. Keep state at `currentStep = 4`.

---

## B5: Ship — Husky + PR + CI

**Only reached when B4 passed completely.**

**Mark B5 as in_progress in TodoList.**

Announce: `▶ B5: Shipping — running Husky hooks, creating PR, CI/CD...`

### B5a: Husky Hooks
Invoke the `verify` skill. This runs the pre-commit and pre-push Husky hooks locally.

If Husky fails:
```
─────────────────────────────────────
❌ B5 BLOQUEADO — Husky hook failed
─────────────────────────────────────
Hook: <hook name>
Error: <error output>

Fix the issue, then run `/feature-loop resume` to retry B5.
─────────────────────────────────────
```
Do not create PR. Keep state at `currentStep = 5`.

### B5b: Create PR
Invoke `superpowers:finishing-a-development-branch`. This:
- Pushes the branch to origin
- Creates a PR from `feature/<feature-name>` → `develop`
- PR title follows Conventional Commits format
- PR body describes WHAT and WHY

### B5c: CI/CD
After PR is created, GitHub Actions runs automatically (`lint → test → build`).

Report:
```
─────────────────────────────────────
✅ B5 HOÀN THÀNH — Feature Shipped
─────────────────────────────────────
PR: <GitHub PR URL>
CI: Running on GitHub Actions (check PR page for status)

Quy trình tiếp theo:
1. Đợi CI pass trên GitHub
2. Assign reviewer
3. Merge sau khi được approve
─────────────────────────────────────
```

### DONE
1. Mark B5 as completed in TodoList.
2. Delete `.claude/loop-state.json`.
3. Announce loop complete.

---

## RESUME — Continuing an Interrupted Loop

When invoked with argument "resume":

1. Read `.claude/loop-state.json`. If file does not exist:
   ```
   ❌ Không tìm thấy loop-state.json. Không có loop nào đang dở.
   Dùng `/feature-loop <feature-name>` để bắt đầu loop mới.
   ```
   Stop.

2. If file exists, announce:
   ```
   ═══════════════════════════════════════
   🔁 RESUMING FEATURE LOOP — <feature>
   ═══════════════════════════════════════
   Branch: <branch>
   Completed: B<n> for each n in completedSteps
   Resuming: B<currentStep>
   ```

3. Recreate TodoList with correct statuses (completed/pending based on state).

4. Jump directly to the step for `currentStep` and continue from there.

---

## Error Handling Rules

- **Sub-skill error:** Stop at current step. Report the error clearly. Keep `loop-state.json` unchanged. Tell developer to fix then `/feature-loop resume`.
- **B4 test failure:** Never auto-advance to B5. List all failures. Keep `currentStep = 4`.
- **B5 Husky failure:** Never create PR. Report which hook failed. Keep `currentStep = 5`.
- **B5 CI failure:** PR stays open. Link to GitHub Actions log. Developer fixes on same branch and pushes — CI reruns automatically.
- **Wrong branch:** If current branch is not `feature/<name>`, warn before B3 and offer to create/switch.
````

- [ ] **Step 2: Verify the skill file exists and is readable**

```bash
cat "C:\Users\lh222\.claude\skills\feature-loop.md" | head -5
```

Expected output:
```
---
name: feature-loop
description: Orchestrates full feature development: B1 Plan → B2 Design...
---
```

- [ ] **Step 3: Verify the skill is discoverable**

In Claude Code, run:
```
/feature-loop test-verification
```

Expected: Claude reads the skill and announces:
```
═══════════════════════════════════════
🔁 FEATURE LOOP — test-verification
═══════════════════════════════════════
```

Then immediately type `no` at the first checkpoint to exit without running brainstorming (this is just a smoke test of INIT).

- [ ] **Step 4: Commit**

```bash
git add "C:\Users\lh222\.claude\skills\feature-loop.md"
git commit -m "feat: add feature-loop skill for automated feature development orchestration"
```

Note: this file lives outside the repo, so if git reports nothing to add, the file was created correctly in the global Claude skills directory. No commit needed in that case — the file is already in place.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|------------|
| `/feature-loop <name>` trigger | Task 2 INIT section |
| `/feature-loop resume` trigger | Task 2 RESUME section |
| B1 → brainstorming skill | Task 2 B1 section |
| B2 → writing-plans skill | Task 2 B2 section |
| B3 → feature-dev + code-simplifier | Task 2 B3 section |
| B4 → qa + code-review + Playwright | Task 2 B4 sections a/b/c |
| B5 → verify + finishing-a-development-branch | Task 2 B5 sections a/b/c |
| Checkpoint format with yes/no/chỉnh sửa | Task 2 each checkpoint |
| State file schema | Task 2 INIT + state updates per step |
| Resume reads state file | Task 2 RESUME section |
| B5 blocked when B4 fails | Task 2 B4 failure handling |
| Playwright warns if pnpm dev not running | Task 2 B4c |
| Branch must be feature/* | Task 2 B3 branch check |
| .gitignore for loop-state.json | Task 1 |
| Delete state file on completion | Task 2 DONE section |

**Placeholder scan:** No TBDs, TODOs, or vague steps found.

**Type consistency:** The state file schema is defined once in INIT and updated consistently in each step section using the same field names (`currentStep`, `completedSteps`, `artifacts`).
