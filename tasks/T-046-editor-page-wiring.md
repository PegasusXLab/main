---
id: T-046
title: "Editor page: wire up artwork, publish, autosave and load-by-link"
status: draft
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: [T-036, T-042, T-043, T-044]
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T11:53:31Z
---
## Goal
The editor page uses all the Sprint 2 pieces, so a creator can hang art, publish and keep editing (F3, F7).
## Acceptance criteria
- [ ] Selecting an artwork (or "+ Add object" on a room) shows `ObjectPanel` in the left panel. Art markers (T-043) are on the 2D canvas
- [ ] The Publish button opens `PublishPanel`. After the first publish, the URL changes to `/edit/<id>?key=<k>`, and later saves use the key
- [ ] `/edit/<id>?key=<k>` loads the gallery from `GET /api/galleries/<id>`, keeps the key in memory only, and shows a clear error on 404
- [ ] Autosave (T-036) runs while editing and restores on reload (`/edit/local` and published ids)
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
