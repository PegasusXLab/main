---
id: T-023
title: Add-adjacent-room (+) buttons
status: ready
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-021, T-022]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T09:07:41Z
---
## Goal
A "+" on each side of the selected room adds a neighbor sharing that wall. Features: F1 (and produces F4 doorways).
## Acceptance criteria
- [ ] Four "+" buttons on the selected room; clicking one adds a room on that side, flush against it, with the same length along that side and 6 m depth
- [ ] Refused (button disabled, with a tooltip) if the new room would overlap
- [ ] The new room becomes the selection
## Files / modules in scope
`src/editor2d/AddRoomButtons.tsx`, `src/editor2d/Canvas.tsx` (only to mount the buttons; after T-022 merges)
## Out of scope
Editing `snapping.ts` / `overlap.ts`.
## Notes
- Read: plan.md §3.2, §4 F1.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:41Z senior: status -> ready
- 2026-10-10T10:31:01Z senior: Canvas.tsx added to scope (mount only); depends on T-022 so only one open PR edits Canvas.tsx
