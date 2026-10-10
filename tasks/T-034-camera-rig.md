---
id: T-034
title: "CameraRig: fly to a room, face an artwork, orbit in the editor"
status: ready
lane: frontend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: [T-033]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T09:47:40Z
---
## Goal
Smooth click-to-travel (ADR-002): click a floor to fly to that room, click art to face it. The editor keeps orbit. Features: F6, F8.
## Acceptance criteria
- [ ] `CameraRig` with modes `"orbit"` (editor preview) and `"travel"` (viewer). It replaces the current orbit-only camera in `Scene.tsx`
- [ ] Targets come only from the SceneModel: room → `rooms[].view`; artwork → a point about 1.8 m in front of the frame, from its position and rotation, at the frame's center height, looking at it
- [ ] Transitions ease position, target and fov together over about 1 s (ease-in-out cubic), starting from the **live** pose so interruptions never jump. The frame delta is clamped (R4, R6). Redraws are requested only while moving (on-demand rendering)
- [ ] `Scene.tsx`: wires `<Frames>` from T-033 and new props `mode`, `currentRoomId`, `focusArtworkId?`, `onFrameClick?`, keeping `onFloorClick`. Existing props keep working for T-025
- [ ] When an artwork is focused, its frame switches to the 2048 px image if one exists (plan.md §7)
- [ ] A "camera is moving" flag, if stored anywhere, never notifies when unchanged (R11)
## Files / modules in scope
`src/viewer3d/CameraRig.tsx`, `src/viewer3d/Scene.tsx`, `src/viewer3d/CameraRig.test.ts`
## Out of scope
WASD / first-person (P2). Plaque and Prev/Next UI (T-035). Atmosphere blending (F11).
## Notes
- Read: ADR-002, ADR-007 (+ amendment 1); reference R4, R5, R6, R11 (plan/reference-basement.md); architecture "As built: renderer".
- `Scene.tsx` is used by builder-2's T-025 page. Keep its existing props backward compatible.
## History
- 2026-10-10T09:44:04Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T09:47:19Z senior: approved by Quang ("approve")
- 2026-10-10T09:47:40Z senior: status -> ready
