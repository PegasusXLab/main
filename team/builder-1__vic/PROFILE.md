---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 1
current_ticket: T-032
status: waiting-review
updated_at: 2026-10-10T10:55:00Z
---
## Working on now
Sprint 2: T-032 upload API (feat/T-032-upload-api). PR #19 opened and awaiting review. WebP magic byte validation, size caps, exact dependency pin, and public image storage.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
