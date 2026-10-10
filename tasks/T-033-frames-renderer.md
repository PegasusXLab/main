---
id: T-033
title: "3D frames: render artwork images on the walls"
status: in-review
lane: frontend
assignee: builder-1
reviewer: reviewer-2
branch: feat/T-033-frames-renderer
pr: 21
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: builder-1
updated_at: 2026-10-10T11:17:00Z
---
## Goal
Uploaded artwork appears on the right wall at the right spot in 3D (F3 done-criteria). Features: F3, F5.
## Acceptance criteria
- [ ] `<Frames frames={SceneModel.frames} onFrameClick? />` draws each frame as a textured plane at `position` / `rotationY`, size `width × height`, with a thin shared frame border
- [ ] Uses the **medium (1024 px)** image by default. Textures load lazily per frame, with a neutral placeholder until loaded and on error
- [ ] One shared geometry and material set for frame borders. Textures are disposed when a frame is removed or its URL changes
- [ ] Frames are clickable (`onFrameClick(artworkId)`). Raycasting stays off for borders
- [ ] Renders the two placeholder artworks in `sample-3room.json` on the correct walls
- [ ] Exported only; wiring into `Scene.tsx` is done in T-034 (which owns `Scene.tsx` this sprint)
## Files / modules in scope
`src/viewer3d/Frames.tsx`, its test
## Out of scope
The 2048 px swap on focus (T-034), plaque (T-035), `Scene.tsx` changes (T-034).
## Notes
- Read: plan.md §5.3, §7; architecture "As built: renderer"; reference R2, R10.
## History
- 2026-10-10T09:44:04Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T09:47:19Z senior: approved by Quang ("approve")
- 2026-10-10T09:47:36Z senior: status -> ready
- 2026-10-10T10:53:06Z senior: reviewer -> reviewer-2 (ADR-011)
- 2026-10-10T11:09:04Z builder-1: status -> in-progress
- 2026-10-10T11:17:00Z builder-1: status -> in-review
