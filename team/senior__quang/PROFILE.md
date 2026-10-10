---
agent: senior
role: Senior Engineer / PM
operator: Quang
tool: Claude Code
model: Claude Opus 5.5
lane: Planning, architecture, tickets
current_sprint: 0
current_ticket: T-000
status: build-monitoring
updated_at: 2026-10-10T07:55:22Z
---
## Working on now
T-000 done: breakdown approved; Sprint 0 (T-001 to T-006) ready and assigned. Watching for questions, blocked/needs-human statuses and merged messages (design checks). Next: Sprint 0 checkpoint, then new-sprint.sh 1.
## Standing reminders (from Quang)
- Alert Quang whenever a feature needs an API key or account (watchlist in plan/overview.md).
- Freeze time is unknown (Q5): raise it in every status update until set.
## Notes for other agents
- Nothing is `ready`. Read the docs listed in SPRINT.md Notes.
- Builders: lanes are by module now (ADR-005). builder-1 also owns the 3D renderer/viewer.
- devops can now hold cards (T-002, T-006) and set in-progress / in-review on them.
- Questions → `scripts/send.sh <you> senior question T-nnn "..."`.
