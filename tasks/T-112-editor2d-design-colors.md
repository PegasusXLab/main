---
id: T-112
title: 2D editor adopts the design colors (Klein blue accent, plaster grid)
status: merged
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 3
depends_on: [T-110]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/tokens-fonts-theme.md
updated_by: devops
updated_at: 2026-10-10T18:08:10Z
---
## Goal
The floor plan matches the new design system (ADR-013): one accent, Klein blue `#002fa7`.
## Acceptance criteria
- [ ] Every `#2563eb` in `src/editor2d/*` is replaced by `THEME.colors.accent` (`src/lib/theme.ts`, T-110); the canvas background, grid and room fill/stroke use THEME plaster / hairline / pencil / graphite / accentSubtle per the spec. No new raw hex in editor2d.
- [ ] Selection, resize handles, "+" add-room buttons and art markers stay clearly visible (contrast at least 3:1 against the canvas).
- [ ] No behaviour change; all ids/testids unchanged; tests updated only where they assert colours.
- [ ] Lint, unit tests, `npm run predemo` pass.
## Files / modules in scope
- src/editor2d/* (Canvas, Grid, RoomShape, ResizeHandles, AddRoomButtons, ArtMarkers + their tests)
## Out of scope
- src/lib/theme.ts and globals.css (designer, T-110), panels, viewer3d.
## Build kit
- **Libraries:** none.
- **Primitives:** none; tokens from `src/lib/theme.ts`.
- **Skills to load:** `pegasus-ui`, `web-design-guidelines`.
- **References:** team/designer__vic/specs/tokens-fonts-theme.md (THEME shape), mockup team/designer__vic/mockups/d000/install-day-editor-1440.png.
## Notes
- Start now using the THEME shape in the spec; rebase onto T-110 when it merges (~15:00 EDT), then PR. Target PR ~16:00 EDT.
## History
- 2026-10-10T17:34:09Z senior: carded; approved by Quang
- 2026-10-10T17:34:16Z senior: status -> ready
- 2026-10-10T17:46:38Z builder-2: status -> in-progress
- 2026-10-10T17:49:46Z builder-2: status -> in-review
- 2026-10-10T18:04:29Z reviewer: status -> approved
- 2026-10-10T18:05:43Z devops: status -> merging
- 2026-10-10T18:05:55Z devops: status -> merged
- 2026-10-10T18:08:10Z devops: status -> merged
