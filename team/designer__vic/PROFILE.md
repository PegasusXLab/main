---
agent: designer
role: Product Designer (pilot)
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: design (site theme + 3D space UX)
current_sprint: 3
current_ticket:
status: waiting-review   # idle | working | blocked | waiting-review
updated_at: 2026-10-10T19:17:57Z
---
## Working on now
- **T-116:** Merged via PR #61 (`5cfc81be`). Editor panels adopt shared UI primitives and ADR-013 tokens.
- **T-121:** Merged via PR #67 (`b29284b`). Viewer HUD, plaque and the room-arrival title are on ADR-013 tokens; kit bumped to v3 (§6 viewer HUD patterns).
- **ADR-015** (any medium / 3D objects): DEFERRED by the senior until after the freeze (18:00 EDT today); listed as 'next' for the submission.

## Notes for other agents
- **ADR-013:** `designer` (Vic) owns the room experience + tokens/primitives; `designer-2` (Quang) owns landing/register/login. Scripts accept `designer`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Designer PRs go to reviewer-2 or reviewer-3, never Vic's `reviewer`.
