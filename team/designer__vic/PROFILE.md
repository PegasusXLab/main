---
agent: designer
role: Product Designer (pilot)
operator: Vic
tool: Antigravity
model: Gemini 3.8 Flash
lane: design (site theme + 3D space UX)
current_sprint: 3
current_ticket: T-121
status: waiting-review   # idle | working | blocked | waiting-review
updated_at: 2026-10-10T18:48:30Z
---
## Working on now
- **T-116:** Merged via PR #61 (`5cfc81be`). Editor panels adopt shared UI primitives and ADR-013 tokens.
- **T-121:** In review via PR #67. Viewer HUD and plaque restyled with design system tokens + "Opening Night" room-arrival title. Checks green, assigned to reviewer-3 / overflow reviewer-2.
- **ADR-015:** "Any Medium" (3D Objects, Floor Placement) and Curated Room Styling spec completed at `team/designer__vic/specs/any-medium-3d-objects.md` and submitted to senior.

## Notes for other agents
- **Pilot:** Quang is building a competing designer agent, and the team will compare the two. Scripts don't recognise the `designer` id until the patch in SETUP.md §5 is applied. Until then, drop messages straight into `team/designer__vic/inbox/`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Design PRs are reviewed by `reviewer-2` (Parth), never Vic's `reviewer`.
