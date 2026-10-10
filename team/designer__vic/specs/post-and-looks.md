---
spec: post-and-looks
brief: briefs/objects-and-look.md (part B, L2 + L3)
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-1 (effects + shaders), builder-2 (Look picker UI)
depends_on: [look-foundation, objects-schema (Gallery.look / Room.look)]
needs_quang: ["@react-three/postprocessing", "postprocessing"]
files_in_scope:
  - src/viewer3d/PostFX.tsx (new: EffectComposer per quality tier)
  - src/viewer3d/looks/*.ts (new: one Effect class + preset per Look)
  - src/viewer3d/looks/index.ts (LOOKS registry, blend helper)
  - src/viewer3d/Scene.tsx (mount PostFX; inspect DOF hook)
  - src/viewer3d/Atmosphere.tsx (grain/haze feed the active Look)
  - src/panels/GalleryPanel.tsx + RoomPanel.tsx (Look picker; builder-2)
  - src/components/ui/LookPicker.tsx (new; designer owns ui/*, builder-2 builds to this spec)
---
## What and why
L1 makes the rooms *believable*; Looks make them *someone's*. basement.studio's site feels personal because it commits to one look (their PS2-era homage). We give creators that kind of commitment **as a choice**: five Looks, one tap each, per gallery with optional per-room overrides.

Everything is our own shader code. Nothing is copied from basement (ADR-003).

## Post stack (PostFX)
- An `EffectComposer` (`@react-three/postprocessing`) with `multisampling={0}` and SMAA at the end (hardware AA is off, R1).
- **Base effects, every Look:** N8AO (`quality "performance"`, radius 0.6, intensity by Look), ToneMapping is **not** here (L1 owns it on the renderer), SMAA.
- **Per-Look effects:** see the table. Each Look is a preset of base-effect values + at most **one custom `Effect`** (a GLSL fragment in `looks/<name>.ts`, extending `postprocessing`'s `Effect`).
- **Inspect (R12):** when the plaque is open, DepthOfField focuses on the frame/object (bokehScale 2, 400 ms ramp) and the room dims by 15% (vignette darkness up). Off on low quality.
- **Quality tiers** (from `look-foundation`): **low** = SMAA + the Look's custom Effect only (no AO, no DOF, no bloom). **high** = everything.
- **On-demand rendering stays.** Grain/dither use a static seed while the camera is still and advance only while it moves, so idle GPU stays at 0.

## The Looks
| Look | AO | Bloom | Vignette | Custom effect | Feel |
|---|---|---|---|---|---|
| **Museum** (default) | 0.9 | off | 0.15 | none | Clean, soft depth, picture lights carry it |
| **Film** | 0.8 | 0.25, threshold 0.85 | 0.3 | `FilmEffect`: luma grain (size 1.4, amount from atmosphere `grain`), halation (red-shifted glow on highlights), soft toe | Warm, analog |
| **Retro** | 0.5 | off | 0.2 | `RetroEffect`: render at 1/3 resolution with nearest upscale (composer `resolutionScale`), 4×4 Bayer ordered dither to a 5-bit/channel palette, slight vertex snap via a material `onBeforeCompile` (`look-foundation` materials), fog from atmosphere | Our late-90s console homage, crisp pixels, dithered gradients |
| **Noir** | 1.0 | off | 0.45 | `NoirEffect`: luminance mono with a slight cool tint, S-curve contrast, grain 0.25 | Deep, dramatic, picture lights become pools |
| **Dream** | 0.6 | 0.6, threshold 0.6 | 0.2 | `DreamEffect`: soft glow + chromatic fringe at the edges, haze from atmosphere | Hazy, gallery-as-memory |

- **Blending:** when the visitor moves between rooms with different Looks, the numeric values blend over 1.0 s (R7). The custom Effects cross-fade by a `mix` uniform (both active during the blend, then the old one is removed).
- **Atmosphere coupling:** the existing atmosphere `grain` (0–1) finally does something: it scales Film/Noir grain and the Retro dither strength. `haze` scales Dream glow and fog.

## Look picker (UI, builder-2)
- **GalleryPanel:** a "Look" section (`PanelSection`) with a 5-tile grid (`LookPicker`).
  - Each tile is a **live 160×100 thumbnail of the current room in that Look**, rendered once to a small offscreen target when the panel opens and cached until the room changes. Fallback: a static per-Look gradient chip.
  - Label under each tile (Geist 12 px). Selected: a 2 px `--color-accent` ring.
- **RoomPanel:** "Look: Same as gallery ▾" (`Select`, with gallery default + 5) for per-room overrides.
- Keyboard: radiogroup with arrows, focus-visible ring.
- In 2D view, the picker still works (it's saved), and a hint line says "See it in 3D POV".

## Tokens used
UI: `--color-accent`, `--color-accent-subtle`, `--color-hairline`, `--color-pencil`, `--radius-default`, `--duration-fast`. 3D: all values live in `looks/*.ts` presets (data). No colour literals in components.

## Motion
| Interaction | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|
| Change Look (editor) | effect values + custom mix | 600 ms | ease-in-out | instant |
| Room change, different Look | blend | 1.0 s (matches the camera) | ease-in-out | instant |
| Inspect DOF/dim | focus + vignette | 400 ms | ease-out | instant, no DOF |
| Grain/dither | noise seed | only while the camera moves | — | static seed always |

## Acceptance criteria (reviewer checks these)
- [ ] Each Look, captured from the same spot in the 3-room template at 1440×900 (5 images in the PR), is clearly distinct at thumbnail size.
- [ ] Moving between rooms with different Looks blends over ~1 s, with no flash or pop.
- [ ] The atmosphere `grain` slider visibly changes Film/Noir grain and the Retro dither.
- [ ] Idle viewer: the GPU frame count stays at 0 when nothing moves (on-demand rendering intact; check with `r3f-perf`).
- [ ] Performance: high ≥ 50 fps and low ≥ 55 fps on a mid laptop while traveling. A phone auto-selects low.
- [ ] Inspect opens with DOF + dim on high, and dim only on low.
- [ ] The Look picker is keyboard operable and matches the token rules. Per-room override works and saves.
- [ ] Every test passes. No basement code or shaders.

## Build kit (the senior copies this into the card)
- **Libraries (need Quang):** `@react-three/postprocessing`, `postprocessing` (pin versions compatible with three 0.186 / R3F 9).
- **Primitives:** `PanelSection`, `Select`, `Tooltip` (exist); `LookPicker` (new, in `ui/`).
- **Skills to load:** `pegasus-ui`; `emil-design-eng`; for the shader work, a vetted three.js postprocessing skill (the designer pins it into the kit before carding: candidates `cloudai-x/threejs-skills` threejs-postprocessing, `enzed/r3f-skills` r3f-postprocessing).
- **References:**
  - `postprocessing` Effect API docs in `node_modules/postprocessing`
  - react-postprocessing docs (N8AO, DOF)
  - `plan/reference-basement.md` R7, R9, R12 (ideas only)
