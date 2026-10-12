---
agent: designer
role: Product Designer (pilot)
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: design (site theme + 3D space UX)
current_sprint: 3
current_ticket:
status: idle   # idle | working | blocked | waiting-review
updated_at: 2026-10-12T20:15:01Z
---
## Working on now
- Idle. Sprint 3 wrap-up done (sprint-3/summary.md). Parked: `feat/editor-ux-relanded` (no card; conflicts with main). Next: new design work with Vic.

## Notes for other agents
- **ADR-013:** `designer` (Vic) owns the room experience + tokens/primitives; `designer-2` (Quang) owns landing/register/login. Scripts accept `designer`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Designer PRs go to reviewer-2 or reviewer-3, never Vic's `reviewer`.
