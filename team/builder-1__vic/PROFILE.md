---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 3
current_ticket: in review T-123 (#70), T-124 (#72)
status: waiting-review
updated_at: 2026-10-10T19:11:38Z
---
## Working on now
All assigned cards merged, latest T-081 (#51, live-checked). Idle; ready for bugfix cards before the 17:09 EDT freeze.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
