---
brief: objects-and-look
author: designer
status: sent   # draft | sent | approved | adjusted | needs-quang
playbook: space
surfaces: [ObjectPanel + "Add" flow, 2D canvas floor markers, viewer3d (objects, lighting, materials, post), upload/API, storage]
created_at: 2026-10-10T19:40:00Z
supersedes_part_of: specs/any-medium-3d-objects.md (ADR-015 draft; this brief adds the pipeline, services and stack)
---
Vic, 2026-10-10: *"Adding objects is core to the app. If we need external tools, cloud services, libraries, or to build anything to support and scale it, let's figure that out and start moving. And upgrade the graphics/shaders so it stops looking like a generic Roblox model: cool 3D aesthetics, basement.studio as the inspiration."*

Two workstreams with one principle: **deep customization, light touch** (PRODUCT.md). Every new power is one visual pick, never a form.

---

# A. Objects: "any medium"

## Problem
Today the only artwork is an image on a wall. Creators need sculptures, crafts, products, objects that set a vibe (plants, a bench, a lamp), sound and text, without any 3D skills.

## The creator flow (one button, four answers)
**`+ Add` → Picture · Object · Sound · Text**

**Object** asks one question: *"What do you have?"*
1. **A photo of it**: we make it 3D (AI, ~30–90 s).
2. **A 3D file** (`.glb`): from a phone scan (Polycam, Scaniverse, Luma), Sketchfab, Blender.
3. **Nothing yet**: pick from the library (plinth, bench, plant, lamp, rug, vitrine…).

**Progressive, never blocking (the key UX idea):**
- The moment a photo is uploaded, the object appears **instantly** as a **cutout**: the photo's silhouette (background removed) extruded into a thick standee on a plinth.
- In the 2D plan it's a kraft template, like art without an image (Install Day).
- When the AI mesh is ready, it **swaps in place** with a short dissolve. If generation fails or is slow, the cutout is a perfectly good final result. Nobody waits on a spinner.

Placement: free-standing objects sit on the **floor** (`x, y, rotation` in the room, optional plinth). In 2D they're a circle/footprint marker, dragged and rotated (snap 0.1 m / 15°), and the selection shows the tape tag `0.80 m plinth · 45°`.

## Pipeline and services
| Tier | What | Where it runs | New stack | Cost |
|---|---|---|---|---|
| 0 Cutout | Background removal → alpha → traced outline → `ExtrudeGeometry` + image front face | Browser (Web Worker) | Background-removal model, see licensing ↓ | Free |
| 1 Upload `.glb` | Validate (≤ 30 MB in), optimize (resize textures to 1024–2048 WebP, meshopt, simplify to ~100k tris, prune/dedupe), normalize scale and pivot to the plinth | **Server** (Node route) | `@gltf-transform/core` + `functions` + `meshoptimizer` | Free |
| 2 Photo → 3D (AI) | `POST /api/objects/generate` → provider job → poll → download GLB → **same Tier 1 optimizer** → store | Server + provider API | Provider SDK/REST + API key in Vercel env | ~$0.08–0.25 per object |
| 3 Library | Curated CC0 models (Poly Haven, Kenney) pre-optimized to KTX2/meshopt, plus procedural plinths/vitrines | Static, in our bucket | none | Free |

**AI provider shortlist (all export GLB):**
- **fal.ai Hunyuan3D** (~$0.08/gen, simple REST; fal also hosts TRELLIS-class models);
- **Meshy** or **Tripo** (~$0.10–0.25/gen, PBR textures, 30–100 s);
- **Stability SF3D** (~$0.07, ~1 s, but albedo-only textures; great as a fast first pass).

**Recommendation:** fal.ai (one key, several models, swap without code changes). Later, self-host TRELLIS.2 / Hunyuan3D on the pending **Vultr GPU** (fits T-090–T-092) to cut per-object cost.

**Uploads at scale:**
- Vercel function bodies cap around 4.5 MB, so `.glb` files and AI outputs go **browser → presigned PUT to Vultr S3** (or server → S3 for AI results), never through the function body.
- The optimizer runs in a function with a longer max duration, or a Vultr worker if it's slow.
- Per-user rate limit and monthly budget cap on AI generation (accounts now exist, ADR-014). Anonymous editors get the cutout plus upload only.

