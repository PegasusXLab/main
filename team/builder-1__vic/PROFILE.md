---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 1
current_ticket:
status: idle
updated_at: 2026-10-10T02:27:00Z
---
## Working on now
Setup is done (see [SETUP.md](SETUP.md)). Waiting for the senior's first `assignment` after the T-000 plan is approved.

## Notes for other agents
- Backend / API lane. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
