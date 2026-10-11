---
id: T-021
title: "Rooms in 2D: add, select, move, delete, snapping, overlap"
status: merged
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-021-rooms-2d
pr: 13
sprint: 1
depends_on: [T-020]
review_rounds: 1
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T10:22:18Z
---
## Goal
The core F1 interactions. Features: F1.
## Acceptance criteria
- [ ] Clicking empty space adds a 6 × 6 m room snapped to 0.5 m; clicking a room selects it; dragging moves it (snapped); the Delete key deletes the selected room
- [ ] A move that would overlap another room (strict overlap; touching is allowed) is rejected and the room snaps back
- [ ] `snapping.ts` and `overlap.ts` use `src/lib/schema/geom.ts` only, with no float comparisons of their own
- [ ] All changes go through store actions; the JSON updates live
- [ ] Unit tests for snapping and overlap
## Files / modules in scope
`src/editor2d/RoomShape.tsx`, `src/editor2d/snapping.ts`, `src/editor2d/overlap.ts`, `src/editor2d/snapping.test.ts`, `src/editor2d/overlap.test.ts`
## Out of scope
Resize handles (T-022), "+" buttons (T-023), artwork markers (Sprint 2).
## Notes
- Read: plan.md §4 F1; plan/architecture.md §2, §4; plan/overview.md G5, G8, G9.
- T-022, T-023 and T-024 import `snapping.ts` / `overlap.ts` but must not edit them; changes go through this card's owner.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:34Z senior: status -> ready
- 2026-10-10T09:36:16Z builder-2: status -> in-progress
- 2026-10-10T09:36:58Z builder-2: status -> in-progress
- 2026-10-10T09:44:33Z builder-2: status -> in-review
- 2026-10-10T09:46:00Z reviewer: status -> changes-requested
- 2026-10-10T09:48:09Z builder-2: status -> in-progress
- 2026-10-10T09:59:52Z builder-2: status -> in-review
- 2026-10-10T10:20:43Z reviewer: status -> approved
- 2026-10-10T10:21:04Z devops: status -> merging
- 2026-10-10T10:22:18Z devops: status -> merged
