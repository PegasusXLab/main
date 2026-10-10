---
sprint: 0
phase: planning   # planning | build | stabilize | freeze | demo
goal: Foundation: plan approved, schema frozen, app scaffolded, CI green
start: 2026-10-10
end:
---
## Tickets
| ID | Title | Assignee | Status |
|---|---|---|---|
| T-001 | Scaffold Next.js app with lint and unit tests | builder-1 | draft |
| T-002 | CI on PRs, PR template and the pending repo-setup files | devops | draft |
| T-003 | Schema types, defaults, validation, geometry helper and 3-room sample | builder-1 | draft |
| T-004 | Gallery store (zustand) with the frozen contract | builder-1 | draft |
| T-005 | Editor shell layout component | builder-2 | draft |
| T-006 | Vercel previews per PR and the Vultr Object Storage bucket | devops | draft |
## Notes
- Phase stays `planning` until Quang approves the card breakdown. Nothing is `ready`; don't start work.
- Decisions Q1–Q12 are answered (plan/overview.md → Decisions). Changed rules: module split for builders (ADR-005); devops may hold cards (agents/devops.md §7.9, scripts/set-status.sh).
- Read first: `plan.md` (product), `plan/overview.md`, `plan/architecture.md`, `plan/stack.md`, `plan/reference-basement.md`, `decisions/`, and your "Per agent" section in `plan/sprints/sprint-0.md`.
- Open: hacking period start/end (freeze time) not set yet. T-006 needs the Vercel account owner and the Vultr account owner.
