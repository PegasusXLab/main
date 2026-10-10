---
id: T-083
title: Viewer on phones - tap-to-open map
status: merging
lane: frontend
assignee: builder-2
reviewer: reviewer-3
branch: feat/T-083-phone-map-toggle
pr: 56
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: devops
updated_at: 2026-10-10T17:59:54Z
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
- 2026-10-10T17:36:17Z builder-2: status -> in-progress
- 2026-10-10T17:39:18Z builder-2: status -> in-review
- 2026-10-10T17:47:00Z reviewer-3: claimed under ADR-012 amendment 1 (overflow; PR #56 unclaimed, no reviewer activity); reviewer -> reviewer-3
- 2026-10-10T17:50:10Z reviewer-3: status -> approved
- 2026-10-10T17:59:54Z devops: status -> merging
