# Pegasus: Plan

> Working title: **Pegasus** (product name TBD by the team)
> Track: Hacklanta 2026, Adobe Sponsored: Creative
> Status: Draft v2, handed to the Senior agent to refine into dev flows and tickets. Human approval needed before any ticket moves to `ready`.

---

## 1. Product overview

**One line:** A simple 2D floor-plan editor that compiles into a 3D gallery anyone can visit, so creators can build an immersive space for their art without coding or 3D skills.

**Problem:** Immersive portfolios like basement.studio's site need web-dev and 3D expertise. Creators who want a space like that for their art have no simple way to build one.

**Who it serves:**
- **Creators**: artists, photographers, students, small studios with no coding or 3D experience. They use the editor on a laptop or tablet.
- **Visitors**: anyone with a modern browser who opens a shared link.

**The core idea:** the creator only ever works in a simple 2D view (rooms as rectangles, artwork as markers on walls, properties in a side panel). The app **compiles** that 2D layout into a 3D space automatically. The editor is the product; the 3D gallery is what it produces.

| Creator (editor) | Visitor (viewer) |
|---|---|
| Draws rooms on a 2D floor plan | Opens a shared link, no account |
| Sets each room's name, size, colors, lighting | Clicks rooms and doorways to move through the gallery |
| Hangs artwork on walls with titles and stories | Clicks artwork to read its plaque |
| Toggles a live 3D preview at any time | |
| Publishes and gets a view link + secret edit link | |

**Track fit:** creators shape how each space feels, and visitors experience their work as a place, not a grid of thumbnails.

**Inspiration:** basement.studio's website and public repo (`basementstudio/website-2k25`) for the 3D side. See section 9 for how agents may use it.

---

## 2. Build principles

1. **Function first, UI later.** Plain forms, default Tailwind, no custom styling until the P0 flow works end to end.
2. **2D editor and compile step come first.** They're the heart of the product; everything else builds on them.
3. **One gallery document.** The 2D editor, 3D view, publishing and any AI features all read and write one JSON document (section 6). Schema changes go through the Senior.
4. **Compile is a pure function.** `compile(gallery) → SceneModel` is plain TypeScript with no Three.js inside, so it can be unit-tested and reused (section 5).
5. **Rectangles only.** Rooms are axis-aligned rectangles on a grid. Doorways are computed, not drawn.
6. **Click-to-travel for now.** Visitors click to move. First-person (WASD) controls may come later, so the camera code stays swappable.
7. **Clean, efficient code by default.** No special device targeting, but good graphics habits throughout (section 7) so the browser never feels slow.
8. **No accounts, no personal data.** View link + secret edit link.

---

## 3. Wireframes

Bare-bones layouts for function, not style. Based on the team's notebook sketches.

### 3.1 Start screen

```
+--------------------------------------------------------------+
|  PEGASUS                                                     |
|                                                              |
|   [ + New blank gallery ]                                    |
|                                                              |
|   Start from a template:                                     |
|   [ Single hall ]   [ 3-room journey ]                       |
|                                                              |
|   Have an edit link? Paste it: [______________] [Open]       |
+--------------------------------------------------------------+
```

### 3.2 Editor: 2D view (main workspace)

```
+----------------------------------------------------------------------------+
| Gallery: [My First Show______]      View: (•) 2D  ( ) 3D      [ Publish ]   |
+------------------------+---------------------------------------------------+
| PROPERTIES             |  . . . . . . . . . . . . . . . . . . . . . . . .  |
| (shows what's selected)|  . . . . . . . . . . . . . . . . . . . . . . . .  |
|                        |  . .+-----------[+]-----------+ . . . . . . . . .  |
| Room                   |  . .|  Entrance               | . . . . . . . . .  |
|  Name  [Entrance_____] |  . .|        ▮ ▮   (art on N)  |+-----[+]-----+ .  |
|  Desc  [____________]  |  . [+]                       ||  Blue Room  | .  |
|  Width [6.0] m         |  . .|                    ▮    ||             |[+]  |
|  Depth [6.0] m         |  . .|                  (art E)||  ▮          | .  |
|  Height[3.0] m         |  . .+-----------[+]---------◢-++-----[+]-----+ .  |
|  Wall  [■ #f2efe9]     |  . . . . . . . . . . . . . . . . . . . . . . . .  |
|  Floor [wood     v]    |  . . . . . . . . . . . . . . . . . . . . . . . .  |
|  Light [gallery  v]    |                                                   |
|  Music [none     v]    |  - Click empty space: add a room                  |
|                        |  - Drag room: move   - Drag edge/◢: resize        |
| Objects in room (3)    |  - [+] on an edge: add a room sharing that wall   |
|  ▮ Sunrise      [edit] |  - Shared walls get a doorway automatically       |
|  ▮ Portrait #2  [edit] |                                                   |
|  ▮ Untitled     [edit] |                                                   |
|  [ + Add object ]      |                                                   |
|                        |                                                   |
|  [ Delete room ]       | Zoom [-] 100% [+]   Grid: 0.5 m   Snap: on        |
+------------------------+---------------------------------------------------+
```

