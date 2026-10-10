---
id: T-046
title: "Editor page: wire up artwork, publish, autosave and load-by-link"
status: merging
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr: 37
sprint: 2
depends_on: [T-042, T-044]
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T13:06:38Z
---
## Goal
The editor page uses all the Sprint 2 pieces, so a creator can hang art, publish and keep editing (F3, F7).
## Acceptance criteria
- [ ] Selecting an artwork (or "+ Add object" on a room) shows `ObjectPanel` in the left panel. Art markers (T-043) are on the 2D canvas
- [ ] The Publish button opens `PublishPanel`. After the first publish, the URL changes to `/edit/<id>?key=<k>`, and later saves use the key
- [ ] `/edit/<id>?key=<k>` loads the gallery from `GET /api/galleries/<id>`, keeps the key in memory only, and shows a clear error on 404
- [ ] Autosave (T-036) and art markers (T-043): wire them in **only if already merged**; otherwise leave them out (9 am crunch; they come after)
- [ ] The 3D view passes `onFrameClick` / `mode="orbit"` to `<Scene>` (T-034 props)
- [ ] Manual check locally: hang 2 artworks, publish, reload the edit link, edit, and save
## Files / modules in scope
`src/app/edit/[id]/page.tsx`
## Out of scope
The viewer page (T-035). Server routes.
## Notes
- Read: plan.md §3.2–§3.4, §4 F3/F7; architecture §4; the merged T-036/T-042/T-043/T-044 components.
## History
- 2026-10-10T11:53:31Z senior: created as draft after T-025 merged (awaiting Quang approval)
- 2026-10-10T11:58:34Z senior: approved by Quang (9 am crunch plan)
- 2026-10-10T11:58:34Z senior: depends only on T-042 + T-044 (9 am crunch); autosave/markers optional
- 2026-10-10T11:58:41Z senior: status -> ready
- 2026-10-10T12:42:05Z builder-2: status -> in-progress
- 2026-10-10T12:46:23Z builder-2: status -> in-review
- 2026-10-10T12:49:07Z reviewer: status -> approved
- 2026-10-10T13:06:38Z devops: status -> merging
