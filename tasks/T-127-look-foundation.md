---
id: T-127
title: Look foundation (L1) - IBL, picture lights, ceilings, baseboards, corner AO, PBR floors, frame moulding
status: approved
lane: design
assignee: designer
reviewer: reviewer-3
branch: feat/T-127-look-foundation
pr: 77
sprint: 4
depends_on: [T-124]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/look-foundation.md
updated_by: reviewer-3
updated_at: 2026-10-10T20:59:55Z
---
## Goal
The 3D stops looking generic: gallery-grade light and materials with NO new dependencies (brief objects-and-look, part B, L1).
## Acceptance criteria
(Copied from the spec; the reviewer checks these.)
- [ ] **Before/after captures** at 1440×900 from each room's `view` spot in the 3-room template, for each of the 4 presets (8 images minimum), attached to the PR. The "after" shows a visible picture-light pool on the wall around each work, frame depth and shadow, a textured floor and darkened corners.
- [ ] Moonlit and neon-bunker rooms: every artwork is clearly readable (no regression of T-065).
- [ ] Top-down/orbit view: no ceilings visible from above, and the plan reads as before.
- [ ] Creator wall colours: a `#2D3B4E` wall renders recognisably as that navy (Neutral tone mapping, no hue shift).
- [ ] Performance: on a mid laptop (M1/Intel Iris), the 3-room template holds ≥ 55 fps while traveling, and draw calls rise by ≤ +12 per room versus `main` (record `r3f-perf` numbers in the PR). `?quality=low` works.
- [ ] No new npm dependencies. The Gallery schema and compile output are unchanged. Floor textures ≤ 1.5 MB total and credited.
- [ ] Every existing vitest and Playwright test passes. Keep `id`/`data-testid`.
- [ ] Reduced motion: lights snap instead of easing.

- [ ] Gate: publish-view + phone matrix e2e green; a green Vercel preview; Moonlit and the other atmospheres still look right (screenshots in the PR); phone frame rate is not worse (quality tiers).
## Files / modules in scope
- src/viewer3d/Scene.tsx, Walls.tsx, Floors.tsx, Frames.tsx, Atmosphere.tsx, Lighting.tsx
- src/viewer3d/PictureLights.tsx, Ceilings.tsx, materials.ts (new)
- public/textures/floors/* (CC0, credited in the PR)
## Out of scope
- Objects (T-128 and later), post-processing (needs Quang: new deps), CameraRig/TourView (T-124).
## Build kit
- **Libraries:** none new (three `RoomEnvironment`, `NeutralToneMapping`, `PMREMGenerator`; drei already present). Dev only: `leva` (installed), `r3f-perf` (installed).
- **Primitives:** n/a (3D). Colours from `src/lib/theme.ts`.
- **Assets:** CC0 floor sets from ambientCG or Poly Haven (wood, concrete, marble) at 1K WebP: albedo, normal, roughness.
- **Skills to load:** `pegasus-ui` (§5 3D look rules); `emil-design-eng` for the light re-aim easing.
- **References:**
  - `plan/reference-basement.md` R1, R2, R4, R6, R7, R12 (ideas only, ADR-003)
  - `src/viewer3d/Atmosphere.tsx` (the existing blend to extend)
  - three docs in `node_modules/three/examples/jsm/environments/RoomEnvironment.js`

## Notes
- Approved by Quang ("continue on", 15:45 EDT). Start after T-124 is in review (it is); rebase on T-124 if Scene props change.
- Deploy safety rules apply (plan/overview.md). Merges after 18:00 continue under the demo-build rule.
## History
- 2026-10-10T19:40:24Z senior: carded from spec look-foundation; approved by Quang
- 2026-10-10T19:40:27Z senior: status -> ready
- 2026-10-10T20:05:57Z senior: reassigned to builder-2 (reviewer reviewer): builder-2/reviewer-2 back, offloading (Quang)
- 2026-10-10T20:11:45Z builder-2: status -> in-progress
- 2026-10-10T20:27:53Z senior: the designer had already built T-127 on origin/feat/T-127-look-foundation → reassigned to designer as owner (reviewer-3, not Vic/Parth). builder-2 moves to T-132.
- 2026-10-10T20:35:50Z designer: status -> in-review
- 2026-10-10T20:59:55Z reviewer-3: status -> approved
