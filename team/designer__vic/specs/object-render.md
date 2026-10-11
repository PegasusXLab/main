---
spec: object-render
brief: briefs/objects-and-look.md (part A)
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-1
depends_on: [objects-schema (SceneModel.objects)]
files_in_scope:
  - src/viewer3d/Objects.tsx (new) + test
  - src/viewer3d/Plinth.tsx (new)
  - src/viewer3d/CutoutMesh.tsx (new: alpha-trace → ExtrudeGeometry) + test of the tracer
  - src/viewer3d/ModelMesh.tsx (new: GLB load, normalize, dissolve-in)
  - src/viewer3d/Scene.tsx (render <Objects/>, onObjectClick, inspect)
  - src/viewer3d/TourView.tsx (plaque + focus for objects; after the editor-view-modes card)
  - src/viewer3d/CameraRig.tsx (face an object via SceneObject.view)
---
## What and why
Objects must read as **real things standing in the room**: sitting on a plinth, lit by the room, casting a soft shadow, inspectable like art. A generated model must **swap in without a pop**.

## Behavior and states
### Plinth
- Box `size × height × size` or cylinder (radius `size/2`, 48 segments). `--color-paper`-tinted matte (roughness 0.9) on light presets. On dark presets (moonlit, neon-bunker) use `THEME.colors.graphite` at roughness 0.6, so the plinth doesn't glow.
- A 1 cm darker reveal at the base (a thin box), the same trick as the baseboards in `look-foundation`.
- A soft contact shadow under each plinth: the shared radial-gradient quad from `look-foundation` §7, 1.4 × the footprint, opacity 0.45.

### Cut-out (`CutoutMesh`)
- **Trace:** load the image (`medium` URL), draw it to an offscreen canvas at ≤ 256 px on the long side, threshold alpha > 0.5, then marching squares → largest outer contour. Simplify (Douglas-Peucker, ε = 1.5 px) to ≤ 200 points, then `THREE.Shape`.
- Run it in a Web Worker if it takes > 8 ms. **Cache by URL.**
- **Geometry:** `ExtrudeGeometry` (depth = `source.depth`, bevel 2 mm, 2 segments), scaled so the shape height = `object.height`.
- **Materials:** front cap and back cap = the image texture (`SRGBColorSpace`, mirrored on the back), sides = the image's average edge colour darkened 20%, roughness 0.7.
- **No alpha in the image** (the photo-as-is MVP): the shape is the image rectangle with 4 mm rounded corners, i.e. a thick "standee".

### Model (`ModelMesh`)
- drei `useGLTF(modelUrl)` with meshopt support (`MeshoptDecoder` from `three/addons/libs/meshopt_decoder.module.js`), so pipeline-optimized files load.
- **Normalize:**
  1. compute the bounding box;
  2. scale so the box height = `object.height` (and the footprint ≤ plinth size × 1.1);
  3. translate so the bottom-centre sits on the plinth top.

  Keep the original materials. Clamp `envMapIntensity ≤ 1.5` and force `castShadow false`.
- **Dissolve-in swap** (generated objects): while the model loads, the cut-out stays. When it's ready, cross-fade over 600 ms: the cut-out fades opacity to 0 while the model fades from 0 to 1 (`transparent` during the fade only, reset after).
- **Error:** keep the cut-out, log once, and expose `onObjectError(id)` so the editor shows "Couldn't load this model".
- **Budget guard:** if the loaded model has > 300k triangles (pipeline bypassed), render its bounding box in kraft with a "Model too heavy" tooltip in the editor only.

### Library
`render.kind === "library"` → `ModelMesh` with the URL from `OBJECT_LIBRARY[libraryId].modelUrl` (static assets).

### Interaction and inspect
- Objects are clickable (R10: object meshes and plinth only).
  - **Viewer/POV:** click → CameraRig eases to `SceneObject.view` (1.0 s, R4) and the plaque opens (title, artist, story; the same `Plaque` component).
  - **Top-down/orbit:** click → select the object (accent outline).
- **Selection in 3D:** an accent ring on the floor around the plinth (2 cm wide, `THEME.colors.accent`), matching the T-071 style.
- **Picture lights** (`look-foundation`): objects in the current room join the light pool after frames, with one spot from above at 60° tilt.

## Tokens used
`THEME.colors.accent` (selection ring), `THEME.colors.graphite` / `paper` (plinth), `THEME.colors.kraft` (heavy-model placeholder). No raw hex.

## Motion
| Interaction | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|
| Generated model ready | cut-out → model cross-fade | 600 ms | ease-in-out | instant swap |
| Inspect object | camera to `view` | 1.0 s | existing CameraRig | cut |
| Object added (editor 3D) | scale 0.96 → 1 + opacity 0 → 1 | 240 ms | ease-out | none |

## Acceptance criteria (reviewer checks these)
- [ ] A transparent PNG of a vase shows as a thick silhouette with the image on the front and back, sitting on a box plinth with a contact shadow.
- [ ] A Polycam-exported GLB (any scale or orientation) lands upright, at the requested height, centred on its plinth.
- [ ] A generated object shows the cut-out first, then cross-fades to the model when `job` flips to ready, with no camera jump and no flash.
- [ ] Clicking an object in the viewer faces it and opens the plaque. In Top-down it selects it.
- [ ] Performance: 10 objects (mixed) in the 3-room template keep ≥ 55 fps on a mid laptop while traveling.
- [ ] A broken `modelUrl` keeps the cut-out and doesn't crash the scene (own Suspense/ErrorBoundary per object, R2).

## Build kit (the senior copies this into the card)
- **Libraries:** none new (drei `useGLTF`; three `ExtrudeGeometry`, meshopt decoder in `three/addons`).
- **Skills to load:** `pegasus-ui` §5; `emil-design-eng` (dissolve).
- **References:** `src/viewer3d/Frames.tsx` (lazy textures, placeholders), `specs/look-foundation.md` §7 (shadow quad), `specs/objects-schema.md` (SceneObject).
