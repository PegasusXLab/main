---
title: Eliminate first-walk hitch residue in 3D viewer
size: S
status: building
branch: fix/viewer-first-walk-hitch
pr:
---

## 1 Shape
- **Problem:** When walking between rooms for the first time in galleries containing 3D library objects (e.g., Vic's Space with statue-horse and frame-standing in East Hall), visitors experience a ~55 ms main-thread hitch. CPU profiling in #138 showed this is synchronous WebGL shader linking (`getProgramInfoLog`).
- **Cause:** (1) `injectFloorLook` in `materials.ts` lacked a `customProgramCacheKey` unlike `injectWallAO`; (2) `useGLTF` models inside `<Objects>` were not preloaded or warmed up if they mounted after `WarmUp`'s initial 1500ms timeout; (3) When model meshes mounted, their materials were not precompiled with `gl.compileAsync(object, camera, scene)`.
- **For:** Visitors in the 3D viewer (`/g/[id]`) and creators in the editor's 3D POV.
- **Surfaces:** `src/viewer3d/materials.ts`, `src/viewer3d/WarmUp.tsx`, `src/viewer3d/Objects.tsx`, `src/viewer3d/ModelMesh.tsx`.

### Acceptance criteria
- [ ] `injectFloorLook` defines a deterministic `customProgramCacheKey` incorporating the floor kind.
- [ ] Library models in `model.objects` are preloaded with `useGLTF.preload` at scene setup.
- [ ] When 3D models mount and normalize, their materials and textures are asynchronously warmed via `gl.initTexture` and `gl.compileAsync(object, camera, scene)` without blocking rendering.
- [ ] Existing viewer and tour navigation tests continue to pass with 0 regressions.

## 2 Plan
- **Files:**
  - `src/viewer3d/materials.ts`: Add `material.customProgramCacheKey = () => "floor-look-v1-" + kind;` to `injectFloorLook`.
  - `src/viewer3d/Objects.tsx`: Add preloading for library models present in `objects`.
  - `src/viewer3d/ModelMesh.tsx`: After model normalization, asynchronously initialize textures and precompile materials against the Three.js scene.
- **Reuse:** `useGLTF.preload`, `normalizeObjectModel`, `gl.compileAsync`.
- **Risks:** Calling `compileAsync` on individual subtrees must not throw or block; handle gracefully with `.catch(() => {})`.
- **New deps / paid services:** none.
- **Tests:** `npm test`, targeted Playwright `tour-nav.spec.ts`.

## Assumptions (autopilot only)
- S-size fix: directly targets the remaining shader-compilation sources without altering public schema or rendering appearance.
- Safe warmup: precompilation errors are caught silently so scene rendering is never interrupted.

## 3 Build log
- 

## 4 Review
- 

## 5 Ship
- 