Panel by selection:
- **Nothing selected:** gallery title, entrance room, publish links.
- **Room selected:** room fields + object list (above).
- **Object selected:** object fields (3.3).

### 3.3 Object adder / object panel

```
+------------------------+
| ADD OBJECT             |
|  Type  [Image     v]   |   (P0: Image only)
|  File  [Choose file]   |
|        (preview thumb) |
|  Wall  (N) (E) (S) (W) |
|  Along wall  |----o--| 2.4 m
|  Height      |--o----| 1.6 m (center)
|  Width       [1.2] m   |
|  Title  [___________]  |
|  Artist [___________]  |
|  Story  [___________]  |
|         [___________]  |
|  [ Save ]  [ Cancel ]  |
+------------------------+
```

Artwork appears as a short thick tick (▮) on its wall in the 2D view and can be dragged along that wall.

### 3.4 Editor: 3D preview

```
+----------------------------------------------------------------------------+
| Gallery: [My First Show______]      View: ( ) 2D  (•) 3D      [ Publish ]   |
+------------------------+---------------------------------------------------+
| PROPERTIES             |                                                   |
| (same panel; edits     |        ___________________                        |
|  update the 3D live)   |       |   ▭     ▭         |  ← walls compiled      |
|                        |       |                   |     from the 2D plan   |
|                        |       |        ________   |                        |
|                        |       |       |doorway |  |                        |
|                        |  _____|_______|        |__|___                     |
|                        |                                                   |
|                        |  Drag: orbit   Scroll: zoom                       |
|                        |  Click a room: fly there   Click art: face it    |
+------------------------+---------------------------------------------------+
```

### 3.5 Viewer (shared link)

```
+----------------------------------------------------------------------------+
| My First Show                                                    [ Mute ]  |
|                                                                            |
|                       (full-screen 3D view)                                |
|                                                                            |
|                 +-------------------------------+                         |
|                 | Sunrise — Jane Doe            |   ← plaque (HTML)       |
|                 | Painted the morning after...  |     on artwork click    |
|                 |                     [ Close ] |                         |
|                 +-------------------------------+                         |
|                                                                            |
|            [ ◀ Previous room ]   Entrance   [ Next room ▶ ]               |
+----------------------------------------------------------------------------+
```

---

## 4. Features

### P0: Base features (must work end to end before anything else)

**F1. 2D floor-plan editor** *(highest priority)*
- SVG canvas with a 0.5 m grid; pan and zoom.
- Click empty space to add a room (default 6 × 6 m, snapped).
- Click to select; drag to move; drag edges/corners to resize (snapped, minimum 2 × 2 m).
- "+" on each side of a selected room adds a new room sharing that wall (same size along that side; refused if it would overlap).
- Delete selected room (also deletes its artwork).
- Rooms can't overlap; overlapping moves/resizes are rejected.
- Works with mouse and touch (laptop and iPad).
- *Done when:* a creator can build a 3-room layout with the mouse only, and the JSON updates live.

**F2. Properties panel (selection-based)**
- Room: name, description, width, depth, wall height, wall color, floor preset, lighting preset.
- Numbers and canvas stay in sync both ways.
- *Done when:* every field round-trips between panel, canvas and JSON.

**F3. Artwork objects**
- Add an image to the selected room: upload → resize in the browser (section 7) → choose wall, position along wall, center height, width; title, artist, story.
- Shown as a marker on its wall in 2D; drag along the wall to reposition.
- *Done when:* uploaded images appear on the right wall at the right spot in 3D.

