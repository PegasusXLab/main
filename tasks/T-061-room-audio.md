---
id: T-061
title: "Room audio: per-room music, crossfade between rooms, mute, tap-to-start"
status: in-review
lane: frontend
assignee: builder-3
reviewer: reviewer-2
branch: feat/T-061-room-audio
pr: 39
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: reviewer-2
updated_at: 2026-10-10T13:12:00Z
---
## Goal
Rooms sound distinct (F9, MVP acceptance item 5).
## Acceptance criteria
- [ ] `howler` added (pinned exact). A small built-in track list (`tracks.ts`) of 3–4 **license-free** ambient loops in `public/audio/`, credited in `public/audio/CREDITS.md`
- [ ] `<RoomAudio gallery currentRoomId />`: plays the room's `music.trackId` (or none). Crossfades ~1.5 s on room change. Includes its own Mute toggle and a "tap to start sound" prompt (browsers block autoplay)
- [ ] Stops and unloads cleanly on unmount. Zero audio work when muted or with no tracks
- [ ] Tests for track resolution and the crossfade schedule (Howler faked)
## Files / modules in scope
`src/audio/tracks.ts`, `src/audio/RoomAudio.tsx`, `src/audio/*.test.ts*`, `public/audio/*`, `package.json` + lockfile (`howler` only)
## Out of scope
Mounting it in the viewer (T-064). The music picker in the panel (T-063). Narration (F10).
## Notes
- **Music source:** license-free only (e.g. CC0). Credit every track. Quang to confirm if the team has its own.
- Read: plan.md §4 F9, §6 Room.music.
## History
- 2026-10-10T12:11:29Z senior: created as Sprint 3 draft (awaiting Quang approval)
- 2026-10-10T12:14:15Z senior: approved by Quang ("yes approved")
- 2026-10-10T12:15:02Z senior: status -> ready
- 2026-10-10T13:06:29Z builder-3: status -> in-progress
- 2026-10-10T13:10:52Z builder-3: status -> in-review
- 2026-10-10T13:12:00Z reviewer-2: claimed under ADR-012 (general reviewer pool)
