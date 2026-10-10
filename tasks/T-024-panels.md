---
id: T-024
title: Gallery and Room properties panels
status: merging
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-024-panels
pr: 20
sprint: 1
depends_on: [T-004, T-005, T-021]
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T11:18:36Z
---
## Goal
The selection-based side panel. Features: F2.
## Acceptance criteria
- [ ] Nothing selected → GalleryPanel: title, entrance-room dropdown
- [ ] Room selected → RoomPanel: name, description, width, depth, wall height, wall color, floor preset, lighting preset, plus a read-only list of the room's objects (editing comes in Sprint 2)
- [ ] Every field round-trips between panel, canvas and store; numeric edits are snapped; a width or depth below 2 m, or a size that would overlap, is refused with a message
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
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:44Z senior: status -> ready
- 2026-10-10T09:11:43Z senior: AC clarified: refuse sizes below 2 m (reviewer finding on T-004)
- 2026-10-10T11:04:41Z builder-2: status -> in-progress
- 2026-10-10T11:11:52Z builder-2: status -> in-review
- 2026-10-10T11:18:23Z reviewer: status -> approved
- 2026-10-10T11:18:36Z devops: status -> merging
