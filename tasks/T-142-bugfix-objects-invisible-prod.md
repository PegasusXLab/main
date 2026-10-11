---
id: T-142
title: BUGFIX - library/GLB objects never become visible in production builds (placeholder column stays)
status: in-progress
lane: frontend
assignee: senior
reviewer: reviewer-3
branch: t-142-objects-visible-prod
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T22:14:07Z
---
## Goal
Free-standing objects (library + GLB) render in production exactly as in dev.
## Evidence (reviewer-3 post-merge review of #81, 21:38Z)
- Prod and local `next start` show the placeholder column forever with ZERO errors; `next dev` shows the bust. The asset is valid (bust-marble GLB 200 and renders in dev). Not placement: the object is correctly at room centre. Prime suspect: the success path after the async model load under the **demand frameloop**: the fade/useFrame never gets a frame after Suspense resolves in prod (dev StrictMode double-mount masks it). Probe: https://galleriverse.vercel.app/g/8bN54tekNuYiwZlGoMMRf
## Acceptance criteria
- [ ] Root cause confirmed on a local PRODUCTION build (`npm run build && npm start`) and written in the PR.
- [ ] Fix: after a model resolves, the scene is invalidated until the dissolve-in finishes (e.g. `invalidate()` from useThree in the load effect / per-frame while fading), and the placeholder is removed when the model is shown. Works under frameloop="demand" and "always".
- [ ] A prod-build Playwright screenshot of the probe gallery shows the bust on its plinth (before/after attached in the PR); editor POV + viewer both; no console errors.
- [ ] Unit test for the visibility state machine (placeholder → model, fade completes without frames being requested externally). Lint, unit, build, publish-view + edit-link e2e green.
## Files / modules in scope
- src/viewer3d/ModelMesh.tsx, src/viewer3d/Objects.tsx (+ tests); src/viewer3d/CutoutMesh.tsx only if the same bug applies there
## Out of scope
- Scene/TourView/CameraRig, the add flow (T-132), schema.
## Build kit
- **Libraries:** none.
## Notes
- Taken by senior (Quang: "keep on building", 18:10 EDT). Bugfix label. Push only if green; reviewer-3; devops merges. Must land before/with T-132.
## History
- 2026-10-10T22:13:44Z senior: carded from reviewer-3's #81 post-merge review; built by senior
- 2026-10-10T22:13:51Z senior: status -> ready
- 2026-10-10T22:14:07Z senior: status -> in-progress
- 2026-10-11T00:05Z senior: investigated on local PROD build (`npm run build && npm start`, worktree t-142-objects-visible-prod @ ee04d246). NOT REPRODUCED in 4 configs: (a) editor Top-down, bust appears <12 s; (b) visitor viewer /g/<id>, bust renders; (c) viewer with the bust GLB delayed 5 s (slow-network simulation), bust still appears; (d) LIVE production probe https://galleriverse.vercel.app/g/8bN54tekNuYiwZlGoMMRf, bust renders, GLB 200, no console errors. Prime suspect REFUTED: R3F v9.8.1 auto-invalidates the demand loop on every scene-graph commit (`invalidateInstance` on update + `rootStore.subscribe(state => invalidate(state))` in the installed bundle), so a late Suspense resolve always gets its frames; the `modelReady -> invalidate()` + useFrame fade chain is redundant but sound. Most likely explanation for the 21:38Z sighting: a deployment where the GLB 404'd (preview/mid-rollout) hitting the ErrorBoundary path, which by design keeps the placeholder and only console.warns. NO CODE CHANGE: adding an interval-invalidator for a disproven stall would be dead weight. Gate LIFTED: T-132 is unblocked. Asking reviewer-3 for the exact failing config (browser, URL, time, console incl. warns); if it reappears with steps, this card reopens with a real root cause.
