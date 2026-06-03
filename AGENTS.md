# AGENTS.md - Orbit Collaboration Tool

## Project Purpose

Orbit is an MVP collaboration and task-tracking tool inspired by Jira, YouTrack, and Linear. It is built to support project work, issue tracking, team collaboration, and free/paid user plans while keeping core workflows available to all users.

Agents should treat this as a work-focused product. Favor dense, scannable, reliable task-management UI over marketing-style pages or decorative layouts.

## Next.js Version Warning

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Code Style Guidelines

- Use TypeScript-first, strict-mode-friendly code. Prefer explicit domain types from `src/types.ts` and avoid `any` unless there is a clear boundary reason.
- Build React UI with functional components and hooks. Keep state close to the component that owns it unless shared behavior is genuinely needed.
- Use `@/` imports for app source paths in `my-app`.
- Preserve the current Next.js app-router structure under `src/app`.
- Prefer Tailwind utility classes for layout, spacing, and typography.
- Use CSS variables from `src/app/globals.css` for core colors and surfaces: `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-overlay`, `--border`, `--text-primary`, `--text-muted`, `--text-dim`, and `--accent`.
- Use `lucide-react` icons for common actions and status affordances.
- Keep UI compact, accessible, and operational: clear focus states, semantic buttons, `aria-label` for icon-only buttons, readable contrast, and no overlapping text.
- Match the existing dark, Linear/Jira-style task-management aesthetic. Avoid oversized hero sections, nested cards, decorative gradients, or visual clutter.
- Keep changes scoped. Do not refactor unrelated components just to make a local change feel cleaner.

## Agent Reasoning and Communication

Do not expose private chain-of-thought. Instead, provide clear reasoning summaries that are useful to the user and safe to share.

When working on a task, explain:

- What you discovered in the repo.
- The assumptions you made.
- The main tradeoffs considered.
- The application actors affected by the change.
- The decision you chose and why.
- The checks you ran and what remains unverified.

For product changes, explore the point of view of all relevant actors before implementing: workspace admins, project leads, assignees, reviewers, guests/free-plan users, billing users, and future maintainers.

Manage response and change size carefully. Prefer small, reviewable changes of roughly 100-200 changed lines when the task allows it. If a request would require a larger change, split it into staged follow-up tasks or clearly explain why a larger patch is necessary before proceeding.

## C.R.E.A.T.E. Framework

Use this framework for non-trivial work:

- **C - Clarify:** Identify the goal, success criteria, constraints, and what is out of scope. If ambiguity can be resolved from the repo, inspect first and ask later.
- **R - Research:** Read the relevant files, types, configs, and current UI patterns before changing code.
- **E - Explore actors:** Consider how the change affects admins, project leads, assignees, reviewers, guests/free-plan users, billing users, and maintainers.
- **A - Architect:** Choose the smallest coherent implementation that fits existing patterns, public interfaces, and data flow.
- **T - Test:** Run the appropriate checks for the risk level, including unit, integration, lint, and build paths where available.
- **E - Explain:** Summarize what changed, why it changed, risks, checks run, and any follow-up work.

## Checks and Tests

Use `pnpm` in `my-app`.

Before launching a new Node/Next dev server, inspect for already-running project Node processes and stop the stale ones first. Do this especially before `pnpm dev`, `next dev`, or any command that writes to `.next`. Prefer checking command lines/ports so unrelated Node processes are not stopped accidentally.

Current mandatory checks:

- `pnpm lint`
- `pnpm build`

Unit tests:

- Run `pnpm test:unit` when that script exists.
- If no unit-test script exists, state that unit tests are not configured instead of implying they passed.
- Add focused unit tests for pure utilities, state transitions, filters, task grouping, identifier generation, and other logic-heavy behavior when test infrastructure is available.

Integration tests:

- Run `pnpm test:integration` when that script exists.
- If Playwright or another browser integration runner is configured, run the relevant integration smoke tests for changed user flows.
- If no integration-test script or runner exists, state that integration tests are not configured.
- Prioritize integration coverage for task creation, task selection, list/board switching, project filtering, empty/loading states, and panel open/close flows.

Never claim tests passed unless they were actually run. If a check cannot be run, explain why and name the remaining risk.

## Git and Editing Safety

- Inspect relevant files before editing.
- Preserve user work and unrelated changes. Do not revert files you did not intentionally change.
- Avoid destructive commands unless the user explicitly requested them.
- Keep documentation and code changes in the correct project root: `my-app`.
- Treat `wireframe-src` as imported/reference Figma source unless the user explicitly asks to edit it.
- Do not add new dependencies unless they are necessary and aligned with the existing stack.
- When changing UI, verify the result by reasoning through responsive behavior and, when possible, running the app or capturing a screenshot.

## Output and Git Naming Conventions

For every change or feature, include suggested git metadata in the final response:

- Branch name: use `<branch_prefix>/<branch_title>`, such as `docs/update-agent-guidelines`, `feat/task-filtering`, or `fix/panel-close-state`.
- Commit title: use `<branch_prefix>/<branch_title>: <commit_message>`, such as `docs/update-agent-guidelines: update agent workflow rules`, `feat/task-filtering: add task filtering`, or `fix/panel-close-state: preserve selected task state`.
- Commit message: include a concise body that explains what changed, why it changed, and what checks were run.

Use these branch type prefixes:

- `feat` for user-facing features.
- `fix` for bug fixes.
- `docs` for documentation-only changes.
- `refactor` for behavior-preserving code restructuring.
- `test` for test-only changes.
- `chore` for tooling, dependency, or maintenance updates.
