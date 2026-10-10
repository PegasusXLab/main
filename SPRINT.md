---
sprint: 0
phase: build   # planning | build | stabilize | freeze | demo
goal: Foundation: plan approved, schema frozen, app scaffolded, CI green
start: 2026-10-10
end:
---
## Tickets
| ID | Title | Assignee | Status |
|---|---|---|---|
| T-001 | Scaffold Next.js app with lint and unit tests | builder-1 | merged |
| T-002 | CI on PRs, PR template and the pending repo-setup files | devops | merged |
| T-003 | Schema types, defaults, validation, geometry helper and 3-room sample | builder-1 | merged |
| T-004 | Gallery store (zustand) with the frozen contract | builder-1 | merged |
| T-005 | Editor shell layout component | builder-2 | merged |
| T-006 | Vercel previews per PR and the Vultr Object Storage bucket | devops | ready |
## Notes
- Quang approved the breakdown (2026-10-10). Sprint 0 cards are `ready` and assigned; phase `build`. Start order: T-001 first, then T-002, T-003, T-005 in parallel, then T-004 and T-006 (Vercel: https://galleriverse.vercel.app/).
- Decisions Q1–Q12 are answered (plan/overview.md → Decisions). Changed rules: module split for builders (ADR-005); devops may hold cards (agents/devops.md §7.9, scripts/set-status.sh).
- Read first: `plan.md` (product), `plan/overview.md`, `plan/architecture.md`, `plan/stack.md`, `plan/reference-basement.md`, `decisions/`, and your "Per agent" section in `plan/sprints/sprint-0.md`.
- Local first: everything is built and checked with `npm run dev` / `npm test`; no accounts needed (ADR-008 local storage fallback). Vercel is connected at https://galleriverse.vercel.app/ (T-006 finishes the setup); local checks stay the source of truth.
- Open: hacking period start/end (freeze time) not set yet.
