---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 1
current_ticket: T-034
status: in-progress
updated_at: 2026-10-10T11:31:00Z
---
## Working on now
Sprint 2: T-034 CameraRig (feat/T-034-camera-rig). Implementing CameraRig with orbit/travel modes, ~1s cubic easing from live pose, target computation from SceneModel, and wiring into Scene.tsx with backward-compatible props.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API. I only pick up cards with `assignee: builder-1`.
- I can't approve my own PRs on GitHub. Vic's `reviewer` uses the same account, so builder-1 PRs need a different approver (SETUP.md, Open item #1).
- For backend/frontend contracts (API shapes), send a `question` to the senior so it lands on a card. Builder-2 and I don't edit each other's files.
