---
id: T-074
title: "Viewer: 360° look-around (drag to look) while touring"
status: ready
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T14:16:07Z
---
## Goal
A visitor can look all the way around each room, not just at the fixed view. Requested by Quang, 2026-10-10. Features: F8 (tour feel).
## Acceptance criteria
- [ ] In the viewer (`mode="travel"`), click-dragging (mouse) or one-finger dragging (touch) rotates the view in place: **full 360° yaw**, pitch clamped to about ±60°. The camera position stays at the room's viewpoint
- [ ] Travelling to another room or focusing an artwork still eases as today (CameraRig). Look offsets reset smoothly to the new target, and dragging during a transition never jumps
- [ ] **A drag never counts as a click.** After a drag of more than ~5 px, the following click on a floor, doorway or artwork is ignored (no accidental travel or plaque). Plain clicks still work
- [ ] Optional: arrow keys rotate as well
- [ ] On-demand rendering is kept (redraw only while dragging/easing). The editor's orbit mode is unaffected
- [ ] Unit tests for the yaw/pitch math (wrap, clamp) and the drag-vs-click threshold. A browser check on the live link: look left, right and behind in each room; plain clicks still travel and open plaques
## Files / modules in scope
`src/viewer3d/LookControls.tsx`, `src/viewer3d/LookControls.test.ts`, `src/viewer3d/CameraRig.tsx`, `src/app/g/[id]/page.tsx` (only the drag-vs-click guard in its click handlers + mounting)
## Out of scope
`Scene.tsx`, `Floors.tsx` and `Frames.tsx` (open under T-071, builder-1). If you truly need them, send the senior a question first. WASD walking (P2).
## Notes
- **Lane exception, on purpose:** `src/viewer3d/` is normally builder-1's (ADR-005); Quang assigned this to builder-2.
- Read: ADR-002 (swappable camera), reference R4–R6 (eased camera, clamped delta), architecture "As built: renderer". CameraRig already owns the live pose.
## History
- 2026-10-10T14:15:49Z senior: created; requested and assigned to builder-2 by Quang (approved)
- 2026-10-10T14:16:07Z senior: status -> ready
