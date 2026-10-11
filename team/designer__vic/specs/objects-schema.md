---
spec: objects-schema
brief: briefs/objects-and-look.md (part A)
adr: decisions/ADR-015-any-medium-and-room-styling.md (this spec proposes its v2; the senior/Quang approve)
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-1
files_in_scope:
  - src/lib/schema/types.ts
  - src/lib/schema/validate.ts (+ validate.test.ts)
  - src/lib/schema/defaults.ts (newObject() factory)
  - src/lib/compile/types.ts
  - src/lib/compile/objects.ts (new) + objects.test.ts
  - src/lib/compile/compile.ts (wire the new stage)
  - src/store/gallery.ts (addObject / updateObject / removeObject actions + undo)
mockups: []
---
## What and why
This is the one schema change that unlocks objects, Looks and room styling, done **once** and **additively**, so no existing gallery, test, editor marker or frame path changes.

**ADR-015 v2: a design change from v1.** v1 rewrote `Artwork.placement` into a `wall | floor` union. That touches every consumer of wall art (2D markers, `frames.ts`, ObjectPanel, autosave, the published JSON) for no gain. v2 instead:
- **leaves `Artwork` (pictures on walls) exactly as it is**;
- adds a separate optional **`objects`** collection for anything that stands in the room;
- adds optional styling fields.

`version` stays `1`. Every new field is optional, so old documents validate unchanged.

## Schema (types.ts)
```ts
export interface Gallery {
  // …existing fields unchanged…
  objects?: GalleryObject[];            // free-standing exhibits (default [])
  look?: LookName;                      // gallery-wide Look (L3), default "museum"
}

export interface Room {
  // …existing fields unchanged…
  look?: LookName;                      // per-room override of gallery.look
  wallFinish?: "smooth" | "plaster" | "concrete" | "brick";   // default "smooth"
  titleFont?: "archivo" | "serif" | "mono";                   // room-arrival title + plaque
}

export type LookName = "museum" | "film" | "retro" | "noir" | "dream";

export interface GalleryObject {
  id: string;
  roomId: string;
  /** Room-relative floor position, meters from the room's top-left (same frame as the 2D plan). */
  position: { x: number; y: number };
  rotation: number;                     // degrees, 0–359, snapped to 15 in the UI
  height: number;                       // meters, the object's displayed height (its width follows its aspect)
  plinth: { shape: "none" | "cylinder" | "box"; height: number }; // default { "box", 0.8 }
  source: ObjectSource;
  title: string;
  artist: string;
  story: string;
  voiceOver?: { text: string; audioUrl?: string };
}

export type ObjectSource =
  | { kind: "cutout"; image: { small: string; medium: string; large?: string }; aspect: number; depth: number }
  | { kind: "model"; modelUrl: string; posterUrl?: string; origin: "upload" | "generated"; job?: GenerationJob }
  | { kind: "library"; libraryId: string };

export interface GenerationJob {
  id: string;                            // provider job id (opaque)
  status: "queued" | "running" | "ready" | "failed";
  /** The cutout shown until the model is ready (and kept if generation fails). */
  fallback: { image: { small: string; medium: string; large?: string }; aspect: number };
}
```
Notes:
- **A generating object is a `model` with a `job` and a `fallback` cutout.** The renderer shows the fallback until `job.status === "ready"` and `modelUrl` is set. The document is always renderable.
- A sound or text exhibit is **not** in this ADR. Room audio is T-123. Sound objects and wall text come in a later ADR if wanted.
- The 3D bounds a renderer may use: `height ≤ 4`, footprint ≤ 0.9 × the smaller room dimension (enforced by validate, see below).

## Validation (validate.ts)
- zod mirrors the types exactly (keep the `Equal<>` compile-time guard).
- Rules, each with a path and message like the existing ones:
  - `objects[i].roomId` exists;
  - ids are unique **across artworks and objects**;
  - `position` is inside the room with a 0.3 m margin;
  - `0 < height ≤ 4`;
  - `0 ≤ plinth.height ≤ 1.5`;
  - `rotation ∈ [0, 360)`;
  - `cutout.depth ∈ [0.01, 0.3]`;
  - URLs are non-empty strings;
  - `libraryId` is in `OBJECT_LIBRARY` (a const list, empty for now, filled by the library spec).
- `look`, `wallFinish` and `titleFont` must be literal unions.
- Missing `objects` validates. `normalize()` (or the store load) fills `objects ?? []`, so downstream code never null-checks.

## Defaults (defaults.ts)
`newObject(roomId, source, room)`:
- placed at the room centre;
- `rotation 0`, `height 1.0` (cutout and library) or `1.2` (model);
- `plinth { shape: "box", height: 0.8 }`;
- empty strings for title, artist and story.

## Compile (pure, ADR-004)
New stage `objects.ts` → `SceneModel.objects: SceneObject[]`:
```ts
export interface SceneObject {
  objectId: string;
  roomId: string;
  base: Vec3;            // world (room.x + x, plinthTop, room.y + y); y = plinth.height
  rotationY: number;     // radians
  height: number;
  plinth: { shape: "none" | "cylinder" | "box"; height: number; size: number }; // size = footprint (0.6 m default, ≥ object footprint + 0.1)
  render:
    | { kind: "cutout"; imageUrl: string; aspect: number; depth: number }
    | { kind: "model"; modelUrl: string }
    | { kind: "library"; libraryId: string };
  view: { position: Vec3; target: Vec3 };  // inspect spot: 1.6 m eye height, 1.8 m + height/2 in front of it, facing it
}
```
- A model with a non-ready job compiles to `render.kind = "cutout"` from `job.fallback`. The renderer never sees job state.
- `SceneModel.objects` is always present (`[]` when there are none). Existing compile output is otherwise byte-identical. Add a snapshot test on the 3-room fixture without objects to prove it.
- Doorway clearance: an object whose footprint overlaps a doorway's 1.2 m approach zone → `CompileIssue` warning (`"object blocks doorway"`), rendered anyway.

## Store (gallery.ts)
- `addObject(source, roomId)` returns the id and selects it.
- `updateObject(id, patch)` and `removeObject(id)`.
- `selection` gains `{ kind: "object", id }`.
- All three go through the undo/redo history (T-076) like artwork actions. Autosave includes `objects`.

## Acceptance criteria (reviewer checks these)
- [ ] Every existing fixture, autosave and published gallery validates and compiles exactly as before (snapshot test). No changes in `src/editor2d`, `src/panels` or `frames.ts`.
- [ ] Round-trip: a gallery with one cutout, one model (ready), one model (job running, with a fallback) and one library object validates, compiles (the generating object compiles as a cutout), autosaves and reloads.
- [ ] Every validation rule above has a failing-case test with the right `path`.
- [ ] Undo/redo covers add, move and delete of objects.
- [ ] The zod ↔ types `Equal<>` guard still compiles.

## Build kit (the senior copies this into the card)
- **Libraries:** none new (zod exists).
- **Skills to load:** `pegasus-ui` (for naming only). This card is data-layer work.
- **References:**
  - `src/lib/schema/validate.ts` (patterns and messages)
  - `src/lib/compile/frames.ts` (stage pattern and world coordinates)
  - `src/store/gallery.ts` (artwork actions and undo)
  - ADR-004 (pure compile), ADR-007 (SceneModel additions)

## Unblocks
`specs/object-add-flow.md` (builder-2), `specs/object-render.md` (builder-1), `specs/object-pipeline.md` (server), `specs/post-and-looks.md` (reads `look`).
