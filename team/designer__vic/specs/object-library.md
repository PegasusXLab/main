---
spec: object-library
brief: briefs/objects-and-look.md (part A, tier 3)
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-3 (asset prep) with designer curation
depends_on: [objects-schema (OBJECT_LIBRARY const), object-pipeline (optimize.ts used offline)]
files_in_scope:
  - public/library/<id>/model.glb + poster.webp (new)
  - src/lib/objects/library.ts (OBJECT_LIBRARY const: id, name, category, modelUrl, posterUrl, defaultHeight, plinth default, credit)
  - scripts/library-optimize.mjs (new: runs optimize.ts over raw assets; dev-only)
  - README.md (credits section)
---
## What and why
"I have nothing yet" still needs an answer, and the room needs **vibe objects**: a place to sit, something green, a light source. The library is small and curated in one consistent material language, so any gallery stays coherent. It's never a dump of random assets.

## The set (v1, 12 items, all CC0)
| id | Name | Category | Source idea | Default height | Plinth |
|---|---|---|---|---|---|
| bench-oak | Gallery bench | Seating | Poly Haven / Kenney CC0 bench | 0.45 | none |
| stool-round | Round stool | Seating | Kenney furniture (CC0) | 0.5 | none |
| plant-fiddle | Fiddle-leaf fig | Plants | Poly Haven potted plant | 1.6 | none |
| plant-snake | Snake plant | Plants | Poly Haven potted plant | 0.8 | none |
| lamp-floor | Floor lamp | Light | Poly Haven lamp | 1.6 | none |
| rug-wool | Wool rug | Floor | procedural plane + CC0 fabric texture | 0.01 | none |
| vitrine | Glass vitrine | Display | **procedural** (box + transmission glass) | 1.1 | none |
| vase-ceramic | Ceramic vase | Objects | Poly Haven ceramic vase | 0.4 | box 0.9 |
| bust-marble | Marble bust | Objects | Poly Haven bust | 0.6 | box 1.0 |
| sphere-bronze | Bronze sphere | Objects | procedural sphere + CC0 metal | 0.4 | round 0.9 |
| plinth-tall | Tall plinth (empty) | Display | procedural | 0 | box 1.2 |
| speaker-vintage | Speaker | Sound (decor) | Kenney / Poly Haven | 0.9 | none |

**Curation rules (designer):**
- Neutral, real-world materials (oak, ceramic, linen, marble, brass); nothing cartoonish or saturated.
- ≤ 1.5 MB each after optimize, ≤ 30k triangles.
- Upright, Y-up, origin at the base centre.
- One poster per item: a 320×320 WebP rendered on `--color-plaster` ground, three-quarter view.
- The licence is CC0 only, with a credit line in `library.ts` and the README.
- The final pick happens after a look at the actual assets; the designer may swap rows with equivalents.

## Behavior
- The picker grid (from `object-add-flow`) shows posters in 3 columns with the name under each and a category filter row (All · Seating · Plants · Light · Display · Objects). It's keyboard operable.
- Library objects behave exactly like other objects: move, rotate, height scale (clamped 0.5×–1.5× of the default), plinth editable.
- `vitrine` and `rug-wool` are procedural in `ModelMesh` via `libraryId` switch (no GLB), so they're tiny.

## Acceptance criteria (reviewer checks these)
- [ ] All 12 items load in POV and Top-down at the default height, upright and on the floor.
- [ ] Total library weight ≤ 15 MB, each ≤ 1.5 MB, posters present, credits complete.
- [ ] A 3-room gallery with 2 benches, 3 plants and a vitrine still meets the `object-render` fps bar.

## Build kit (the senior copies this into the card)
- **Libraries:** none at runtime. The offline script uses the pipeline's gltf-transform.
- **Skills to load:** `pegasus-ui` (poster ground and naming).
- **References:** polyhaven.com/models, kenney.nl (CC0), ambientcg.com (CC0 textures), `specs/object-pipeline.md` (optimize.ts).
