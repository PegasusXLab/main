---
id: T-013
title: "3D renderer: Scene, Floors, Walls, Lighting with an orbit camera"
status: draft
lane: frontend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-012]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T07:24:55Z
---
## Goal
Draw a SceneModel in the browser. Features: F5 (frames with images come in Sprint 2 with F3).
## Acceptance criteria
- [ ] `<Scene model={SceneModel} />` renders floors (color per floor preset), wall pieces (wall color), and one hemisphere + one directional light from the room's lighting preset object (T-003 defaults)
- [ ] Orbit camera for now (drag to orbit, scroll to zoom), in its own component so a CameraRig can replace it (ADR-002)
- [ ] Renders on demand only; pixel density capped at 1 below 1024 px wide (plan.md §7)
- [ ] Each room's wall pieces merged into one mesh; materials shared per color/preset; geometry and materials disposed when a room is removed
- [ ] Only floors are clickable (click behavior comes in Sprint 2)
- [ ] Renders `sample-3room.json` (through `compile`) with visible doorway gaps
- [ ] Reads only the SceneModel prop, never the store's gallery
## Files / modules in scope
`src/viewer3d/Scene.tsx`, `src/viewer3d/Floors.tsx`, `src/viewer3d/Walls.tsx`, `src/viewer3d/Lighting.tsx`
## Out of scope
Frames/images, CameraRig and fly-to, plaque, atmosphere blending, post-processing.
## Notes
- Assigned to builder-1 under the module split (Q1, ADR-005): builder-1 owns the compile → render pipeline.
- Read: plan.md §5, §7; plan/architecture.md §1, §3; ADR-002, ADR-004.
- Reference (plan/reference-basement.md): R1 render on demand + pixel-density cap; R2 one Suspense boundary per subsystem; R7 Lighting takes a preset object (Top idea 2); R10 clicks only on interactive meshes.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
