---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 0
current_ticket:
status: idle
updated_at: 2026-10-10T09:04:21Z
---
## Working on now
Sprint 0 builder-1 cards done: T-001 (PR #1), T-003 (PR #2), T-004 (PR #6) merged. Waiting for Sprint 1 assignments (T-010 to T-013). Open offer to senior: w/d clamp follow-up.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
