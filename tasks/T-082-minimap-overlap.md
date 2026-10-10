---
id: T-082
title: "BUGFIX: the minimap hides the sound controls in the viewer"
status: in-review
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: builder-2
updated_at: 2026-10-10T16:15:13Z
---
## Goal
In the viewer, the minimap panel (top-right) covers the "Tap to start sound" / Mute button; only "Ta…" shows (seen on the live link). Visitors must be able to reach both.
## Acceptance criteria
- [ ] The minimap and the sound/Mute control never overlap, at desktop (1280×720) and on phones (iPhone and Pixel emulation, portrait and landscape). For example, move the minimap below the header controls or to the bottom-right, clear of the Prev/Next bar
- [ ] Both stay clickable/tappable. Minimap "Hide" still works
- [ ] A browser check with screenshots at desktop and phone sizes in the handoff
## Files / modules in scope
`src/viewer3d/Minimap.tsx`, `src/app/g/[id]/page.tsx` (layout/positioning only)
## Out of scope
`src/viewer3d/CameraRig.tsx` (T-081, builder-1).
## History
- 2026-10-10T16:10:29Z senior: created from a live check; approved by Quang
- 2026-10-10T16:10:36Z senior: status -> ready
- 2026-10-10T16:13:21Z builder-2: status -> in-progress
- 2026-10-10T16:15:13Z builder-2: status -> in-review
