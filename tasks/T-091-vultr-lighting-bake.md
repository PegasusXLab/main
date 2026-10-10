---
id: T-091
title: "[P2] Bake room lighting on a Vultr GPU when a gallery is published"
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T08:30:00Z
---
## Goal
The rich "pre-lit" look of the reference site, for generated rooms: on publish, a Vultr GPU computes soft shadows and light bounce for each room and saves them as light textures the viewer applies. Features: F11, F8.
## Acceptance criteria
- [ ] (to be refined if time allows) Publish queues a bake job; the viewer shows the live preset lighting until the bake is ready, then uses the baked textures
- [ ] Editing a room invalidates only that room's bake
## Files / modules in scope
TBD (stretch; only planned after P0 and F11 are done).
## Out of scope
Real-time shadows in the browser (plan.md §7 says none in P0).
## Notes
- **Stretch.** Highest visual payoff, highest effort. **Budget:** GPU instance billed by the hour; Quang must approve a limit.
- Reference R3 (plan/reference-basement.md): we rejected hand-baked lighting because our rooms are generated. This would bake it automatically instead.
## History
- 2026-10-10T08:30:00Z senior: created as draft P2 idea (Quang: use Vultr for graphics heavy lifting)
