---
spec: any-medium-3d-objects
brief: briefs/install-day.md
adr: decisions/ADR-015-any-medium-and-room-styling.md
status: ready-for-cards
suggested_assignee: designer / builder-1 / builder-2
files_in_scope:
  - src/lib/schema/types.ts
  - src/lib/schema/validate.ts
  - src/lib/compile/types.ts
  - src/lib/compile/assemble.ts
  - src/lib/compile/objects.ts
  - src/editor2d/FloorObjectMarker.tsx
  - src/editor2d/EditorCanvas.tsx
  - src/panels/ObjectPanel.tsx
  - src/panels/RoomPanel.tsx
  - src/viewer3d/ObjectRenderer.tsx
  - src/viewer3d/Plinth.tsx
  - src/viewer3d/Scene.tsx
---

## What and Why
Galleriverse galleries must feel like real exhibitions with diverse mediums—not just 2D pictures hanging on walls, but free-standing sculptures, 3D craft objects, tactile textures, and room typography.

This specification operationalizes **ADR-015**, extending `Artwork` to support free-standing exhibition objects ("sculpture" and "model") with floor placement, plinths, and curated room styling (wall textures, typography).

---

## 1. Schema Extensions (`src/lib/schema/types.ts` & `validate.ts`)

### Artwork Type
```ts
export type ArtworkType = "image" | "sculpture" | "model";
```

### Placements (Wall vs Floor)
```ts
export type Wall = "n" | "e" | "s" | "w";

export interface WallPlacement {
  kind: "wall";
  wall: Wall;
  offset: number; // meters from left of wall
  height: number; // meters above floor
}

export interface FloorPlacement {
  kind: "floor";
  x: number; // meters relative to room top-left (0 to room.w)
  y: number; // meters relative to room top-left (0 to room.d)
  rotation: number; // degrees 0-360, default 0
  plinthHeight: number; // meters, default 0.8
  plinthShape?: "cylinder" | "box"; // default "cylinder"
}

export type ArtworkPlacement = WallPlacement | FloorPlacement;
```

### Upgraded `Artwork` Interface
```ts
export interface Artwork {
  id: string;
  roomId: string;
  type: ArtworkType; // "image" | "sculpture" | "model"
  placement: ArtworkPlacement;
  width: number; // meters
  aspect: number; // height / width
  image: { small: string; medium: string; large?: string };
  modelUrl?: string; // Optional .glb URL when type === "model"
  title: string;
  artist: string;
  story: string;
  voiceOver?: { text: string; audioUrl?: string };
}
```

### Backward Compatibility Guard
For documents where `placement.kind` is missing, `validate.ts` normalizes `{ wall, offset, height }` into `{ kind: "wall", wall, offset, height }`.

### Curated Room Styling
In `Room`:
```ts
export interface Room {
  // Existing fields...
  wallTexture?: "smooth" | "plaster" | "fine-concrete" | "brick";
  titleFont?: "archivo" | "serif" | "mono";
}
```

---

## 2. Compilation Pipeline (`src/lib/compile/`)

### New Compiler Stage: `objects.ts`
Produces `SceneFloorObject` items in `SceneModel`:
```ts
export interface SceneFloorObject {
  artworkId: string;
  roomId: string;
  type: "sculpture" | "model";
  position: [number, number, number]; // [worldX, plinthHeight, worldZ]
  rotationY: number; // radians
  plinth: {
    shape: "cylinder" | "box";
    height: number;
    radius: number; // e.g. 0.35m
    color: string; // default graphite or plaster
  };
  dimensions: {
    width: number;
    height: number;
  };
  imageUrl?: string;
  modelUrl?: string;
}
```

### World Coordinates
```ts
const worldX = room.x + placement.x;
const worldZ = room.y + placement.y;
const worldY = placement.plinthHeight;
```

---

## 3. 2D Plan Editor (`src/editor2d/`)

### Visual Floor Marker
- Rendered as an SVG group centered at `(room.x + placement.x, room.y + placement.y)`.
- **Resting state:**
  - Plinth footprint: dashed circle or rounded rect with `stroke-[var(--color-hairline)]`, `fill-[var(--color-paper)]/80`.
  - Icon or symbol representing medium (sculpture icon or dot).
- **Selected state:**
  - Ring in Klein blue (`stroke-[var(--color-accent)]`, `stroke-width: 2px`).
  - Heading pointer / notch indicating `rotation`.
  - Tape tag readout: `"FLOOR · 1.80m x 2.20m · rot 45°"`.
- **Drag Interaction:**
  - Draggable within `[0.5, room.w - 0.5]` and `[0.5, room.d - 0.5]` with 0.1m snap.

---

## 4. Object Panel UI (`src/panels/ObjectPanel.tsx`)

### Medium Selector
- Segmented button: `[ Image | Sculpture | 3D Model ]`.
- When `Image`:
  - Placement: Wall (default).
  - Image upload with standard aspect ratio.
- When `Sculpture`:
  - Placement: Floor.
  - Transparent PNG upload.
  - Plinth height slider (0.4m – 1.4m, step 0.1m, default 0.8m).
  - Rotation slider (0° – 360°, step 15°).
- When `3D Model`:
  - Placement: Floor.
  - `.glb` file picker.
  - Plinth height & rotation controls.

---

## 5. 3D Viewer & Renderer (`src/viewer3d/`)

### 1. Plinth Component (`Plinth.tsx`)
- Cylinder geometry (`radius: 0.35m`, `height: plinthHeight`) or box geometry (`0.6m x plinthHeight x 0.6m`).
- Neutral matte museum finish (subtle plaster or dark basalt).

### 2. Sculpture (`CutoutSculpture.tsx`)
- Double-sided transparent PNG material or extruded silhouette.
- Centered on top of the plinth.
- Casts shadow on floor/plinth.
- Interactive click triggers plaque (same as wall artwork).

### 3. Model (`ModelObject.tsx`)
- Loads GLTF using `@react-three/drei`'s `useGLTF`.
- Auto-scales model bounding box so max dimension ≤ 1.2m.
- Centers on top of the plinth.
- Interactive click triggers plaque.

---

## 6. Acceptance Criteria
1. Schema parses existing galleries without validation errors (100% backward compatible).
2. Creators can upload a transparent PNG sculpture or place an object in the room center on 2D plan.
3. 2D plan displays draggable circular plinth marker.
4. 3D viewer renders plinth and displays the sculpture in room space with inspect and plaque support.
5. All e2e tests continue to pass.
