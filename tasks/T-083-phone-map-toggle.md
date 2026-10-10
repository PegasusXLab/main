---
id: T-083
title: Viewer on phones - tap-to-open map
status: ready
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T17:34:11Z
---
## Goal
Phone visitors (view-only) can see the floor plan too. Today the minimap is hidden below 640 px (T-075/T-082).
## Acceptance criteria
- [ ] Below 640 px a "Map" button (at least 44x44 px, aria-label "Show map", `data-testid="minimap-toggle"`) sits in the viewer HUD without covering the sound controls, Prev/Next or the plaque.
- [ ] Tapping it opens the minimap as a sheet/overlay; tapping a room travels there (same as desktop) and closes the sheet; a close button and Escape close it.
- [ ] At 640 px and up nothing changes (existing minimap layout and testids unchanged).
- [ ] The current-room highlight uses Klein blue `#002fa7` instead of `#3b82f6` (use `THEME.colors.accent` from `src/lib/theme.ts` once T-110 merges; until then the hex with a TODO is fine).
- [ ] Unit test for the toggle; the T-079 phone e2e (iPhone/Pixel) still passes; lint + `npm run predemo` pass.
## Files / modules in scope
- src/viewer3d/Minimap.tsx, src/viewer3d/minimapMath.ts (+ tests)
## Out of scope
- Other viewer3d files (T-114, builder-1), the viewer page layout beyond mounting the toggle inside Minimap.
## Build kit
- **Libraries:** none. **Skills:** `pegasus-ui`, `web-design-guidelines` (optional kit install: `bash ../pegasus-docs/team/designer__vic/kit/install-skills.sh . --tool antigravity`).
## Notes
- Phones are view-only (Quang). Target PR ~15:00 EDT. Freeze today 18:00 EDT.
## History
- 2026-10-10T17:34:09Z senior: carded; approved by Quang
- 2026-10-10T17:34:11Z senior: status -> ready
