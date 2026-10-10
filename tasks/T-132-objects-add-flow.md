---
id: T-132
title: Objects add flow - '+ Add' menu, place/drag/rotate in 2D, library + .glb upload (no AI)
status: draft
lane: frontend
assignee: builder-3
reviewer: reviewer
branch:
pr:
sprint: 4
depends_on: [T-124, T-125, T-128]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/object-add-flow.md
updated_by: senior
updated_at: 2026-10-10T19:59:34Z
---
## Goal
Creators add a free-standing object (from the library or their own .glb) and place it on the floor plan.
## Acceptance criteria
(Copied from the spec; the **AI photo path is OUT**, since the provider isn't approved. Library and 3D-file paths only.)
- [ ] Matches the mockups at 1440 and 390 (on mobile the panel stacks under the canvas, as in the mockup).
- [ ] "+ Add → Object → A 3D file": a `.glb` uploads with progress, a marker appears at the room centre, and the object shows in POV/Top-down.
- [ ] "Photo" path: the marker appears **immediately** in kraft and the status row shows progress. The editor stays fully usable while the job runs. Failure shows the two actions.
- [ ] The marker drags (snap 0.1 m) and rotates (snap 15°), with keyboard nudge/rotate/delete. Undo/redo covers all of it.
- [ ] The menu and radiogroup are fully keyboard operable with visible focus. Contrast is AA (kraft marker text/tag passes).
- [ ] Existing artwork add/edit, every `id`/`data-testid`, and the e2e tests are unchanged.

- [ ] Cut for now: .glb uploads go through a new `/api/upload/model` route (glTF magic-bytes check `glTF`, **max 4 MB**, served as `model/gltf-binary` + nosniff) instead of presigned PUT; the photo/AI option is hidden or shown as "coming soon".
- [ ] Gate: existing editor flows unchanged; editor + publish-view e2e green.
## Files / modules in scope
- src/components/AddMenu.tsx, src/panels/ObjectAddPanel.tsx, src/panels/FloorObjectPanel.tsx, src/editor2d/FloorObjects.tsx (new, + tests)
- src/panels/RoomPanel.tsx, src/editor2d/Canvas.tsx, src/app/edit/[id]/page.tsx (after T-124 merges)
- src/app/api/upload/model/route.ts (new, + test)
## Out of scope
- The AI provider, gltf-transform optimization, background removal (not approved), the object library assets.
## Build kit
- **Libraries:** none new.
- **Primitives:** `Button`, `Toggle`, `Slider`, `Input`, `Label`, `Tooltip` (exist, T-111). Extract `ChoiceCard` into `src/components/ui/` only if the designer approves (ask; designer owns `ui/*`).
- **Skills to load:** `pegasus-ui`, `emil-design-eng` (menu + kraft transition), `web-design-guidelines` before the PR.
- **References:**
  - the mockup HTML `mockups/objects/object-add-flow.html` (tokens and spacing)
  - `src/editor2d/ArtMarkers.tsx` (drag pattern)
  - `src/upload/UploadButton.tsx` (upload pattern)
  - `specs/objects-schema.md`
## Notes
- Assigned to builder-3 because Parth is idle. Queued after T-128 → T-125 → T-126.
## History
- 2026-10-10T19:59:34Z senior: carded; approved by Quang ("just 1-5", 16:00 EDT)
