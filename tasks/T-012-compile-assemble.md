---
id: T-012
title: compile() assembly, SceneModel type and the F4 test matrix
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-011]
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T07:24:55Z
---
## Goal
One call, `compile(gallery) → { scene, issues }`, that the renderer depends on. Features: F4, F5, F6/F8 (camera views).
## Acceptance criteria
- [ ] `SceneModel` type exported per plan.md §5.4, plus the additions in plan/architecture.md §3 if Q12 is approved (otherwise exactly §5.4)
- [ ] `compile` combines T-010 / T-011 output, and emits `rooms[].view` (eye height 1.6 m) if Q12 is approved
- [ ] Whole-gallery recompile is fine; if a memo is added, its key includes edge-sharing neighbors (overview S4)
- [ ] The full F4 matrix in plan/architecture.md §3 passes, including `src/fixtures/sample-3room.json`
- [ ] No three.js / React imports anywhere under `src/lib/compile/`
## Files / modules in scope
`src/lib/compile/compile.ts`, `src/lib/compile/types.ts`, `src/lib/compile/compile.test.ts`
## Out of scope
Rendering, camera behavior.
## Notes
- Read: plan.md §5.4; plan/architecture.md §3; ADR-004; plan/overview.md S1–S4.
- Reference Top idea 1 / R4: camera spots are data emitted here, so the camera stays swappable.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
