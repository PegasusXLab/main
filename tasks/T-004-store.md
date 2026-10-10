---
id: T-004
title: Gallery store (zustand) with the frozen contract
status: merging
lane: backend
assignee: builder-1
reviewer: reviewer
branch: feat/T-004-store
pr: 6
sprint: 0
depends_on: [T-003]
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T09:03:26Z
---
## Goal
The one place the document lives in the browser. builder-2 codes the editor against it. Features: F1, F2, F6.
## Acceptance criteria
- [ ] Implements exactly the state and action names in plan/architecture.md §4
- [ ] Actions snap rects to 0.5 m and bump `updatedAt`; `addRoom` / `addArtwork` return the new id
- [ ] `deleteRoom` removes its artworks and moves the entrance to the first remaining room; deleting the last room is refused
- [ ] Initial state loads `src/fixtures/sample-3room.json` when no document is given
- [ ] Unit tests for every action, including the entrance rule
- [ ] No autosave or network yet
## Files / modules in scope
`src/store/gallery.ts`, `src/store/gallery.test.ts`
## Out of scope
Overlap checks (editor2d does them before calling; T-021). Autosave/publish (Sprint 2). Any UI.
## Notes
- Read: plan/architecture.md §4; plan.md §6, §8.
- Lane: data layer → builder-1.
- Reference R11: components subscribe per field; any setter that may run every frame must not notify when the value is unchanged.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T07:54:17Z senior: status -> ready
- 2026-10-10T08:58:18Z builder-1: status -> in-progress
- 2026-10-10T09:01:08Z builder-1: status -> in-review
- 2026-10-10T09:02:41Z reviewer: status -> approved
- 2026-10-10T09:03:26Z devops: status -> merging
