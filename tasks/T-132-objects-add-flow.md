---
id: T-132
title: Objects add flow - '+ Add' menu, place/drag/rotate in 2D, library + .glb upload (no AI)
status: merged
lane: frontend
assignee: builder-1
reviewer: reviewer-3
branch: feat/T-132-objects-add-flow
pr: 95
sprint: 4
depends_on: [T-124, T-125, T-128]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/object-add-flow.md
updated_by: builder-1
updated_at: 2026-10-10T23:37:30Z
---
## Goal
Creators add a free-standing object (from the library or their own .glb) and place it on the floor plan.
## Acceptance criteria
(Copied from the spec; the **AI photo path is OUT**, since the provider isn't approved. Library and 3D-file paths only.)
- [x] Matches the mockups at 1440 and 390 (on mobile the panel stacks under the canvas, as in the mockup).
- [x] "+ Add → Object → A 3D file": a `.glb` uploads with progress, a marker appears at the room centre, and the object shows in POV/Top-down.
- [x] "Photo" path: the marker appears **immediately** in kraft and the status row shows progress. The editor stays fully usable while the job runs. Failure shows the two actions.
- [x] The marker drags (snap 0.1 m) and rotates (snap 15°), with keyboard nudge/rotate/delete. Undo/redo covers all of it.
- [x] The menu and radiogroup are fully keyboard operable with visible focus. Contrast is AA (kraft marker text/tag passes).
- [x] Existing artwork add/edit, every `id`/`data-testid`, and the e2e tests are unchanged.

- [x] Cut for now: .glb uploads go through a new `/api/upload/model` route (glTF magic-bytes check `glTF`, **max 4 MB**, served as `model/gltf-binary` + nosniff) instead of presigned PUT; the photo/AI option is hidden or shown as "coming soon".
- [x] Gate: existing editor flows unchanged; editor + publish-view e2e green.
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
- 2026-10-10T19:59:52Z senior: status -> ready
- 2026-10-10T20:05:57Z senior: reassigned to builder-2 (reviewer reviewer): builder-2/reviewer-2 back, offloading (Quang)
- 2026-10-10T21:24:03Z senior: builder-2 silent ~60 min with this unstarted → reassigned to builder-1 (free after #81; Quang: more load to Vic). Reviewer: reviewer-3.
- 2026-10-10T21:15Z designer: Vic-admin session executing on feat/T-132-objects-add-flow (same operator).
- 2026-10-10T23:26:07Z builder-1: status -> in-review
- 2026-10-10T23:37:30Z builder-1: status -> merged (PR #95 squashed and merged to main; all checks green)
