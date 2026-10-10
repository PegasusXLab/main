---
id: T-131
title: Objects render - plinths, cutout sculptures, GLB models in rooms (object-render spec)
status: ready
lane: frontend
assignee: builder-1   # + designer (components), see History
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-124, T-127, T-128]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/object-render.md
updated_by: senior
updated_at: 2026-10-10T19:59:47Z
---
## Goal
Free-standing objects appear in the 3D rooms (editor POV, Top-down and the visitor viewer).
## Acceptance criteria
(Copied from the spec.)
- [ ] A transparent PNG of a vase shows as a thick silhouette with the image on the front and back, sitting on a box plinth with a contact shadow.
- [ ] A Polycam-exported GLB (any scale or orientation) lands upright, at the requested height, centred on its plinth.
- [ ] A generated object shows the cut-out first, then cross-fades to the model when `job` flips to ready, with no camera jump and no flash.
- [ ] Clicking an object in the viewer faces it and opens the plaque. In Top-down it selects it.
- [ ] Performance: 10 objects (mixed) in the 3-room template keep ≥ 55 fps on a mid laptop while traveling.
- [ ] A broken `modelUrl` keeps the cut-out and doesn't crash the scene (own Suspense/ErrorBoundary per object, R2).

- [ ] Gate: galleries without objects render identically; publish-view + phone matrix e2e green; a green preview.
## Files / modules in scope
- src/viewer3d/Objects.tsx, Plinth.tsx, CutoutMesh.tsx, ModelMesh.tsx (new, + tests), Scene.tsx, TourView.tsx, CameraRig.tsx
## Out of scope
- The add flow/UI (T-132), the AI pipeline, postprocessing (not approved).
## Build kit
- **Libraries:** none new (drei `useGLTF`; three `ExtrudeGeometry`, meshopt decoder in `three/addons`).
- **Skills to load:** `pegasus-ui` §5; `emil-design-eng` (dissolve).
- **References:** `src/viewer3d/Frames.tsx` (lazy textures, placeholders), `specs/look-foundation.md` §7 (shadow quad), `specs/objects-schema.md` (SceneObject).
## Notes
- Queued: builder-1 after T-124; needs T-127 (builder-2) and T-128 merged.
## History
- 2026-10-10T19:59:34Z senior: carded; approved by Quang ("just 1-5", 16:00 EDT)
- 2026-10-10T19:59:47Z senior: status -> ready
- 2026-10-10T21:03:52Z senior: split to spread Vic's load (Quang). designer = the NEW render components (Objects.tsx, Plinth.tsx, CutoutMesh.tsx, ModelMesh.tsx + tests, using the T-127 materials); builder-1 = integration (Scene.tsx render <Objects/>, TourView plaque/focus for objects, CameraRig face-object). builder-1 imports the designer's components; agree the props interface first (SceneObject from T-128).
