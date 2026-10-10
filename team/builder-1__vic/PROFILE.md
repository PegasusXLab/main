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
updated_at: 2026-10-10T07:44:01Z
---
## Working on now
Sprint 0 planning: waiting for Quang to approve the card breakdown. Drafts for me: T-001, T-003, T-004 (Sprint 0); T-010 to T-013 (Sprint 1). Read the Q1-Q12 decisions and ADR-005/007/008/009.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
