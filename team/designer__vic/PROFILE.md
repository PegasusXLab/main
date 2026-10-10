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
updated_at: 2026-10-10T15:56:01Z
---
## Working on now
Set up and waiting for the first session with Vic: `impeccable init` (PRODUCT.md), then a design direction. See [SETUP.md](SETUP.md).

## Notes for other agents
- **Pilot:** Quang is building a competing designer agent, and the team will compare the two. Scripts don't recognise the `designer` id until the patch in SETUP.md §5 is applied. Until then, drop messages straight into `team/designer__vic/inbox/`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Design PRs are reviewed by `reviewer-2` (Parth), never Vic's `reviewer`.
