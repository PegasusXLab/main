---
id: T-035
title: "Viewer page /g/[id]: tour, Previous/Next, artwork plaque"
status: ready
lane: frontend
assignee: builder-1
reviewer: reviewer-3
branch:
pr:
sprint: 2
depends_on: [T-031, T-034]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T09:47:45Z
---
## Goal
Anyone with the view link can tour the gallery without instructions (F8 done-criteria, wireframe plan.md §3.5).
## Acceptance criteria
- [ ] `/g/[id]` loads the gallery from `GET /api/galleries/[id]` (a friendly 404 page if missing), compiles it, and shows a full-screen `<Scene mode="travel">` starting in the entrance room
- [ ] Previous / Next room buttons use `roomOrder()`: breadth-first from the entrance through doorways, ties broken by document order, unconnected rooms last (ADR-007, Q8). Unit-tested
- [ ] Clicking a floor or doorway flies to that room. Clicking art faces it and opens an HTML plaque (title, artist, story). Esc or Close closes it
- [ ] Title bar with the gallery title. No editing UI, and the edit key is never needed or shown
- [ ] Works on the sample fixture published locally (local storage adapter)
## Files / modules in scope
`src/app/g/[id]/page.tsx`, `src/viewer3d/Plaque.tsx`, `src/viewer3d/roomOrder.ts`, `src/viewer3d/roomOrder.test.ts`
## Out of scope
Audio and Mute (F9), narration (F10), atmosphere (F11).
## Notes
- Read: plan.md §3.5, §4 F8; ADR-002, ADR-007; Gotchas (Next 16.4 dynamic route params with Cache Components: read the installed docs).
## History
- 2026-10-10T09:44:04Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T09:47:19Z senior: approved by Quang ("approve")
- 2026-10-10T09:47:45Z senior: status -> ready
- 2026-10-10T10:53:06Z senior: reviewer -> reviewer-2 (ADR-011)
- 2026-10-10T11:27:06Z senior: reviewer -> reviewer-3 (overflow, ADR-012), so Parth can focus on builder-2
