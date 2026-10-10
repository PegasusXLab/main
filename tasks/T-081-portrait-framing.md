---
id: T-081
title: "Viewer on portrait phones: widen the view so artwork isn't cut off"
status: in-review
lane: frontend
assignee: builder-1
reviewer: reviewer-2
branch: feat/T-081-portrait-fov
pr: 51
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: builder-1
updated_at: 2026-10-10T16:03:02Z
---
## Goal
On a portrait phone (e.g. 390×844), the viewer shows only a narrow slice of the wall, so artwork near the sides is cut off. Phones are **view-only** (Quang: visitors tour on phones; creators build on desktop), so the viewer must frame rooms well on tall, narrow screens.
## Acceptance criteria
- [ ] When the canvas aspect is below 1 (portrait), CameraRig keeps a **minimum horizontal field of view** (about 70°) by raising the vertical fov, and/or steps the room viewpoint back, so a 6 m wall fits across the screen. Desktop/landscape framing is unchanged
- [ ] It updates on rotate/resize. Artwork focus still centers the frame with sensible margins on portrait
- [ ] Unit test for the fov-from-aspect math. A browser check with iPhone and Pixel emulation: the test gallery's artwork is fully on-screen in the Entrance
## Files / modules in scope
`src/viewer3d/CameraRig.tsx`, `src/viewer3d/CameraRig.test.ts`
## Out of scope
Any editor or phone-editing support (out of scope by design). The viewer page (T-075 open).
## History
- 2026-10-10T15:59:17Z senior: created + approved by Quang (found by the senior's iPhone/Pixel emulation check)
- 2026-10-10T15:59:22Z senior: status -> ready
- 2026-10-10T15:59:54Z builder-1: status -> in-progress
- 2026-10-10T16:03:02Z builder-1: status -> in-review
