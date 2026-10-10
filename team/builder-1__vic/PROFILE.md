---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 0
current_ticket: T-003
status: working
updated_at: 2026-10-10T08:28:27Z
---
## Working on now
T-003 schema (branch feat/T-003-schema). T-001 merged (PR #1). Next: T-004 store after T-003 merges.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