**F4. Compile 2D → 3D** *(core; see section 5)*
- `compile(gallery) → SceneModel`: floors, wall segments with doorway gaps, artwork frame positions.
- Pure TypeScript, unit-tested, no Three.js inside.
- *Done when:* tests cover single room, two rooms sharing a full wall, two rooms with a partial overlap, an L-shaped three-room layout, and artwork on each wall direction.

**F5. 3D renderer**
- Renders a SceneModel with React Three Fiber: floors, walls, frames with images, lighting preset per room.
- Re-compiles when the gallery document changes; only changed rooms rebuild.
- Follows the graphics practices in section 7.
- *Done when:* edits in the 2D view show up in the 3D preview within a moment of switching or editing.

**F6. Editor 3D preview**
- 2D ↔ 3D toggle; side panel stays editable in 3D and updates the scene live.
- Orbit camera; click a room to fly there; click art to face it.

**F7. Save and publish**
- Autosave to localStorage while editing.
- Publish → server stores JSON + images → returns a **view link** (`/g/<id>`) and an **edit link** (`/edit/<id>?key=<secret>`).
- *Done when:* the view link works in another browser; saving edits requires the key.

**F8. Viewer**
- `/g/<id>`: 3D only, starts in the entrance room.
- Click a doorway or room to move; Previous/Next room buttons; click art → camera faces it → HTML plaque (title, artist, story); Esc closes.
- *Done when:* someone can tour the gallery without instructions.

### P1: The feel (after P0 works)
- **F9. Room audio:** per-room music, crossfade between rooms, mute, tap-to-start.
- **F10. Narration:** room narrator and artwork voice-overs from text (ElevenLabs), shown as captions.
- **F11. Atmosphere:** per-room presets (e.g. Gallery White, Neon Bunker, Golden Hour, Moonlit) + simple sliders (mood color, haze, brightness, light direction, grain); blends between rooms. Presets tuned with Leva during development.
- **F12. Mood prompt:** "Describe how this room should feel" → Gemini returns atmosphere values, music choice and narration text.
- **F13. Templates:** 2 starter floor plans.

### P2: Stretch / later
- AI curator Q&A per artwork; alt-text and story suggestions from the image
- Palette extraction from artwork to suggest room colors (computer vision)
- More object types: text plaques, video, neon text, light beams, 3D models on pedestals
- **First-person controls (WASD + mouse look)** as an optional viewer mode
- Minimap in the viewer; reduced-motion mode; effects toggle (bloom, particles)

### Out of scope for the hackathon
Non-rectangular rooms, multiple floors, physics/collisions, accounts/login, collaboration, analytics, payments, a 2D fallback viewer, phone-optimized editor.

---

## 5. How 2D compiles to 3D

This is the core technical piece. Split it into a **compile step** (pure data) and a **render step** (Three.js).

```
Gallery JSON  ──compile()──▶  SceneModel  ──<Scene/>──▶  Three.js meshes
(what the creator           (plain data:              (React Three Fiber)
 edits in 2D)                floors, wall segments,
                             doorways, frames)
```

### 5.1 Coordinate mapping

| 2D editor | 3D world |
|---|---|
| x (right), meters | x |
| y (down), meters | z |
| — | y (up) |
| 1 grid unit = 1 m | 1 unit = 1 m |
| North wall = top edge (min y) | wall at min z, facing +z (into the room) |

Room `{x, y, w, d, wallHeight}` → floor centered at `(x + w/2, 0, y + d/2)`, size `w × d`.

### 5.2 Walls and doorways

1. **Find shared edges.** For each pair of rooms, check if one room's side lies on the same line as another's opposite side (e.g. A's east edge `x = A.x + A.w` equals B's west edge `x = B.x`) and their ranges overlap. The overlap interval is the shared segment.
2. **Cut a doorway.** In each shared segment, cut an opening centered on the overlap: width = min(1.2 m, overlap length), height 2.2 m.
3. **Split walls into segments.** Each side of each room becomes its full length minus any doorway intervals → a list of solid wall pieces, plus a short piece above each doorway (from 2.2 m to wall height).
4. **No double walls.** Each room builds its walls inset by half the wall thickness (0.075 m of 0.15 m) inside its own rectangle. Shared walls are then two thin walls back to back, with no flickering overlap, and each room stays independent.
5. **Closed walls (P1).** If the creator closes a shared wall, skip step 2 for it.

### 5.3 Artwork placement

