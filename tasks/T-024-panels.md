---
id: T-024
title: Gallery and Room properties panels
status: draft
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-004, T-005, T-021]
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T07:24:55Z
---
## Goal
The selection-based side panel. Features: F2.
## Acceptance criteria
- [ ] Nothing selected → GalleryPanel: title, entrance-room dropdown
- [ ] Room selected → RoomPanel: name, description, width, depth, wall height, wall color, floor preset, lighting preset, plus a read-only list of the room's objects (editing comes in Sprint 2)
- [ ] Every field round-trips between panel, canvas and store; numeric edits are snapped, and a size that would overlap is refused with a message
- [ ] Delete-room button
## Files / modules in scope
`src/panels/GalleryPanel.tsx`, `src/panels/RoomPanel.tsx`
## Out of scope
ObjectPanel and music fields (Sprints 2–3). Publish links.
## Notes
- Read: plan.md §3.2 (panel by selection), §4 F2; plan/architecture.md §4.
- The overlap check imports `src/editor2d/overlap.ts` (read-only; owned by T-021).
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
