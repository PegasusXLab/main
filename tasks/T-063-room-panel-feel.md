---
id: T-063
title: "Room panel: atmosphere preset and music pickers"
status: in-progress
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 3
depends_on: [T-060, T-061]
review_rounds: 0
approved_by_human: true
updated_by: builder-2
updated_at: 2026-10-10T13:12:22Z
---
## Goal
Creators choose each room's mood and music (F11 + F9 controls).
## Acceptance criteria
- [ ] RoomPanel gains an Atmosphere select (the 4 presets + custom) and a Music select (none + tracks from `src/audio/tracks.ts`), writing `room.atmosphere` / `room.music` via `updateRoom`
- [ ] Custom shows the simple sliders (mood color, haze, brightness, light direction, grain) from plan.md §6
- [ ] Tests for both selects
## Files / modules in scope
`src/panels/RoomPanel.tsx`, `src/panels/RoomPanel.test.tsx`
## Out of scope
Rendering (T-060) and playback (T-061).
## History
- 2026-10-10T12:11:29Z senior: created as Sprint 3 draft (awaiting Quang approval)
- 2026-10-10T12:14:15Z senior: approved by Quang ("yes approved")
- 2026-10-10T12:15:12Z senior: status -> ready
- 2026-10-10T13:12:22Z builder-2: status -> in-progress
