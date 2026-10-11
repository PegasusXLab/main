---
spec: object-add-flow
brief: briefs/objects-and-look.md (part A)
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-2
depends_on: [objects-schema (store actions + selection kind "object"), object-pipeline (upload + generate endpoints; the flow can ship with the "3D file" + "library" paths first and stub "photo" behind a flag)]
files_in_scope:
  - src/components/AddMenu.tsx (new) + test
  - src/panels/ObjectAddPanel.tsx (new: the "What do you have?" step) + test
  - src/panels/FloorObjectPanel.tsx (new: edit a placed object) + test
  - src/panels/RoomPanel.tsx ("+ Add object" → opens AddMenu preset to Object)
  - src/editor2d/FloorObjects.tsx (new: markers, drag, rotate handle) + test
  - src/editor2d/Canvas.tsx (render FloorObjects layer)
  - src/app/edit/[id]/page.tsx (panel routing for selection kind "object")
  - src/upload/uploadModel.ts (new: presigned PUT client, progress)
mockups: [mockups/objects/object-add-flow-1440.png, mockups/objects/object-add-flow-390.png]
---
## What and why
Creators add anything that stands in a room without learning 3D: **one `+ Add` button, one question, and the object appears at once.** Generation never blocks them (see the progressive cut-out in the brief).

## Behavior and states
### `+ Add` menu (`AddMenu`)
- **Where:** a `Button variant="primary" size="sm"` "+ Add" at the top-right of the 2D canvas (absolute, 16 px inset). The existing RoomPanel "+ Add object" opens the same menu with Object pre-chosen.
- **Items:** **Picture** (P), **Object** (O), Sound (disabled, label "soon"), Text (disabled, "soon"). Picture runs today's artwork add (unchanged).
- **Keyboard:** the menu is a `role="menu"` with arrow keys, Enter and Esc. **P/O work as shortcuts when no input has focus.**
- **Target room:** the selected room, or the room of the selected artwork/object. With no selection, the menu items are disabled and a tooltip says "Select a room first".

### Object step (`ObjectAddPanel`): "What do you have?"
Three choice cards (radio group, `role="radiogroup"`). The selected card gets `--color-accent` border + `--color-accent-subtle` fill:
1. **A photo of it.** "We make it 3D in about a minute. You'll see a cut-out right away."
   - File picker: image types, ≤ 20 MB.
   - On pick: run `resizeImage` (existing) and upload as today. Then immediately `addObject({ kind: "model", origin: "generated", job: { status: "queued", fallback: { image, aspect } }, modelUrl: "" })` at the room centre, and call `POST /api/objects/generate`.
   - **The 2D marker is kraft** while the job isn't ready.
   - **Status row:** a thumbnail of the photo, "Making it 3D…", a progress bar (indeterminate until the provider reports progress) and an estimate ("~40 s left"), with the line "Showing the cut-out until it's ready. Keep working." The creator may leave the panel; the job continues and the marker updates.
   - **Failed:** the status row reads "Couldn't make a 3D version. The cut-out stays." Actions: *Try again* and *Keep cut-out*, which converts the source to `kind: "cutout"`.
2. **A 3D file.** ".glb up to 30 MB, e.g. from Polycam or Scaniverse"
   - Picker accepts `.glb`. Show upload progress, then server optimize ("Optimizing…"), then the marker appears.
   - Errors in plain words: too large, not a GLB, model has no geometry.
3. **Pick from the library.** "Plinths, benches, plants, lamps"
   - A 3-column grid of poster thumbnails (`OBJECT_LIBRARY`, filled by the library spec). Click to add.
   - Empty library: "The library is coming soon."

**Photo path without background removal (MVP):** if the cut-out model/licence decision isn't made yet, the photo path uses the photo as-is on a plinth (a framed "standee"). The copy stays the same.

