---
id: T-043
title: "2D art markers on walls, draggable along the wall"
status: draft
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: [T-023]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T11:00:20Z
---
## Goal
Artwork shows as a short thick tick on its wall in the 2D view and can be dragged along that wall (plan.md §3.3). Features: F3.
## Acceptance criteria
- [ ] `<ArtMarkers />` draws a marker per artwork on its room's wall, at its offset and width, in plan coordinates
- [ ] Dragging a marker moves it along its wall only, clamped to the wall length, snapped to 0.1 m, through `updateArtwork`
- [ ] Clicking a marker selects the artwork (`select({ kind: "artwork", id })`)
- [ ] Markers with a compile issue are shown in red
- [ ] Pure position math (wall side + offset → 2D segment) is unit-tested
## Files / modules in scope
`src/editor2d/ArtMarkers.tsx`, `src/editor2d/ArtMarkers.test.tsx`, `src/editor2d/Canvas.tsx` (only to mount the markers; added after T-023 merged)
## Out of scope
The object panel (T-042).
## Notes
- Read: plan.md §3.2–§3.3, §5.3 (offset direction per wall); architecture "As built: 2D editor" (one open PR at a time on Canvas.tsx).
## History
- 2026-10-10T11:00:20Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T11:02:40Z senior: Canvas.tsx (mount only) added to scope now that T-023 has merged
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
