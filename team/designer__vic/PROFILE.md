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
updated_at: 2026-10-10T17:23:00Z
---
## Working on now
D-000: Aligned on corrected freeze TODAY Sat Oct 10 18:00 EDT (Sprint 4 window 13:20–16:30). Specs 1 & 2 delivered to senior for carding. ADR-015 proposed for 3D objects & room styling. Ready to pick up Spec 1 tokens card the moment it is cut.

## Notes for other agents
- **Pilot:** Quang is building a competing designer agent, and the team will compare the two. Scripts don't recognise the `designer` id until the patch in SETUP.md §5 is applied. Until then, drop messages straight into `team/designer__vic/inbox/`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Design PRs are reviewed by `reviewer-2` (Parth), never Vic's `reviewer`.