For artwork on wall `w` of a room, with `offset` (meters along the wall, from its left end as seen from inside the room) and `height` (center):

| Wall | Position (x, y, z) | Faces |
|---|---|---|
| N | (room.x + offset, height, room.y + inset) | +z |
| S | (room.x + room.w − offset, height, room.y + room.d − inset) | −z |
| W | (room.x + inset, height, room.y + room.d − offset) | +x |
| E | (room.x + room.w − inset, height, room.y + offset) | −x |

`inset` = half wall thickness + a few millimeters so the frame sits on the wall surface. Frame height = width × image aspect ratio. Validation rejects artwork that hangs past the wall's ends or overlaps a doorway.

### 5.4 SceneModel shape

```ts
interface SceneModel {
  floors: { roomId: string; center: [number, number, number]; size: [number, number] }[];
  walls:  { roomId: string; start: [number, number]; end: [number, number];   // x,z
            bottom: number; top: number; color: string }[];
  doorways: { roomIds: [string, string]; center: [number, number, number]; width: number }[];
  frames: { artworkId: string; roomId: string; position: [number, number, number];
            rotationY: number; width: number; height: number; imageUrl: string }[];
  rooms:  { roomId: string; center: [number, number, number]; lighting: string }[];
}
```

The renderer only reads SceneModel. Camera targets (fly to room, face artwork) also come from it, so swapping click-to-travel for first-person later doesn't touch the compile step.

---

## 6. Data model (frozen after approval)

```ts
type Wall = "n" | "e" | "s" | "w";

interface Gallery {
  id: string;
  version: 1;
  title: string;
  entranceRoomId: string;
  rooms: Room[];
  artworks: Artwork[];
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  x: number; y: number;          // top-left, meters, grid-snapped
  w: number; d: number;          // width (x), depth (y), meters
  wallHeight: number;            // meters, default 3
  wallColor: string;             // hex
  floor: "wood" | "concrete" | "marble";
  lighting: "gallery" | "warm" | "moody";
  closedWalls?: Wall[];                                  // P1
  music?: { trackId?: string; url?: string };            // P1
  narration?: { text: string; audioUrl?: string };       // P1
  atmosphere?: Atmosphere;                               // P1
  mood?: string;                                         // P1
}

interface Artwork {
  id: string;
  roomId: string;
  type: "image";                 // more types in P2
  placement: { wall: Wall; offset: number; height: number };
  width: number;                 // meters; height from image aspect ratio
  aspect: number;                // height / width of the image
  image: { small: string; medium: string; large?: string }; // URLs: 512 / 1024 / 2048 px
  title: string;
  artist: string;
  story: string;
  voiceOver?: { text: string; audioUrl?: string };       // P1
}

interface Atmosphere {           // P1
  preset: "gallery-white" | "neon-bunker" | "golden-hour" | "moonlit" | "custom";
  moodColor: string;
  haze: number;                  // 0–1
  brightness: number;            // 0–1
  lightDirection: number;        // 0–360
  grain: number;                 // 0–1
}
```

Derived (never stored): shared edges, doorways, wall segments, frame positions.

---

## 7. Graphics practices (baseline for clean, fast code)

Not targets to chase, just habits so the 3D never drags in the browser:

- **Render on demand:** `frameloop="demand"`; render when the camera moves or the scene changes.
- **Right-sized images:** uploads are resized in the browser to 512 / 1024 / 2048 px WebP. Show the 1024 px version by default and the 2048 px one only when a visitor focuses the artwork.
- **Load what's near:** textures for the current room and its neighbors; release (`dispose()`) textures and geometry that are removed or far away.
- **Fewer, shared objects:** merge each room's wall pieces into one mesh; one shared geometry/material per frame style; reuse floor materials across rooms.
- **Light textures for surfaces:** floors and walls are a color plus at most one small tileable texture (512 px), not full material sets.
- **Few lights:** one ambient/hemisphere light plus one directional light per room preset; no real-time shadows in P0.
- **Effects are opt-in:** bloom, particles, grain only in P1/P2 and switchable off.
- **Recompile per room:** memoize compile output per room so editing one room doesn't rebuild the whole gallery.
- **Check with `r3f-perf`** during development (dev only).

---

## 8. Architecture

**Stack:** Next.js (App Router) + TypeScript + Tailwind · `three` + `@react-three/fiber` + `@react-three/drei` · `zustand` · `@use-gesture/react` · `leva` and `r3f-perf` (dev only) · `howler` (P1).

