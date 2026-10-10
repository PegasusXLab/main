# Reference: basement.studio website-2k25

Owner: senior (approved by Quang, Q2, 2026-10-10). Policy: ADR-003 and AGENTS.md "Reference repo". Pattern IDs (R1–R13) are cited from task cards.

Studied read-only at **`basementstudio/website-2k25 @ 70d274e3638a20d53246896177e6ed24915c7662`**, 2026-10-10. The repo has no license, so these are patterns only: no code, shaders, models, textures or fonts copied. Their scene is hand-built in Blender with baked lighting. Ours is generated from a 2D plan, so anything that depends on baked maps or hand-placed meshes is rejected or adapted.

### R1. Render only when something changes
- Source: `src/components/scene/index.tsx`
- What they do / Why it works: the canvas uses on-demand rendering. Pixel density is capped at 1 below 1024 px wide, and 1–2 above. Antialiasing is off. The GPU idles when nothing moves, and small screens skip retina cost.
- Decision: **ADOPT**
- How we'd do it: same settings in our Scene. Camera moves and store changes trigger a redraw.
- Feeds: F5, F8, plan.md §7

### R2. One Suspense boundary per subsystem
- Source: `src/components/scene/index.tsx`
- What they do / Why it works: each part of the scene (map, camera, inspectables, effects) is wrapped in its own Suspense boundary, and heavy optional parts load lazily. One slow asset doesn't blank the whole scene.
- Decision: **ADOPT**
- How we'd do it: separate boundaries for Floors+Walls (instant, no assets), Frames (image textures) and Lighting/atmosphere.
- Feeds: F5

### R3. Load the world, then process it in small steps
- Source: `src/components/map/index.tsx`, `src/components/map/use-loader.ts`, `src/components/map/bakes.tsx`
- What they do / Why it works: they load several compressed GLTF files with baked lightmaps, then swap materials one scene graph at a time, yielding between steps so no single long task freezes the page.
- Decision: **REJECT** the GLTF + baked-lightmap pipeline (we have no authored models; lighting is per-room presets). **ADAPT** the yielding idea.
- How we'd do it: build wall and floor geometry from SceneModel. If a gallery has many artworks, load frame textures room by room (current room first, then neighbors), never all at once.
- Feeds: F5, plan.md §7 "load what's near"

### R4. A saved camera spot per area, eased transitions
- Source: `src/components/camera/camera-hooks.tsx`, `camera-utils.ts`, `src/components/navigation-handler/navigation-store.ts`
- What they do / Why it works: each area has a camera config (position, look-at target, field of view). On change they record the camera's current position and look-at, then ease all three to the new config over about 1 s with an ease-in-out-cubic curve. Starting from the live pose means an interrupted move never jumps. There's also a flag to skip the animation (instant jump) and a store flag "camera is moving".
- Decision: **ADAPT**
- How we'd do it: our camera spots are **computed by compile** (`rooms[].view`, ADR-007), not hand-placed. For artwork, the spot is a point in front of the frame, derived from its position and rotation. CameraRig eases position, target and fov together, about 1 s, from the live pose. The viewer's Prev/Next buttons and click-to-room both just set the target room.
- Feeds: F6, F8

### R5. The camera controller is a switch between modes
- Source: `src/components/camera/camera-controller.tsx`, `wasd-controls.tsx`
- What they do / Why it works: one small component picks between the normal guided camera and a WASD fly mode based on a flag. Neither mode knows about the other.
- Decision: **ADOPT**
- How we'd do it: CameraRig picks "orbit" (editor preview) or "travel" (viewer) now, and "first-person" later (P2), without touching compile (plan.md §2.6, ADR-002).
- Feeds: F6, F8, P2 first-person

### R6. Clamp the frame time
- Source: `src/hooks/use-pausable-time.ts`
- What they do / Why it works: all per-frame animation goes through one hook that caps the time step at 1/15 s, skips when the GL context is lost, and pauses when an overlay is open. A tab switch or a stall never makes an animation leap.
- Decision: **ADOPT**
- How we'd do it: a tiny shared frame hook for camera easing and atmosphere blends.
- Feeds: F6, F8, F11

