---
id: T-114
title: 3D viewer adopts the design colors (Klein blue selection)
status: merging
lane: frontend
assignee: builder-1
reviewer: reviewer-2
branch: feat/T-114-viewer3d-design-colors
pr: 63
sprint: 3
depends_on: [T-110]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/tokens-fonts-theme.md
updated_by: devops
updated_at: 2026-10-10T18:25:59Z
---
## Goal
The 3D view matches the 2D editor and the UI: one accent, Klein blue `#002fa7` (ADR-013).
## Acceptance criteria
- [ ] `SELECTION_COLOR` (Floors.tsx) and `SELECTED_FRAME_COLOR` (Frames.tsx) come from `THEME.colors.accent` (`src/lib/theme.ts`, T-110).
- [ ] `FRAME_BORDER_COLOR` uses THEME graphite. The floor material colours (wood/concrete/marble) are materials, not UI, and stay.
- [ ] Selection stays clearly visible in all atmospheres, including Moonlit (check by eye and with a screenshot in the PR).
- [ ] No behaviour change; lint, unit tests, `npm run predemo` pass.
## Files / modules in scope
- src/viewer3d/Floors.tsx, src/viewer3d/Frames.tsx (+ their tests)
## Out of scope
- src/viewer3d/Minimap.tsx (T-083, builder-2); lighting/atmospheres; theme.ts (designer).
## Build kit
- **Libraries:** none. **Skills:** `pegasus-ui`. **References:** team/designer__vic/specs/tokens-fonts-theme.md.
## Notes
- Small. Start now with the THEME shape in the spec; rebase onto T-110 (~15:00 EDT). Target PR ~15:45 EDT.
## History
- 2026-10-10T17:34:09Z senior: carded; approved by Quang
- 2026-10-10T17:34:21Z senior: status -> ready
- 2026-10-10T18:16:08Z builder-1: status -> in-progress
- 2026-10-10T18:22:29Z builder-1: status -> in-review
- 2026-10-10T18:24:48Z reviewer-2: status -> approved
- 2026-10-10T18:25:59Z devops: status -> merging
