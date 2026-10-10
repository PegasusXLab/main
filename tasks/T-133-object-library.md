---
id: T-133
title: Object library - 12 CC0 objects (benches, plants, plinths, vitrine...) with posters and credits
status: in-review
lane: design
assignee: designer
reviewer: reviewer-3
branch: feat/T-133-object-library
pr: 78
sprint: 4
depends_on: [T-128]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/object-library.md
updated_by: designer
updated_at: 2026-10-10T20:36:38Z
---
## Goal
Creators can drop real-looking objects into rooms with no AI and no uploads: the library path of '+ Add object' (T-132).
## Acceptance criteria
(Copied from the spec, cut for no new deps.)
- [ ] All 12 items load in POV and Top-down at the default height, upright and on the floor.
- [ ] Total library weight ≤ 15 MB, each ≤ 1.5 MB, posters present, credits complete.
- [ ] A 3-room gallery with 2 benches, 3 plants and a vitrine still meets the `object-render` fps bar.

- [ ] Cut: NO optimizer script or gltf-transform (not approved). Choose assets that already meet the budget (Kenney / Poly Haven low-poly), or resize textures by hand; record each file's size + triangle count in the PR.
- [ ] Every asset is **CC0**, with source URL + author in `README.md` (Credits) and in each `credit` field. No other licenses.
- [ ] `OBJECT_LIBRARY` is filled and validates against T-128's schema; unit test: every entry's modelUrl + posterUrl exist in `public/library`.
## Files / modules in scope
- public/library/<id>/model.glb + poster.webp (new)
- src/lib/objects/library.ts (new) and wiring it into T-128's injectable library list (one import site)
- README.md (Credits section only)
## Out of scope
- scripts/library-optimize.mjs (needs the unapproved pipeline), render code (T-131), the add-flow UI (T-132).
## Build kit
- **Libraries:** none at runtime. The offline script uses the pipeline's gltf-transform.
- **Skills to load:** `pegasus-ui` (poster ground and naming).
- **References:** polyhaven.com/models, kenney.nl (CC0), ambientcg.com (CC0 textures), `specs/object-pipeline.md` (optimize.ts).
## Notes
- Assigned to designer (Vic): curation is design work, and builder-3 is taking over T-124's fix. Reviewer: reviewer-3 (not Vic). Starts after T-128 merges (needs the schema); asset hunting can start now.
## History
- 2026-10-10T20:20:53Z senior: carded; approved by Quang ("approve all and assign", 16:20 EDT)
- 2026-10-10T20:20:55Z senior: status -> ready
- 2026-10-10T20:27:36Z designer: status -> in-progress
- 2026-10-10T20:36:38Z designer: status -> in-review
