---
id: T-071
title: "3D editor preview: blue highlight for the selected room and artwork"
status: merging
lane: frontend
assignee: builder-1
reviewer: reviewer-2
branch: feat/T-071-3d-selection-highlight
pr: 44
sprint: 3
depends_on: [T-070]
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T15:08:13Z
---
## Goal
In the editor's 3D preview, the selected room/artwork is visibly highlighted, like the 2D editor (#2563eb). Requested by Vic.
## Acceptance criteria
- [ ] `<Scene>` gains optional `selectedRoomId` / `selectedArtworkId` (additive; existing props unchanged; the viewer passes neither)
- [ ] The selected room gets a blue outline at floor level and on its wall tops, plus a faint blue floor tint. The selected artwork gets a blue border
- [ ] The editor page passes the store selection (one line)
- [ ] Tests for the selection → highlight mapping, plus a browser check
## Files / modules in scope
`src/viewer3d/Scene.tsx`, `src/viewer3d/Floors.tsx`, `src/viewer3d/Frames.tsx`, `src/app/edit/[id]/page.tsx` (one prop line only)
## Notes
- Polish; do it after T-072 and T-070. Must merge before the 17:09 EDT freeze or be dropped.
## History
- 2026-10-10T13:56:52Z senior: created + approved by Quang
- 2026-10-10T13:57:28Z senior: status -> ready
- 2026-10-10T14:20:29Z builder-1: status -> in-progress
- 2026-10-10T14:23:35Z builder-1: status -> in-review
- 2026-10-10T15:05:58Z reviewer-2: status -> approved
- 2026-10-10T15:08:13Z devops: status -> merging
