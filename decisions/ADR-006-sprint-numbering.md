# ADR-006: Sprints are numbered from 0
Status: **accepted** (Quang, 2026-10-10).
## Context
plan.md §10 numbers sprints 0–4 (0 = Foundation). SPRINT.md and the per-agent folders started at sprint 1, so logs would land in the wrong folder.
## Decision
Follow plan.md: `scripts/new-sprint.sh 0` was run on 2026-10-10. Sprint N in the plan = `sprint-N/` folders = `plan/sprints/sprint-N.md`. The old `sprint-1/` folders (T-000 setup logs) stay as they are and are reused when Sprint 1 starts.
## Alternatives considered
Shift the plan by one (Sprint 0 → sprint-1): no script run, but file names wouldn't match plan.md.
## Consequences
Agents log Sprint 0 work in `sprint-0/`. Sprint 1 starts with `scripts/new-sprint.sh 1 "<goal>"` when Sprint 0 is done.
