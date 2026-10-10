# ADR-007: SceneModel additions and doorway rules
Status: **accepted** (Quang, Q6 + Q7 + Q12, 2026-10-10).
## Context
plan.md §5.4's SceneModel didn't say where walls sit or how thick they are, gave doorways no height, and offered no usable camera spot per room. plan.md §5.2 produced unusable doorways on tiny overlaps (overview G1–G3, S1–S3). The stored Gallery schema (plan.md §6) is **not** changed.
## Decision
Additions to the SceneModel (derived data only):
- `walls[]`: `side: Wall` and `thickness: number` (0.075). `start` / `end` are points on the room-edge line (x, z); the wall extends `thickness` into the room.
- `doorways[]`: `height: number` (2.2) and `side: Wall` (as seen from `roomIds[0]`).
- `rooms[]`: `view: { position: [x,y,z]; target: [x,y,z] }`, eye height 1.6 m, standing back from one wall and looking at the room center. Used by CameraRig (ADR-002).

Rules:
- A doorway is cut only where the shared overlap is **≥ 1.0 m** (Q7). Shorter overlaps stay solid walls, and the editor marks the edge "too short for a door".
- Artwork frames sit 0.08 m from the room edge (wall surface 0.075 + 5 mm).
- Previous / Next room order (Q8): breadth-first from the entrance through doorways, ties broken by document order, unconnected rooms appended last. Computed from SceneModel by the viewer.
## Alternatives considered
- Keeping §5.4 as written: the renderer would have to re-derive sides and thickness, and the camera would park inside walls.
- Always cutting a doorway, whatever the overlap: confusing slivers.
## Consequences
T-010 to T-012 implement this. The renderer and camera never read the Gallery. plan/architecture.md §3 is the reference.
## Amendment 1 (senior, 2026-10-10, answering builder-1 on T-012)
- `floors[]` also carries `floor: Room["floor"]` (the floor preset). The renderer reads only SceneModel, and T-013 colors floors per preset, so this was missing from plan.md §5.4. Derived data only; the Gallery schema is unchanged.
- `doorways[].center` y = `height / 2` (middle of the opening), which is used for the clickable doorway box (reference R10).
- `rooms[].view`: eye height 1.6 m, standing `min(1 m, d/4)` in from the south wall, looking at the room center.
These refine ADR-007 within its intent, so no new approval is needed.
## Amendment 2 (senior, 2026-10-10T11:41:36Z, answering builder-1 on T-034)
- `frames[]` also carries `largeImageUrl?: string` (the 2048 px image, when the artwork has one), so CameraRig can swap to it on focus (plan.md §7) while still reading only SceneModel (ADR-004). `imageUrl` stays the medium (1024 px) image.
