---
spec: look-foundation
brief: briefs/objects-and-look.md (part B, L1)
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-1
files_in_scope:
  - src/viewer3d/Scene.tsx
  - src/viewer3d/Walls.tsx
  - src/viewer3d/Floors.tsx
  - src/viewer3d/Frames.tsx
  - src/viewer3d/Atmosphere.tsx
  - src/viewer3d/Lighting.tsx
  - src/viewer3d/PictureLights.tsx (new)
  - src/viewer3d/Ceilings.tsx (new)
  - src/viewer3d/materials.ts (new: shared materials + corner-AO shader chunk)
  - src/lib/schema/atmosphere.ts (preset VALUES + new look fields on AtmosphereLook; not the Gallery schema)
  - src/lib/schema/defaults.ts (LIGHTING_PRESETS values only)
  - public/textures/floors/* (new, CC0)
  - README.md (asset credits line only)
mockups: []   # acceptance uses before/after captures, see below
---
## What and why
The rooms look like a generic block game because of how they're lit and built, not because of the content:
- two flat lights and no shadows;
- no ambient occlusion and no reflections;
- single-colour materials;
- walls without trim, frames as planes, and no ceiling.

L1 fixes the **light and the build** with what we already ship (three 0.186, drei 10.7). **No new dependencies, no Gallery schema change, compile stays pure.**

The target feeling is *a real gallery at opening night*: the walls have soft light falling off toward the corners, each work is lit by its own picture light, floors have grain and sheen, and the room feels enclosed when you stand in it.

## Behavior and states
### 1. Colour and tone
- `gl.toneMapping = THREE.NeutralToneMapping` (Khronos PBR Neutral). **Why Neutral, not ACES/AgX:** creators pick exact wall hexes, and Neutral keeps their hues faithful while still rolling off highlights. ACES shifts hues, and AgX desaturates.
- `toneMappingExposure` comes from the atmosphere preset (`exposure`, default 1.0).
- Output stays sRGB. Every colour texture gets `colorSpace = SRGBColorSpace`, and data maps (normal, roughness) stay linear.

### 2. Image-based light (IBL)
- `scene.environment` = a PMREM of three's `RoomEnvironment` (`three/addons/environments/RoomEnvironment.js`), generated **once** per Canvas and disposed on unmount. No HDRI download.
- `scene.environmentIntensity` comes from the preset (`envIntensity`: gallery-white 0.9, golden-hour 0.7, moonlit 0.35, neon-bunker 0.25).
- `scene.background` stays the preset's background colour. The environment is for lighting only.
- The hemisphere light drops to about 40% of today's value, because IBL now carries the fill.

### 3. Picture lights (the signature of L1)
- `PictureLights.tsx` keeps a **fixed pool of 8 `SpotLight`s** that is never re-created. Changing the light count recompiles every shader, so the pool is fixed.
- On room change, the pool is re-aimed at the frames of the **current room** (sorted by frame width, largest first). Unused lights get `intensity = 0`.
- Each light sits **0.15 m below the ceiling and 1.1 m out from the wall**, aimed at the frame centre. `angle` fits the frame's diagonal plus 25% (so the light spills a soft oval onto the wall around the work), `penumbra 0.6`, `decay 2`, `castShadow false`.
- Colour and intensity come from the preset (`pictureLight: { color, intensity }`): gallery-white warm white, golden-hour amber, moonlit cool, neon-bunker magenta.
- In **orbit/top** mode, the pool aims at the selected room's frames, or does nothing with no selection.
- The lights ease to their new targets over the same 1.0 s as the CameraRig (R4). Under reduced motion they snap.

### 4. Ceilings (POV enclosure, invisible from above)
- `Ceilings.tsx`: one plane per room at `wallHeight`, facing **down**, `side: FrontSide`. You see it from inside the room and it is **culled when the camera is above it**, so the top-down and orbit views stay open with no mode check.
- Colour is the wall colour darkened 12%, roughness 0.95, and it doesn't receive picture lights (only IBL and the hemisphere).
- Optional track rail: a 2 cm × 2 cm graphite bar, 0.4 m in from each wall that has a frame, so the picture lights have a believable source. One merged geometry per room.

### 5. Walls: trim and corner AO
- **Baseboard:** for every wall piece with `bottom === 0` (header pieces over doorways have `bottom > 0` and are skipped), add a box 0.10 m high, 0.015 m proud of the wall face, in the wall colour darkened 8%. Merge it into that room's wall geometry, so there are no extra draw calls.
- **Corner AO** via `onBeforeCompile` on the shared wall material (`materials.ts`, `injectCornerAO`): darken by `1 − 0.35·(1 − smoothstep(0, 0.45, distToFloor))` near the floor and `1 − 0.2·(1 − smoothstep(0, 0.35, distToCeiling))` near the top.
  - The world-space height comes from a varying, and the wall top comes from a per-material uniform (or vertex colour).
  - It's analytic, with no extra pass.
- Wall roughness 0.92, and an optional subtle plaster normal (shared 512 px tile, normalScale 0.15) on `quality: "high"` only.

### 6. Floors: real materials
- Use CC0 PBR sets (ambientCG or Poly Haven) at **1K**, WebP, with albedo, normal and roughness for each of `wood`, `concrete` and `marble`. They live in `public/textures/floors/<preset>/`, total ≤ 1.5 MB. Credits line in README ("CC0, ambientCG/Poly Haven").
- Texture repeat is **world-scaled**: 1 tile = 2 m, so `repeat = size / 2` per floor. The unit plane is scaled per room today, so set `repeat` per room material instance, or move the scale into UVs.
- Marble: roughness 0.25, and `envMapIntensity` ×1.2 so it picks up IBL sheen. Wood: 0.6. Concrete: 0.85.
- **Floor edge AO:** the same `injectCornerAO` variant on the floor material darkens within 0.35 m of the room edges (from UVs × room size).
- The selection tint and outline (T-071) stay exactly as they are.
- Loading is non-blocking: the flat `FLOOR_COLORS` material shows until the textures load (current behaviour for frames), inside its own Suspense (R2).

### 7. Frames: depth, mat, shadow
- **Moulding:** a box frame 0.035 m deep around the image, face width 0.03 m, `--color-graphite` (`THEME.colors.graphite`), roughness 0.4.
- **Mat (passe-partout):** a white board between the moulding and the image, `0.12 × min(width, height)` wide, in `THEME.colors.paper`. The image sits 0.004 m behind the mat face.
- **Drop shadow:** a quad 0.002 m off the wall, offset down 0.04 m, 115% of the frame size. It uses a soft radial-gradient alpha texture generated once on a canvas (shared), opacity 0.35, `depthWrite false`.
- Selection: today's accent border stays, drawn outside the moulding.
- Placeholder and error states as today, on the mat.

### 8. Quality tiers (performance guardrail)
- `quality: "high" | "low"`, set once from `navigator.hardwareConcurrency <= 4 || isCoarsePointer || dpr > 2` (**low**); otherwise **high**. It's overridable with `?quality=low|high` for testing.
- **Low** drops plaster normals, uses 4 picture lights, skips track rails and halves texture resolution (512).
- Keep `frameloop="demand"` (R1). Nothing in L1 animates on its own except the 1 s light re-aim, which invalidates per frame only while it runs.

### 9. Preset values (atmosphere.ts / defaults.ts)
Add to `AtmosphereLook` (renderer data, not Gallery schema): `exposure`, `envIntensity`, `pictureLight: { color, intensity }`.

| Preset | exposure | envIntensity | pictureLight | Note |
|---|---|---|---|---|
| gallery-white | 1.0 | 0.9 | warm white, high | bright, clean |
| golden-hour | 1.05 | 0.7 | amber, high | warm directional stays |
| moonlit | 0.9 | 0.35 | cool blue-white, medium | **must stay readable** (T-065 lesson) |
| neon-bunker | 0.95 | 0.25 | magenta/cyan, medium | moody but art visible |
| custom | from brightness | 0.3–0.9 by brightness | moodColor tinted | |

Builder-1 tunes the final numbers with `leva` (dev only) and records them in the PR.

## Tokens used
3D colours come from `THEME` (`src/lib/theme.ts`): `graphite` (moulding, track rail), `paper` (mat), `accent` (selection only). No new raw hex in components. Preset colours live in `atmosphere.ts` as data, as they do today.

## Motion
| Interaction | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|
| Room change | picture-light pool re-aim (position, target, colour, intensity) | 1.0 s (matches CameraRig) | ease-in-out cubic | snap |
| Atmosphere blend | exposure, envIntensity, pictureLight (with the existing 1 s blend) | 1.0 s | existing | existing |

## Acceptance criteria (reviewer checks these)
- [ ] **Before/after captures** at 1440×900 from each room's `view` spot in the 3-room template, for each of the 4 presets (8 images minimum), attached to the PR. The "after" shows a visible picture-light pool on the wall around each work, frame depth and shadow, a textured floor and darkened corners.
- [ ] Moonlit and neon-bunker rooms: every artwork is clearly readable (no regression of T-065).
- [ ] Top-down/orbit view: no ceilings visible from above, and the plan reads as before.
- [ ] Creator wall colours: a `#2D3B4E` wall renders recognisably as that navy (Neutral tone mapping, no hue shift).
- [ ] Performance: on a mid laptop (M1/Intel Iris), the 3-room template holds ≥ 55 fps while traveling, and draw calls rise by ≤ +12 per room versus `main` (record `r3f-perf` numbers in the PR). `?quality=low` works.
- [ ] No new npm dependencies. The Gallery schema and compile output are unchanged. Floor textures ≤ 1.5 MB total and credited.
- [ ] Every existing vitest and Playwright test passes. Keep `id`/`data-testid`.
- [ ] Reduced motion: lights snap instead of easing.

## Build kit (the senior copies this into the card)
- **Libraries:** none new (three `RoomEnvironment`, `NeutralToneMapping`, `PMREMGenerator`; drei already present). Dev only: `leva` (installed), `r3f-perf` (installed).
- **Primitives:** n/a (3D). Colours from `src/lib/theme.ts`.
- **Assets:** CC0 floor sets from ambientCG or Poly Haven (wood, concrete, marble) at 1K WebP: albedo, normal, roughness.
- **Skills to load:** `pegasus-ui` (§5 3D look rules); `emil-design-eng` for the light re-aim easing.
- **References:**
  - `plan/reference-basement.md` R1, R2, R4, R6, R7, R12 (ideas only, ADR-003)
  - `src/viewer3d/Atmosphere.tsx` (the existing blend to extend)
  - three docs in `node_modules/three/examples/jsm/environments/RoomEnvironment.js`

## Out of scope (next specs)
Post-processing (N8AO, bloom, grain, DOF) and creator "Looks" → `specs/post-and-looks.md` (needs Quang for `@react-three/postprocessing`). Baked lightmaps → L4 on the Vultr GPU.
