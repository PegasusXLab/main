---
id: T-007
title: "Store: clamp room width/depth to the 2 m minimum"
status: in-progress
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: builder-1
updated_at: 2026-10-10T09:44:20Z
---
## Goal
The store never holds a room smaller than 2 × 2 m, whichever UI calls it. Found by the reviewer on PR #6 (T-004): `updateRoom(id, { w: 0.2 })` snaps to `w = 0`, which then fails `validate`. Features: F1, F2.
## Acceptance criteria
- [ ] `addRoom` / `updateRoom` clamp `w` and `d` to at least `MIN_ROOM_SIZE` after snapping
- [ ] Unit test: `updateRoom(id, { w: 0.2 })` gives `w = 2`; an existing valid size is unchanged
- [ ] No change to the store's public contract (architecture.md §4)
## Files / modules in scope
`src/store/gallery.ts`, `src/store/gallery.test.ts`
## Out of scope
UI-side clamping (T-022 resize, T-024 panels already refuse sizes under 2 m).
## Notes
- builder-1 has the fix ready locally (commit 40f7c97); it's a one-line change plus a test.
- Defense in depth: the UI cards still enforce the minimum themselves.
## History
- 2026-10-10T09:11:43Z senior: created as draft follow-up to T-004 (awaiting Quang approval)
- 2026-10-10T09:43:25Z senior: approved by Quang ("get builder1 to do it")
- 2026-10-10T09:43:26Z senior: status -> ready
- 2026-10-10T09:44:20Z builder-1: status -> in-progress