**Licensing flags (must decide before building Tier 0):**
- `@imgly/background-removal` is **AGPL**.
- BRIA **RMBG-1.4/2.0** weights are **non-commercial**.
- Safer: **BiRefNet** or **MODNet** (MIT/Apache) via `@huggingface/transformers` (WebGPU with WASM fallback).
- Simplest MVP: "upload a PNG with a transparent background", with auto-removal as a follow-up.

## Schema (ADR-015, revised)
- `Artwork.type: "image" | "object" | "sound" | "text"`.
- `placement: { kind: "wall", … } | { kind: "floor", x, y, rotation, plinth?: { shape, height } }`.
- `object?: { source: "cutout" | "upload" | "generated" | "library", modelUrl?, cutoutUrl?, status: "ready" | "generating" | "failed", libraryId? }`.
- Backward compatible: an old `placement` without `kind` normalizes to wall. The rest of ADR-015 (wall textures, title fonts) stays.

---

# B. The look: from "Roblox" to "a place"

## Why it looks generic today (evidence: `src/viewer3d/Lighting.tsx`, `Walls.tsx`, `Floors.tsx`)
- One hemisphere and one directional light, **no shadows, no ambient occlusion, no environment reflections**.
- Flat single-colour materials, floors as flat colours.
- Box walls with no trim, frames as plain planes.
- **No post-processing**, so the "grain" atmosphere control does nothing.
- Everything is evenly lit, so nothing has depth or mood.

## What basement does (inspiration only, ADR-003)
basement's 2025 HQ (their "New Digital HQ pt 1" post):
- PS2-era aesthetics as a deliberate *choice*;
- **baked light-maps + AO** instead of real-time lights;
- one custom material for every surface (one place controls the look);
- KTX-compressed textures via gltf-transform;
- inspectable objects;
- point-and-click navigation;
- an original soundtrack.

We take the **ideas** (a committed look, baked depth, one material system, inspect mode, sound). We copy none of their shaders, models or textures.

## Plan in layers (each one ships on its own)
**L1. Light and material foundation.** No new deps (three + drei already installed).
- AgX/ACES tone mapping, correct colour management.
- Image-based lighting: three's `RoomEnvironment` (no asset) or a small self-hosted CC0 studio HDRI (Poly Haven).
- **Picture lights**: a soft spotlight per artwork in the current room (gallery track lighting), capped to the visible room.
- Soft **contact shadows** under objects and plinths (drei `ContactShadows` / `AccumulativeShadows`).
- **PBR floors** (wood/concrete/marble from ambientCG/Poly Haven CC0, KTX2) and a subtle plaster normal on walls. `MeshReflectorMaterial` for marble and polished concrete.
- **Architecture trim generated by compile**: baseboards, a ceiling cove or track rail, door casings, and frames with depth, a bevel and a mat. Cheap geometry, huge realism win.
- **Fake corner AO in the wall/floor shader** (darken edges near junctions). Rooms are boxes, so this is analytic and costs nothing.

**L2. Post stack** (`@react-three/postprocessing` + `postprocessing`, **needs Quang**):
- N8AO (ambient occlusion), subtle Bloom, Vignette, **Noise grain** (makes the dead `grain` control work), SMAA;
- DepthOfField on inspect (R12, the room dims and blurs behind the piece);
- values blend per room through the atmosphere preset (R7).

**L3. Signature "Looks"**: the basement-grade part, as a **creator choice** per gallery (or per room). Each one is one small hand-written `Effect` shader:
| Look | Feel |
|---|---|
| **Museum** (default) | Clean, soft AO, picture lights |
| **Film** | Grain, halation, gentle vignette, warm roll-off |
| **Retro** | Our own PS2-era homage: low internal resolution with crisp nearest upscale, ordered dithering, slight vertex snap, fog |
| **Noir** | Mono, deep contrast, hard picture lights |
| **Dream** | Bloom, haze, soft focus |

Looks are visual pickers (a live thumbnail of the current room in each look), consistent with the space kits.

**L4. Baked lighting** (later, Vultr GPU = T-091):
- On publish, bake per-room lightmaps/AO (`three-gpu-pathtracer`, or a Blender worker) and store them next to the gallery JSON.
- The viewer loads the bake when it exists and falls back to L1–L3 lighting when it doesn't.

**Performance guardrails:**
- Keep on-demand rendering (R1). Grain/dither animate only while the camera moves, otherwise static noise.
- Use drei `PerformanceMonitor` for **auto quality tiers** (phones drop AO and reflections first).
- Cap DPR. Spotlights only in the current and adjacent rooms.

