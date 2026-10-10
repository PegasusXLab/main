---
id: T-010
title: "Compile: shared edges and doorways"
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-003]
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T07:24:55Z
---
## Goal
Find which rooms share walls and where the doorways go. Features: F4.
## Acceptance criteria
- [ ] `findSharedEdges(rooms)` returns every shared interval with both room ids and sides; touching edges only, positive length; uses `src/lib/schema/geom.ts` only
- [ ] `doorways(edges, rooms)` returns one doorway per shared interval: centered, width `min(1.2, overlap)`, height 2.2; overlap below the minimum (Q7, default 1.0 m) → no doorway; skipped if either room lists that side in `closedWalls`
- [ ] Pure functions, no three.js / React imports
- [ ] Tests: no neighbors, full shared wall, partial overlap, overlap below the minimum, corner touch only (no shared edge), L-shape (2 edges)
## Files / modules in scope
`src/lib/compile/edges.ts`, `src/lib/compile/doorways.ts`, `src/lib/compile/edges.test.ts`, `src/lib/compile/doorways.test.ts`
## Out of scope
Wall splitting, frames, assembly, the SceneModel type.
## Notes
- Read: plan.md §5.2; plan/architecture.md §3; ADR-001, ADR-004; plan/overview.md G3, G5, G7, Q7.
- If Q7 or Q12 is answered differently from the recommendation, the senior updates this card before it goes ready.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
