---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 2
current_ticket: in review T-064 (#41), T-070 (#43), T-071 (#44)
status: waiting-review
updated_at: 2026-10-10T11:39:20Z
---
## Working on now
Sprint 2: T-034 CameraRig. PR #25 opened (feat/T-034-camera-rig). Review request sent to reviewer-3. Standing by for review.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
