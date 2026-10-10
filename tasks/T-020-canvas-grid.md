---
id: T-020
title: "2D canvas: SVG grid with pan and zoom"
status: ready
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-004, T-005]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T09:07:31Z
---
## Goal
The drawing surface for the floor plan. Features: F1.
## Acceptance criteria
- [ ] SVG canvas in meters with a 0.5 m grid; pan by dragging empty space with the middle button or Space held; zoom with the wheel and the [-] / [+] buttons (plan.md §3.2 footer)
- [ ] Exposes a screen ↔ meters conversion for child components
- [ ] Draws the store's rooms as plain rectangles with their names (read-only here)
- [ ] Subscribes to the store per field
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
