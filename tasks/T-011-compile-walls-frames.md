---
id: T-011
title: "Compile: wall segments and frame placement"
status: ready
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-010]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T09:07:22Z
---
## Goal
Turn each room side into solid wall pieces around its doorways, and place artwork on walls. Features: F4, F3 (placement math).
## Acceptance criteria
- [ ] `walls(room, doorways)` returns solid pieces per side plus one over-door piece (2.2 m → wallHeight) per doorway, each 0.075 m thick from the room edge inward (ADR-001, Q6); each piece carries `side` and `thickness` (ADR-007)
- [ ] `frames(artworks, rooms)` returns position / rotationY / width / height per plan.md §5.3 (height = width × aspect), frame surface 0.08 m from the room edge
- [ ] Frames also return issues (not exceptions) for artwork that hangs past the wall's ends or overlaps a doorway
- [ ] Tests: a side with no doorway, one doorway, a doorway at the very end of a side, artwork on each of n/e/s/w with exact expected coordinates, artwork over a doorway → issue
## Files / modules in scope
`src/lib/compile/walls.ts`, `src/lib/compile/frames.ts`, `src/lib/compile/walls.test.ts`, `src/lib/compile/frames.test.ts`
## Out of scope
Assembly and memo (T-012). Rendering.
## Notes
- Read: plan.md §5.2–§5.3; plan/architecture.md §3; ADR-001, ADR-007; plan/overview.md G1, G2, G4, G6, S1.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:22Z senior: status -> ready
