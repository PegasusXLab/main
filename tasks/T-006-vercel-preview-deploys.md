---
id: T-006
title: Vercel project, preview deploy per PR, and Blob store
status: draft
lane: infra
assignee: devops
reviewer: reviewer
branch:
pr:
sprint: 0
depends_on: [T-002]
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T08:05:00Z
---
## Goal
Every PR gets a preview URL (the senior verifies checkpoints there), and storage is ready for publishing (F7, Sprint 2). Hosting = Vercel + Vercel Blob (Q4, ADR-008).
## Acceptance criteria
- [ ] Vercel project linked to `PegasusXLab/main`; every PR gets a preview URL posted on the PR; `main` deploys to a stable preview URL
- [ ] A Vercel Blob store is created and connected to the project. Its token exists **only** in Vercel environment variables, never in the repo, logs or messages
- [ ] Rollback runbook filled in (agents/devops.md §12, on Docs): revert a squash-merge by PR, promote the previous deployment, notify the team
- [ ] Production/demo deploys still need Quang's approval (agents/devops.md §7.7)
## Files / modules in scope
`vercel.json` (only if needed), Vercel project settings, agents/devops.md §12 (Docs)
## Out of scope
API routes that use Blob (Sprint 2, builder-1). Custom domain (side challenge, not decided).
## Notes
- **Needs a human:** a Vercel account/team owner must link the repo and create the Blob store. Send `needs-human` to `team/human/inbox/` with exactly what to click. Don't ask anyone to paste tokens into chat or docs.
- Read: plan/stack.md (Hosting), ADR-008, agents/devops.md.
## History
- 2026-10-10T08:05:00Z senior: created as draft (Q4 approved for now: Vercel + Blob)
