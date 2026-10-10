---
id: T-001
title: Scaffold Next.js app with lint and unit tests
status: merging
lane: infra
assignee: builder-1
reviewer: reviewer
branch: feat/T-001-scaffold
pr: 1
sprint: 0
depends_on: []
review_rounds: 1
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T08:26:47Z
---
## Goal
An empty but runnable app on `main` that every other card builds on. Features: foundation for all.
## Acceptance criteria
- [ ] Next.js (App Router) + TypeScript strict + Tailwind app runs with `npm run dev`; `/` shows a plain "Pegasus" placeholder
- [ ] Runtime and dev packages from `plan/stack.md` installed with exact versions pinned (howler and the storage SDK excluded until approved)
- [ ] `npm run lint`, `npm run typecheck` and `npm test` (vitest, one trivial passing test) all succeed
- [ ] Path alias `@/*` → `src/*`
- [ ] Empty folders with a `.gitkeep`: `src/lib/schema`, `src/lib/compile`, `src/store`, `src/editor2d`, `src/panels`, `src/upload`, `src/viewer3d`, `src/components`, `src/fixtures`
- [ ] `README.md` on main: one paragraph + how to run (the inspiration disclosure comes later)
## Files / modules in scope
`package.json`, lockfile, `tsconfig.json`, `next.config.*`, eslint / prettier / tailwind / postcss / vitest configs, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, the `.gitkeep` files above, `README.md`, `.gitignore` (the scaffold generates it; it must ignore local env files, except the example file owned by T-002, and the local storage folder `.data/`)
## Out of scope
CI workflows, PR template, `.env.example`, `CLAUDE.md` (devops, T-002). Any feature code.
## Notes
- Read: plan.md §8, plan/stack.md, plan/architecture.md §5.
- Lane: infra → builder-1 under the current senior.md rule (unchanged by Q1).
- Reference R13 (plan/reference-basement.md): pin versions; read the installed framework docs, not memory.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T07:54:01Z senior: status -> ready
- 2026-10-10T07:55:00Z builder-1: status -> in-progress
- 2026-10-10T07:59:11Z builder-1: status -> in-review
- 2026-10-10T08:01:01Z reviewer: status -> approved
- 2026-10-10T08:02:23Z reviewer: status -> changes-requested
- 2026-10-10T08:02:59Z builder-1: status -> in-review
- 2026-10-10T08:04:38Z reviewer: status -> approved
- 2026-10-10T08:26:47Z devops: status -> merging