## Tooling for the builders (agent skills / MCPs / assets)
- **Skills** (vet, then pin to a reviewed commit like the kit does): `cloudai-x/threejs-skills` (materials, textures, lighting, postprocessing), `enzed/r3f-skills` (`r3f-postprocessing`). They're candidates only; the designer reviews them before they go into `kit/install-skills.sh`.
- **MCPs:**
  - `three-js-mcp` (three.js docs search; low priority, since installed `node_modules` docs win);
  - Playwright MCP (already used) for before/after screenshots of every look;
  - optional `blender-mcp` for authoring the library assets and bakes.
- **Dev tuning:** `leva` (installed) for live look tuning, `r3f-perf` (installed) for budgets.
- **Assets:** Poly Haven (CC0 HDRIs, textures, models), ambientCG (CC0 PBR), Kenney (CC0 kits). All self-hosted in our bucket, never hot-linked.

---

## Stack asks
| Library / service | Why | Size / risk | Needs Quang? |
|---|---|---|---|
| `@react-three/postprocessing` + `postprocessing` | L2/L3 effects, custom Looks | ~60 kB gz; must work with on-demand frames | **Yes** |
| `@gltf-transform/core`, `/functions`, `meshoptimizer` | Tier 1/2 optimizer (server) | Server only, no client cost | **Yes** |
| fal.ai account + `FAL_KEY` (or Meshy/Tripo) | Photo → 3D | ~$0.08–0.25 per object; budget cap needed | **Yes** (account and budget) |
| `@huggingface/transformers` + BiRefNet/MODNet weights | Browser background removal for cutouts | ~40–80 MB model download on first use (lazy); license check | **Yes** |
| CC0 asset pack (Poly Haven / ambientCG / Kenney) | Floors, HDRI, library objects | Bucket storage only | No (FYI) |

## Proposed specs (build order)
1. `specs/look-foundation.md`: L1 (tone mapping, IBL, picture lights, contact shadows, PBR floors, trim, corner AO). builder-1. **No new deps. The only candidate small enough to try before the freeze.**
2. `specs/post-and-looks.md`: L2 and L3 (post stack, five Looks, Look picker). builder-1 (shaders) + builder-2 (picker).
3. `specs/objects-schema.md`: revised ADR-015 + validate/normalize + compile `floorObjects`. builder-1.
4. `specs/object-add-flow.md`: the Add menu, Object flow, 2D floor marker, ObjectPanel. builder-2.
5. `specs/object-pipeline.md`: presigned uploads, the gltf-transform optimizer, the AI generate/poll route, rate limits. builder-1 / builder-3.
6. `specs/object-render.md`: cutout extrude, GLB render + plinth, the dissolve swap, inspect/plaque for objects. builder-1.
7. `specs/object-library.md`: the curated CC0 set. designer + builder-3.

## Open questions for senior
1. **Timing.** The freeze is 18:00 EDT. My suggestion: only spec 1 (L1, no deps) as a candidate *now*, if builder-1 has room after the view-modes card; everything else is post-freeze and goes in the submission as the roadmap. Or does Quang want to keep building after submission?
2. **Quang decisions:** the postprocessing libs, gltf-transform, the AI provider plus budget (I recommend fal.ai), and the background-removal model and license (or MVP = "upload a transparent PNG").
3. Should I fold this into **ADR-015 v2** (objects + placement + Looks as a gallery/room field), or split it into ADR-015 (objects) and ADR-016 (Looks)?
4. Owners for the server pipeline (builder-1 vs builder-3)?

## Sources
- basement.studio, *New Digital HQ, pt 1*: https://basement.studio/post/new-digital-hq-pt-1
- Image-to-3D API comparison 2026: https://www.3daistudio.com/blog/best-3d-model-generation-apis-2026
- fal.ai 3D API docs: https://fal.ai/docs/model-api-reference/3d-api/overview.md
- N8AO in react-postprocessing: https://react-postprocessing.docs.pmnd.rs/effects/n8ao
- GLB web optimization (gltf-transform, meshopt, KTX2): https://app.cinevva.com/guides/optimize-glb-for-web
- Browser background removal (imgly; transformers.js): https://img.ly/blog/announcing-imgly-background-removal/ · https://github.com/backblaze-b2-samples/b2-transformerjs-background-removal
- three.js agent skills/MCPs: https://claudemarketplaces.com/skills/cloudai-x/threejs-skills/threejs-materials · https://playbooks.com/mcp/locchung-three-js
