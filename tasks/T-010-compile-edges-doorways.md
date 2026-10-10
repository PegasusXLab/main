---
id: T-010
title: "Compile: shared edges and doorways"
status: approved
lane: backend
assignee: builder-1
reviewer: reviewer
branch: feat/T-010-edges-doorways
pr: 7
sprint: 1
depends_on: [T-003]
review_rounds: 0
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T09:12:48Z
---
## Goal
Find which rooms share walls and where the doorways go. Features: F4.
## Acceptance criteria
- [ ] `findSharedEdges(rooms)` returns every shared interval with both room ids and sides; touching edges only, positive length; uses `src/lib/schema/geom.ts` only
- [ ] `doorways(edges, rooms)` returns one doorway per shared interval: centered, width `min(1.2, overlap)`, height 2.2; overlap below 1.0 m → no doorway (Q7, ADR-007); skipped if either room lists that side in `closedWalls`
- [ ] Pure functions, no three.js / React imports
- [ ] Tests: no neighbors, full shared wall, partial overlap, overlap below the minimum, corner touch only (no shared edge), L-shape (2 edges)
## Files / modules in scope
`src/lib/compile/edges.ts`, `src/lib/compile/doorways.ts`, `src/lib/compile/edges.test.ts`, `src/lib/compile/doorways.test.ts`
## Out of scope
Wall splitting, frames, assembly, the SceneModel type.
## Notes
- Read: plan.md §5.2; plan/architecture.md §3; ADR-001, ADR-004, ADR-007; plan/overview.md G3, G5, G7.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:19Z senior: status -> ready
- 2026-10-10T09:09:33Z builder-1: status -> in-progress
- 2026-10-10T09:11:34Z builder-1: status -> in-review
- 2026-10-10T09:12:48Z reviewer: status -> approved
