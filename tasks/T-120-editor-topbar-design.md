---
id: T-120
title: Editor top bar adopts the design system (Klein-blue Publish, 2D/3D toggle) + minimap colors
status: approved
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-120-editor-topbar-design
pr: 66
sprint: 3
depends_on: [T-110, T-111]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/editor-primitives.md
updated_by: reviewer
updated_at: 2026-10-10T18:57:07Z
---
## Goal
Finish the editor restyle: the top bar and minimap use the shared primitives and tokens (ADR-013), with no leftover ad-hoc colors.
## Acceptance criteria
- [ ] EditorShell top bar: Publish uses `Button` variant primary (Klein blue), the 2D/3D switch uses `Toggle` (active state per spec), and the gallery-name field uses `Input` (+ `Label`). Undo/redo buttons (if in the bar) use `Button` ghost/icon with a `Tooltip` showing the shortcut.
- [ ] Minimap: doorway marks (amber `#fbbf24`) and other raw hexes become THEME tokens (doorways = pencil or hairline; current room stays accent). No new raw hex in either file.
- [ ] Behaviour unchanged; **every id / data-testid / aria-label / accessible name unchanged** (e2e uses `getByRole('button', {name: 'Publish'})`, '2D', '3D').
- [ ] Lint, unit tests, editor + publish-view e2e and the phone matrix pass.
## Files / modules in scope
- src/components/EditorShell.tsx, src/viewer3d/Minimap.tsx (+ their tests)
## Out of scope
- Panels (T-116, done), PublishPanel, editor2d, viewer page/HUD (T-121), src/components/ui/*.
## Build kit
- **Libraries:** none. **Primitives:** Button, Toggle, Input, Label, Tooltip. **Skills:** `pegasus-ui`, `web-design-guidelines`.
- **References:** team/designer__vic/specs/editor-primitives.md, mockup team/designer__vic/mockups/d000/install-day-editor-1440.png.
## Notes
- Target PR ~15:30 EDT; hard stop 16:30.
## History
- 2026-10-10T18:33:51Z senior: carded; approved by Quang
- 2026-10-10T18:33:53Z senior: status -> ready
- 2026-10-10T18:34:16Z builder-2: status -> in-progress
- 2026-10-10T18:40:19Z builder-2: status -> in-review
- 2026-10-10T18:57:07Z reviewer: status -> approved
