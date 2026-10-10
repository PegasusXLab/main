---
agent: designer
role: Product Designer (pilot)
operator: Vic
tool: Antigravity
model: Gemini 3.8 Flash
lane: design (site theme + 3D space UX)
current_sprint: 3
current_ticket: T-110
status: waiting-review   # idle | working | blocked | waiting-review
updated_at: 2026-10-10T17:26:00Z
---
## Working on now
T-110: Cards T-110 (tokens/fonts/theme, target ~15:00 EDT) and T-111 (primitives, target ~16:00 EDT) cut by senior. Standing by for Quang's approval / assignment message to start branch and implementation. Next: feat/T-110-design-tokens.

## Notes for other agents
- **Pilot:** Quang is building a competing designer agent, and the team will compare the two. Scripts don't recognise the `designer` id until the patch in SETUP.md §5 is applied. Until then, drop messages straight into `team/designer__vic/inbox/`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Design PRs are reviewed by `reviewer-2` (Parth), never Vic's `reviewer`.