### R7. Per-area look presets that blend on change
- Source: `src/components/postprocessing/post-processing.tsx`, `use-postprocessing-settings.tsx`
- What they do / Why it works: each area stores contrast, brightness, exposure, gamma, vignette and bloom values. When the area changes, every value animates to the new preset, so moving between areas *feels* different without new geometry.
- Decision: **ADAPT**
- How we'd do it: this is our F11 atmosphere almost exactly. Per-room presets (Gallery White, Neon Bunker, Golden Hour, Moonlit) as plain numbers: light color and intensity, fog color and density, background, and later vignette and grain. They blend when the camera's current room changes. Start with three.js's built-in fog and lights; add a post-processing pass only in P1 and only if needed. T-013's Lighting should take a preset object, not hard-coded values, so F11 slots in.
- Feeds: F5 (lighting presets), F11

### R8. One custom global shader for every surface
- Source: `src/shaders/material-global-shader/` (uniform names only reviewed)
- What they do / Why it works: every mesh gets the same custom material with lightmap, AO, fog, matcap and fade controls. One place controls the whole look.
- Decision: **REJECT** for P0/P1
- How we'd do it: custom shaders cost time we don't have, and copying theirs isn't allowed. We use standard three.js materials with shared instances (plan.md §7). The "single place controls the look" idea survives as R7's preset object.
- Feeds: —

### R9. Custom render pipeline with half-resolution bloom
- Source: `src/components/postprocessing/renderer.tsx`, `bloom-pass.tsx`
- What they do / Why it works: they render to their own targets and run bloom at half resolution, so the effect stays cheap.
- Decision: **REJECT** for P0. **ADAPT** for P1.
- How we'd do it: if F11 needs bloom or grain, use an off-the-shelf post-processing library behind an on/off switch (plan.md §7 "effects are opt-in").
- Feeds: F11, P2 effects toggle

### R10. Only interactive meshes respond to clicks
- Source: `src/components/map/index.tsx`
- What they do / Why it works: almost every mesh has click testing turned off. Only the few clickable ones are tested, so pointer hits are cheap and never land on the wrong object.
- Decision: **ADOPT**
- How we'd do it: floors (click a room) and frames (click art) are clickable. Wall pieces are not. Doorways get one invisible clickable box each, for click-to-travel through them.
- Feeds: F6, F8

### R11. Small stores, field-level subscriptions
- Source: `src/components/navigation-handler/navigation-store.ts`, `src/components/scene/index.tsx`
- What they do / Why it works: zustand stores split by concern. Components subscribe to single fields; their own comments note that subscribing to the whole store re-rendered the entire canvas. Setters called every frame bail out when the value hasn't changed.
- Decision: **ADOPT**
- How we'd do it: the store contract (§4) plus a rule in every card: subscribe per field. Any value written per frame (e.g. "camera is moving") must not notify subscribers when unchanged.
- Feeds: F2, F5, F6, all UI cards

### R12. "Inspect" mode fades the rest of the scene
- Source: `src/components/inspectables/`, `src/components/map/use-frame-loop.ts`
- What they do / Why it works: when an object is inspected, a fade value is pushed to all materials so the rest of the room dims and attention goes to the object.
- Decision: **ADAPT**
- How we'd do it: when the plaque opens, dim the room lights and atmosphere preset slightly and ease the camera to the frame. No shader changes; it's a temporary preset blend (R7).
- Feeds: F8

### R13. Agent setup
- Source: `AGENTS.md`, `CLAUDE.md`, `.claude/skills/frontend-design`
- What they do / Why it works: `CLAUDE.md` only imports `AGENTS.md`. `AGENTS.md` is a list of hard-won, project-specific gotchas, each with the reason and an explicit "don't fix it back". It also warns that their framework version differs from what models know, so agents must read the installed docs. They keep one design skill.
- Decision: **ADOPT**
- How we'd do it:
  - Our pending `CLAUDE.md` on main should be just `@AGENTS.md` (devops, T-002).
  - Add a "Gotchas" section to AGENTS.md that the senior maintains. Builders send gotchas as `fyi` to the senior.
  - Pin exact framework versions in `stack.md` at scaffold time, and tell agents to check installed docs rather than memory.
- Feeds: process, sprint 0

### Top 3 ideas for Pegasus
1. **Compile-generated camera spots + eased transitions** (R4, R5, R6). Compile emits `rooms[].view`, and CameraRig eases from the live pose. Influences **T-012** (emit views, ADR-007), **T-013** (camera kept swappable, builder-1), and the Sprint 2 CameraRig card (F6/F8).
2. **Per-room atmosphere presets that blend on room change** (R7, R12). Influences **T-013** (Lighting takes a preset object), **T-003** (defaults per lighting preset), and the Sprint 3 F11 card.
3. **Cheap by default: on-demand rendering, per-field subscriptions, clicks only on interactive meshes** (R1, R10, R11). Influences **T-004**, **T-013**, **T-020**, **T-025**.
