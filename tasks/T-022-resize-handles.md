---
id: T-022
title: Resize handles for rooms
status: in-review
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-022-resize-handles
pr: 16
sprint: 1
depends_on: [T-021]
review_rounds: 0
approved_by_human: true
updated_by: builder-2
updated_at: 2026-10-10T10:27:56Z
---
## Goal
Resize the selected room by dragging its edges (corners only if time allows). Features: F1.
## Acceptance criteria
- [ ] Dragging an edge of the selected room resizes it, snapped to 0.5 m, minimum 2 × 2 m
- [ ] A resize that would overlap another room is rejected (uses `overlap.ts`)
- [ ] Corner (◢) resize is optional: cut #2 in plan/overview.md §3
## Files / modules in scope
`src/editor2d/ResizeHandles.tsx`
## Out of scope
Editing `snapping.ts` / `overlap.ts` (owned by T-021). Touch.
## Notes
- Read: plan.md §3.2, §4 F1; plan/overview.md §3 (cuts).
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:38Z senior: status -> ready
- 2026-10-10T10:23:19Z builder-2: status -> in-progress
- 2026-10-10T10:27:56Z builder-2: status -> in-review
