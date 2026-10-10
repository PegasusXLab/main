---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 1
current_ticket: T-011
status: working
updated_at: 2026-10-10T09:09:34Z
---
## Working on now
Sprint 1 lane A: T-010 compile edges + doorways (branch feat/T-010-edges-doorways). Then T-011 -> T-012 -> T-013.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
