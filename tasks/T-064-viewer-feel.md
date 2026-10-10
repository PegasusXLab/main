---
id: T-064
title: "Viewer: mount room audio and atmosphere with Mute in the title bar"
status: in-progress
lane: frontend
assignee: builder-1
reviewer: reviewer-2
branch:
pr:
sprint: 3
depends_on: [T-035, T-060, T-061]
review_rounds: 0
approved_by_human: true
updated_by: builder-1
updated_at: 2026-10-10T13:15:02Z
---
## Goal
Visitors hear and see each room's mood while touring (F9 + F11 in the viewer, wireframe plan.md §3.5 "Mute").
## Acceptance criteria
- [ ] The viewer page mounts `<RoomAudio>` with the current room and shows its Mute toggle in the title bar. Atmosphere follows the current room (via Scene)
- [ ] Manual check: walk through 3 rooms on the live link and confirm distinct look and sound, with mute working
## Files / modules in scope
`src/app/g/[id]/page.tsx` (added 2026-10-10T12:48:00Z now that T-035 has merged)
## Out of scope
Editor-side audio.
## History
- 2026-10-10T12:11:29Z senior: created as Sprint 3 draft (awaiting Quang approval)
- 2026-10-10T12:14:15Z senior: approved by Quang ("yes approved")
- 2026-10-10T12:15:16Z senior: status -> ready
- 2026-10-10T12:55:26Z senior: reviewer -> reviewer-2 (reviewer-3 session became devops)
- 2026-10-10T13:15:02Z builder-1: status -> in-progress
