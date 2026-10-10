---
id: T-064
title: "Viewer: mount room audio and atmosphere with Mute in the title bar"
status: ready
lane: frontend
assignee: builder-1
reviewer: reviewer-3
branch:
pr:
sprint: 3
depends_on: [T-035, T-060, T-061]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T12:15:16Z
---
## Goal
Visitors hear and see each room's mood while touring (F9 + F11 in the viewer, wireframe plan.md §3.5 "Mute").
## Acceptance criteria
- [ ] The viewer page mounts `<RoomAudio>` with the current room and shows its Mute toggle in the title bar. Atmosphere follows the current room (via Scene)
- [ ] Manual check: walk through 3 rooms on the live link and confirm distinct look and sound, with mute working
## Files / modules in scope
The viewer page file (src/app/g/[id]/page.tsx). It's added to this list by the senior once T-035 has merged; until then nothing here is in scope.
## Out of scope
Editor-side audio.
## History
- 2026-10-10T12:11:29Z senior: created as Sprint 3 draft (awaiting Quang approval)
- 2026-10-10T12:14:15Z senior: approved by Quang ("yes approved")
- 2026-10-10T12:15:16Z senior: status -> ready
