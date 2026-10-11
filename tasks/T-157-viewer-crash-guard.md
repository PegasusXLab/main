---
id: T-157
title: BUGFIX - viewer crash guard (post chain + Canvas error boundaries, WebGL context loss)
status: ready
lane: frontend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-11T03:35:40Z
---
## Goal
A post-processing or WebGL failure degrades (no effects, or a friendly Retry) instead of a blank room. Addresses devops escalation 2026-10-10T23:49Z (publish-view: HUD rendered but no <canvas> in ~2 of 7 runs). Proposed pending Quang's call.
## Acceptance criteria
- [ ] Atmosphere.tsx: the EffectComposer sits in an error boundary; on error the scene renders without effects (lights and fog unchanged) and console.warns once.
- [ ] Scene.tsx: the `<Canvas>` sits in an error boundary with a styled fallback ("The 3D view couldn't start · Retry"); Retry remounts the canvas; the HUD stays usable.
- [ ] `webglcontextlost` → preventDefault; remount once on `webglcontextrestored`, otherwise show the fallback.
- [ ] Unit tests for both boundaries (throwing child). publish-view e2e with `--repeat-each=10` against the PR preview; pass count in the PR.
## Files / modules in scope
- src/viewer3d/Atmosphere.tsx, src/viewer3d/Scene.tsx, src/viewer3d/ViewerErrorBoundary.tsx (new) (+ tests)
## Out of scope
- Changing the post chain's look or tone mapping.
## Build kit
- **Libraries:** none new.
## Notes
- Bugfix label (mergeable after the 06:00 freeze). Senior builds; reviewer-3 or fresh reviewer subagent; human Approve.
- **Demo priority 1 if approved** (protects every demo).
## History
- 2026-10-11T03:30:00Z senior: carded (draft)
- 2026-10-11T03:35:39Z senior: Quang approved ("build T-157 first", ~23:50 EDT); reviewer-3 (Sergio) reviews; devops merges (senior may act as devops)
- 2026-10-11T03:35:40Z senior: status -> ready
