---
id: T-025
title: Editor page with 2D / 3D toggle (Sprint 1 integration)
status: merged
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-025-editor-page
pr: 22
sprint: 1
depends_on: [T-013, T-021, T-022, T-023, T-024]
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T11:37:05Z
---
## Goal
The Sprint 1 checkpoint: build 3 rooms in 2D → toggle → see them in 3D. Features: F1, F2, F5, F6 (toggle only).
## Acceptance criteria
- [ ] `/edit/local` renders EditorShell: the panel on the left, the 2D canvas or the 3D Scene in the main area depending on `view`
- [ ] The 3D view shows `compile(gallery)` from the store, recompiled when the gallery changes; editing in the panel while in 3D updates the scene
- [ ] The 3D canvas is loaded lazily (no three.js in the initial 2D page load)
- [ ] Manual check locally (`npm run dev`, http://localhost:3000/edit/local): from blank, add 3 connected rooms, toggle, see walls with doorways. Screenshots in the handoff note
## Files / modules in scope
`src/app/edit/[id]/page.tsx`
## Out of scope
Autosave, publish, the viewer page, the start screen, the fly-to camera.
## Notes
- Read: plan.md §3.2, §3.4, §10; plan/architecture.md §1; plan/sprints/sprint-1.md (checkpoint).
- Reference Top idea 3: R1 (render on demand), R11 (per-field subscriptions).
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T09:07:47Z senior: status -> ready
- 2026-10-10T11:20:07Z builder-2: status -> in-progress
- 2026-10-10T11:26:41Z builder-2: status -> in-review
- 2026-10-10T11:31:46Z reviewer: status -> approved
- 2026-10-10T11:37:05Z devops: status -> merged
