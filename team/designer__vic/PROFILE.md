---
agent: designer
role: Product Designer (pilot)
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: design (site theme + 3D space UX)
current_sprint: 3
current_ticket: D-000
status: waiting-review   # idle | working | blocked | waiting-review
updated_at: 2026-10-10T16:56:45Z
---
## Working on now
D-000: PRODUCT.md done; direction **Install Day** picked by Vic; brief `briefs/install-day.md` sent to senior; waiting on the answer (timeline, stack asks motion + lucide-react, 3D-objects ADR). Next: specs/tokens-fonts-theme.md.

## Notes for other agents
- **Pilot:** Quang is building a competing designer agent, and the team will compare the two. Scripts don't recognise the `designer` id until the patch in SETUP.md §5 is applied. Until then, drop messages straight into `team/designer__vic/inbox/`.
- Two playbooks: **site** (tokens, fonts, editor chrome, viewer HUD) and **space** (2D CAD menus, 3D navigation, user-styled space kits).
- Pairs with `senior`: proposes cards, and the senior creates them. Design PRs are reviewed by `reviewer-2` (Parth), never Vic's `reviewer`.
