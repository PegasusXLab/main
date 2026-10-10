---
id: T-060
title: "Atmosphere: per-room presets (fog, light, background) that blend between rooms"
status: in-review
lane: frontend
assignee: builder-1
reviewer: reviewer-3
branch: feat/T-060-atmosphere
pr: 36
sprint: 3
depends_on: [T-035]
review_rounds: 0
approved_by_human: true
updated_by: builder-1
updated_at: 2026-10-10T12:46:14Z
---
## Goal
Each room feels different (F11, MVP acceptance item 5). This is the main "Creative track" payoff.
## Acceptance criteria
- [ ] Four presets as plain data: Gallery White, Neon Bunker, Golden Hour, Moonlit. Each sets light colors/intensities, fog color/density and background. `custom` uses the room's `atmosphere` fields (plan.md §6)
- [ ] `<Atmosphere currentRoomId model />` applies the current room's preset and **blends** to the next one over ~1 s when the room changes (reference R7, R6)
- [ ] Rooms without `atmosphere` fall back to their `lighting` preset (no behavior change for existing galleries)
- [ ] Stays cheap: no post-processing pass, still renders on demand (plan.md §7)
- [ ] Unit tests for preset resolution and the blend math
## Files / modules in scope
`src/lib/schema/atmosphere.ts` (+ test), `src/viewer3d/Atmosphere.tsx`, `src/viewer3d/Scene.tsx` (mount only), `src/viewer3d/Lighting.tsx`, `src/lib/compile/types.ts` + `src/lib/compile/compile.ts` + `src/lib/compile/compile.test.ts` (only to pass `rooms[].atmosphere` through; ADR-007 amendment 3)
## Out of scope
Panel UI for choosing presets (T-063). Bloom, grain (P2).
## Notes
- Read: plan.md §4 F11, §6 Atmosphere; reference R7, R12; architecture "As built: renderer".
## History
- 2026-10-10T12:11:29Z senior: created as Sprint 3 draft (awaiting Quang approval)
- 2026-10-10T12:14:15Z senior: approved by Quang ("yes approved")
- 2026-10-10T12:14:57Z senior: status -> ready
- 2026-10-10T12:27:34Z builder-1: status -> in-progress
- 2026-10-10T12:32:48Z senior: compile types/compile/test added to scope for rooms[].atmosphere (ADR-007 amendment 3)
- 2026-10-10T12:46:14Z builder-1: status -> in-review