**Modules (one owner each to avoid file overlap; the Senior may reassign):**

```
src/
  lib/schema/      types.ts, defaults.ts, validate.ts               (builder-1)
  lib/compile/     edges.ts, doorways.ts, walls.ts, frames.ts,
                   compile.ts + tests                               (builder-1)
  store/           gallery.ts (zustand: document, selection, actions) (builder-1)
  editor2d/        Canvas, Grid, RoomShape, ResizeHandles,
                   AddRoomButtons, ArtMarker, snapping, overlap     (builder-2)
  panels/          GalleryPanel, RoomPanel, ObjectPanel             (builder-2)
  upload/          resizeImage.ts, UploadButton                     (builder-2)
  viewer3d/        Scene, Floors, Walls, Frames, Lighting,
                   CameraRig (click-to-travel), Plaque              (builder-1)
  app/
    page.tsx              start screen
    edit/[id]/page.tsx    editor (2D + 3D toggle)
    g/[id]/page.tsx       viewer
    api/galleries/        POST create, GET read, PUT update (edit key)
    api/upload/           POST image
```

**Storage:** gallery JSON + images on the server; edit key stored as a hash. No user records.

---

## 9. Using the Basement repo as reference

Agents may read `github.com/basementstudio/website-2k25` to learn from its 3D side. Things worth studying:
- How the React Three Fiber scene is structured (components, loading, state with zustand)
- Camera transitions between areas
- Lighting, fog and material choices that give the stylized look cheaply
- How assets are loaded and organized

Rules:
- **Inspiration only.** The repo has no license file we could find, which means all rights reserved by default. Don't copy code, shaders, models, textures or fonts.
- Write findings to `plan/reference-basement.md` on the docs branch (patterns, not pasted code).
- List it as inspiration in the README's disclosure section.

---

## 10. Suggested sprints (the Senior refines these into dev flows and tickets)

| Sprint | Hours | Goal | Checkpoint |
|---|---|---|---|
| 0: Foundation | 0–2 | Plan approved, schema frozen, app scaffolded, CI green, Basement reference notes (time-boxed 1 h) | Hardcoded 3-room sample JSON exists |
| 1: Editor + compile | 2–12 | 2D editor (F1, F2) and compile step with tests (F4); renderer draws the sample JSON (F5) | Build 3 rooms in 2D → toggle → see them in 3D |
| 2: Content + publish | 12–20 | Artwork objects (F3), 3D preview interactions (F6), save/publish (F7), viewer (F8) | P0 complete on the deployed link; record a backup demo video |
| 3: The feel | 20–28 | P1 features in priority order: atmosphere, audio, narration, mood prompt, templates | Each room looks and sounds distinct |
| 4: Freeze + demo | 28–36 | Bug fixes only, seeded demo gallery, README, video, submission | Tagged `v1.0-hacklanta` |

Parallel lanes in Sprint 1: builder-2 builds the editor against the store; builder-1 builds compile + renderer against the hardcoded sample JSON. They meet at the store and schema, which is why those are frozen first.

---

## 11. MVP acceptance (the demo must show this)

1. A creator starts from blank, builds 3 connected rooms in the 2D editor, and customizes each.
2. They hang at least 2 artworks with stories.
3. They toggle to 3D and see their layout compiled, with doorways between rooms.
4. They publish; a visitor opens the view link elsewhere, clicks through the rooms and opens plaques.
5. (P1) Rooms have distinct atmosphere and sound.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| Editor drag/resize takes longer than planned | Number inputs in the panel first, drag second; both write the same JSON |
| Doorway/wall geometry bugs | Compile is pure and unit-tested before the renderer depends on it |
| 3D looks plain | Sprint 3 is reserved for atmosphere; presets tuned with Leva |
| Sponsor APIs slow during the demo | Pre-generate demo narration; cache responses; captions as fallback |
| Builders editing the same files | Module ownership (section 8); schema changes only via the Senior |

---

## 13. Open decisions for the humans

- [ ] Product name
- [ ] Side challenges (candidates: Gemini, ElevenLabs, Zero Data, Vultr, GoDaddy domain)
- [ ] Hosting target
- [ ] Official roster (max 4)
- [ ] Hacking period start/end → freeze time
- [ ] Demo artwork source (team's own or with permission)
