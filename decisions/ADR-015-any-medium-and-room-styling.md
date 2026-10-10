# ADR-015: "Any Medium" (3D Objects, Floor Placement) and Curated Room Styling
Status: **proposed** (designer, 2026-10-10 ~13:22 EDT, submitted to senior for Quang's review).
**Senior (2026-10-10 14:58 EDT): DEFERRED until after the code freeze (today Sat Oct 10 18:00 EDT; submission Sun Oct 11 09:00 EDT); it is a schema change. To be listed as "next" in the submission. Quang can override.**

## Context
Vic's product bar for Galleriverse (Hacklanta 2026 Adobe Creative track) is that galleries feel like real exhibitions with diverse mediums—not just 2D pictures hanging on walls, but free-standing sculptures, 3D objects, tactile textures, and room typography. Today `Artwork.type` is frozen to `"image"`, and placement is strictly wall-bound `{ wall: Wall; offset: number; height: number }`. Furthermore, `Room` styling is limited to flat `wallColor`, `floor` presets, and lighting/atmosphere presets, lacking tactile wall textures and custom title typography.

With the submission deadline confirmed for **Sunday Oct 12 09:00 EDT** (code freeze Saturday Oct 11 18:00 EDT), we have a feasible implementation window to introduce lightweight, high-impact object mediums and curated room styles without inflating editor complexity.

## Decision

### 1. Expanded `Artwork.type` and Mediums
We extend `Artwork` to support free-standing exhibition objects:
```ts
export type ArtworkType = "image" | "sculpture" | "model";
```
- **Option A (Primary / Phase 1): Cutout Extruded Sculpture (`"sculpture"`):**
  - Creator uploads a transparent PNG (e.g. transparent cutout of a sculpture, ceramic, or physical craft).
  - Client-side Three.js generates an extruded silhouette geometry with front/back decals on an exhibition plinth (cylinder or cube stand).
  - Fully client-side, zero AI/cloud latency, zero new backend infrastructure.
- **Option B (Phase 2): Direct 3D Model (`"model"`):**
  - Creator uploads a `.glb` file (standard output from mobile 3D scan apps such as Polycam, Scaniverse, or Luma AI).
  - Loaded via `@react-three/drei`'s `useGLTF` (already in package.json).
  - Normalized to fit a bounding plinth (max 1.5 m dimension) to prevent scene scale explosions.

### 2. Dual Placement Schema (Wall vs Floor)
To maintain backward compatibility with existing saved galleries while supporting free-standing floor objects:
```ts
export type WallPlacement = {
  kind: "wall";
  wall: Wall;
  offset: number;
  height: number;
};

export type FloorPlacement = {
  kind: "floor";
  x: number; // relative room coordinate (0 to room.w)
  y: number; // relative room coordinate (0 to room.d)
  rotation?: number; // yaw rotation in degrees (0–360)
  plinthHeight?: number; // meters, default 0.8m
};

export type ArtworkPlacement = WallPlacement | FloorPlacement;
```
*Backward compatibility note:* For existing v1 documents where `kind` is omitted, the presence of `wall` defaults to `WallPlacement`.

### 3. Curated Room Styling (Fonts & Wall Textures)
Rather than arbitrary user font/texture uploads, rooms offer curated museum sets that stay lightweight and cohesive:
- **`Room.wallTexture?: "smooth" | "plaster" | "fine-concrete" | "brick"`**
  - Procedural / tileable low-overhead normal maps in the 3D renderer.
- **`Room.titleFont?: "archivo" | "serif" | "mono"`**
  - Applied to the room entry vinyl title and viewer HUD room announcements.
- **`Room.narration`:** Already present in schema as `{ text: string; audioUrl?: string }`. Exposed in the RoomPanel with audio recording or text readout.

## Alternatives Considered
- **AI Image-to-3D service (Tripo / Meshy / Trellis):** Rejected for core hackathon demo due to API cost, generation latency (30–90 seconds), failure rate, and network dependency during judging.
- **Full free-form 3D gizmos (XYZ translation & rotation):** Rejected because Galleriverse's core value proposition is "draw in 2D, experience in 3D." 3D objects are simply dragged as circular markers on the 2D plan and placed automatically on a plinth in 3D.
- **Arbitrary custom font uploads:** Rejected to prevent CSS layout shift and cross-origin CORS font failures.

## Consequences
- Requires Quang's schema approval (`src/lib/schema/types.ts` and `validate.ts`).
- `SceneModel` compiler (`src/lib/compile/`) passes floor objects into a new `objects[]` collection with 3D world coordinates.
- 2D Editor adds a circular draggable floor marker in `src/editor2d/`.
- 3D Renderer (`src/viewer3d/`) renders plinth + extruded shape / GLB model.
