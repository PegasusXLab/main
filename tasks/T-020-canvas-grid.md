---
id: T-020
title: "2D canvas: SVG grid with pan and zoom"
status: approved
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-020-canvas-grid
pr: 8
sprint: 1
depends_on: [T-004, T-005]
review_rounds: 2
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T09:32:50Z
---
## Goal
The drawing surface for the floor plan. Features: F1.
## Acceptance criteria
- [x] SVG canvas in meters with a 0.5 m grid; pan by dragging empty space with the middle button or Space held; zoom with the wheel and the [-] / [+] buttons (plan.md §3.2 footer)
- [x] Exposes a screen ↔ meters conversion for child components
- [x] Draws the store's rooms as plain rectangles with their names (read-only here)
- [x] Subscribes to the store per field
## Files / modules in scope
`src/editor2d/Canvas.tsx`, `src/editor2d/Grid.tsx`
## Out of scope
Selecting, moving, resizing, adding rooms (T-021 to T-023). Touch (Q10).
## Notes
- Read: plan.md §3.2, §4 F1; plan/architecture.md §2, §4.
- Reference R11: per-field subscriptions.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:31Z senior: status -> ready
- 2026-10-10T09:09:30Z builder-2: status -> in-progress
- 2026-10-10T09:13:00Z builder-2: PR #8 opened (feat/T-020-canvas-grid)
- 2026-10-10T09:13:30Z builder-2: status -> in-review
- 2026-10-10T09:15:57Z reviewer: status -> changes-requested
- 2026-10-10T09:20:00Z builder-2: addressed round 1 review (commit 109869d)
- 2026-10-10T09:20:30Z builder-2: status -> in-review
- 2026-10-10T09:26:51Z reviewer: status -> changes-requested
- 2026-10-10T09:30:00Z builder-2: addressed round 2 review (commit ac2a0cb)
- 2026-10-10T09:30:30Z builder-2: status -> in-review
- 2026-10-10T09:32:50Z reviewer: status -> approved