### Placed object (`FloorObjectPanel`, selection kind `"object"`)
| Field | Control | Values |
|---|---|---|
| Height | `Slider` | 0.2–3.0 m, step 0.05 |
| Rotation | `Slider` | 0–345°, step 15, plus the canvas rotate handle |
| Plinth | segmented `Toggle` group | None · Box · Round |
| Plinth height | `Slider` (hidden when None) | 0.2–1.5 m, step 0.05 |
| Cut-out depth | `Slider` (cutout only) | 0.01–0.3 m |
| Title, Artist, Story | `Input` / textarea | as artwork |

- Above the fields: a source line ("3D from photo" / "3D file" / "Library: Bench"), plus *Replace…* (re-runs the add step) and *Delete* (`Button variant="danger"`, undoable).

### 2D markers (`FloorObjects`)
- **Footprint:** a square (Box/None plinth) or circle (Round), sized to the plinth footprint in metres (true scale). `--color-paper` fill, 1.5 px `--color-graphite` stroke. Kraft fill (`--color-kraft`) while a job is queued/running.
- **Selected:** a 2 px `--color-accent` outline with 3 px offset, a heading tick (shows rotation), and a **rotate handle** (12 px circle, accent stroke) 20 px off the corner. Plus the tape tag `0.80 m plinth · 45°` (+ `· making 3D…` while generating), in `--color-accent` with white text.
- **Drag:** move within the room with a 0.3 m margin, snap 0.1 m, Shift = no snap. Drag the rotate handle to snap to 15°.
- **Keyboard:** arrows nudge 0.1 m (Shift 0.5 m), `[` `]` rotate ±15°, Delete removes. Everything is undoable (T-076).
- Objects render above floors and below art markers. Clicking a marker selects it (R10 only for markers).

## Tokens used
`--color-paper`, `--color-graphite`, `--color-pencil`, `--color-hairline`, `--color-accent`, `--color-accent-subtle`, `--color-kraft`, `--color-danger`, `--radius-default`, `--font-display` (panel title), `--duration-fast`. SVG colours come from `THEME` (`src/lib/theme.ts`, add `kraft` there if missing).

## Motion
| Interaction | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|
| AddMenu open/close | opacity + translateY 4px | `--duration-fast` (120 ms) | ease-out | opacity only |
| Choice card select | border/background colour | 120 ms | ease-out | instant |
| Marker kraft → ready | fill colour | 400 ms | ease-out | instant |
| Drag/rotate | position/rotation | 1:1 with the pointer | — | — |

## Acceptance criteria (reviewer checks these)
- [ ] Matches the mockups at 1440 and 390 (on mobile the panel stacks under the canvas, as in the mockup).
- [ ] "+ Add → Object → A 3D file": a `.glb` uploads with progress, a marker appears at the room centre, and the object shows in POV/Top-down.
- [ ] "Photo" path: the marker appears **immediately** in kraft and the status row shows progress. The editor stays fully usable while the job runs. Failure shows the two actions.
- [ ] The marker drags (snap 0.1 m) and rotates (snap 15°), with keyboard nudge/rotate/delete. Undo/redo covers all of it.
- [ ] The menu and radiogroup are fully keyboard operable with visible focus. Contrast is AA (kraft marker text/tag passes).
- [ ] Existing artwork add/edit, every `id`/`data-testid`, and the e2e tests are unchanged.

## Build kit (the senior copies this into the card)
- **Libraries:** none new.
- **Primitives:** `Button`, `Toggle`, `Slider`, `Input`, `Label`, `Tooltip` (exist, T-111). Extract `ChoiceCard` into `src/components/ui/` only if the designer approves (ask; designer owns `ui/*`).
- **Skills to load:** `pegasus-ui`, `emil-design-eng` (menu + kraft transition), `web-design-guidelines` before the PR.
- **References:**
  - the mockup HTML `mockups/objects/object-add-flow.html` (tokens and spacing)
  - `src/editor2d/ArtMarkers.tsx` (drag pattern)
  - `src/upload/UploadButton.tsx` (upload pattern)
  - `specs/objects-schema.md`
