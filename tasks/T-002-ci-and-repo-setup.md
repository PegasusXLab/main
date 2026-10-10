---
id: T-002
title: CI on PRs, PR template and the pending repo-setup files
status: changes-requested
lane: infra
assignee: devops
reviewer: reviewer
branch: chore/T-002-ci-and-repo-setup
pr: 4
sprint: 0
depends_on: [T-001]
review_rounds: 1
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T08:42:19Z
---
## Goal
Every PR to `main` is checked automatically, and the repo has the setup files from agents/SETUP.md "Pending". Features: process (Definition of done in AGENTS.md).
## Acceptance criteria
- [ ] CI workflow on every PR to `main` and on pushes to `main`: install (cached), lint, typecheck, unit tests, using the `package.json` scripts from T-001
- [ ] The CI job name is stable, so it can be set as a required check in branch protection (tell Quang the name; branch protection is a manual admin setting)
- [ ] `.github/pull_request_template.md` with the sections in agents/builder.md §8 (Summary, Task, Changes, Diagram, Test evidence, Handoff note, Checklist)
- [ ] Restored from reverted commit `867d992`, reviewed and adjusted for the approved stack: `CLAUDE.md` containing only `@../pegasus-docs/AGENTS.md` (AGENTS.md lives on the Docs worktree, not on main, so a bare `@AGENTS.md` would point at nothing; caught by builder-1), `.github/workflows/docs-guard.yml` (fails a PR to `main` that adds Docs-branch files), `.env.example` (variable names only, no values; include `VULTR_S3_ENDPOINT=`, `VULTR_S3_BUCKET=`, `VULTR_S3_ACCESS_KEY=`, `VULTR_S3_SECRET_KEY=` (ADR-008))
- [ ] A test PR shows CI going red on a failing test and green on fix (link it in the handoff note)
## Files / modules in scope
`.github/workflows/ci.yml`, `.github/workflows/docs-guard.yml`, `.github/pull_request_template.md`, `CLAUDE.md`, `.env.example`
## Out of scope
`.gitignore` (T-001). Deploys (T-006). Any application code or `package.json` changes: if CI needs a new script, send the senior a `question`.
## Notes
- Read: agents/devops.md (new §7 step 9 for your own cards), agents/SETUP.md "Pending", plan/stack.md.
- Reference R13 (plan/reference-basement.md): `CLAUDE.md` only imports the shared rules file, here through the Docs worktree path.
- Your own PR is reviewed by the reviewer like any other. Merge only after approval and green CI.
## History
- 2026-10-10T07:40:00Z senior: created as draft (Q11 approved: devops may hold cards)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T07:54:06Z senior: status -> ready
- 2026-10-10T08:12:18Z senior: CLAUDE.md import path clarified to ../pegasus-docs/AGENTS.md (builder-1 finding)
- 2026-10-10T08:29:21Z devops: status -> in-progress
- 2026-10-10T08:38:37Z devops: status -> in-review
- 2026-10-10T08:42:19Z reviewer: status -> changes-requested
