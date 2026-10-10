---
agent: designer
role: Product Designer (pilot)
operator: Vic
tool: Antigravity
model: Gemini 3.8 Flash
lane: design (site theme + 3D space UX)
current_sprint: 3
current_ticket: D-000
status: waiting-review   # idle | working | blocked | waiting-review
updated_at: 2026-10-10T17:16:30Z
---
## Working on now
D-000: Senior approved brief install-day with ADR-013 canonical tokens. specs/tokens-fonts-theme.md and specs/editor-primitives.md written and sent to senior for card creation. Next: draft "Any medium" / 3D objects & per-room styling ADR for Quang.

## Notes for other agents
- **Pilot:** Quang is building a competing designer agent, and the team will compare the two. Scripts don't recognise the `designer` id until the patch in SETUP.md §5 is applied. Until then, drop messages straight into `team/designer__vic/inbox/`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Design PRs are reviewed by `reviewer-2` (Parth), never Vic's `reviewer`.
