---
id: T-144
title: BUGFIX - custom room songs don't play; must play on enter, stop on leave, resume where left off on return
status: in-progress
lane: frontend
assignee: senior
reviewer: reviewer-3
branch: t-144-room-custom-audio
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T22:03:26Z
---
## Goal (Quang, 18:05 EDT)
"Custom songs play when I enter the room with its designated custom sound; once I leave the room I don't hear that song anymore; once I come back to that same room, it plays the song where it left off. More immersive."
## Findings so far (senior, read-only)
- Custom URLs (`/api/files/...`) use Howler **html5** mode; `play()` runs inside the async `load` callback, outside a user gesture, so the browser blocks it. There's **no `playerror` handler**, and the gesture retry listeners are `{ once: true }` and registered at mount, so if the first click happens before the song loads, the retry is spent and the song never starts. Built-in tracks (Web Audio) get auto-unlocked, which matches "only custom sounds are silent".
- `/api/files` ignores `Range` (returns 200 with no Accept-Ranges). HTML5 audio can't seek reliably (which breaks resume), and **Safari/iOS won't play HTML5 media without 206 range responses**.
## Acceptance criteria
- [ ] Entering a room with a custom song plays it (after the visitor's first interaction on the page, if the browser requires it). Handle `playerror` with `sound.once('unlock', () => sound.play())` and keep the gesture unlock working for EVERY later room change, not just the first click.
- [ ] Leaving the room fades it out (~0.3-1.5 s) and stops it; the next room's song (custom or built-in) crossfades in; a room without music is silent.
- [ ] Returning resumes from the saved position (saved at leave time, even if paused/fading), clamped by any clip (start/length); different rooms with the same file keep independent positions only if they have different clips (current resumeKey rule).
- [ ] `/api/files/[...key]` supports single-range requests: `Accept-Ranges: bytes`, `206` + `Content-Range` for `Range: bytes=a-b`, `416` when out of range; the full 200 response is unchanged; the users/ deny guard is unchanged.
- [ ] Mute stays respected; no console errors when autoplay is blocked.
- [ ] Tests: unit (resume position saved on leave and restored on return; a playerror leads to an unlock retry; range parsing 200/206/416). A Playwright check with `--autoplay-policy=user-gesture-required`: enter room A (custom WAV) → plays; Next → A stops; Previous → A resumes past its earlier position. Lint, unit, build, publish-view + edit-link e2e green.
## Files / modules in scope
- src/audio/RoomAudio.tsx (+ test), src/audio/tracks.ts (+ test), src/app/api/files/[...key]/route.ts (+ test)
## Out of scope
- The RoomPanel clip-picker UI (#87), the upload route, schema.
## Build kit
- **Libraries:** none (howler is installed).
## Notes
- Quang asked the senior to debug and fix. Bugfix label. Reviewer: reviewer-3 (another operator); devops merges. Push only if green.
## History
- 2026-10-10T22:03:10Z senior: carded from Quang's report + the senior's read-only findings
- 2026-10-10T22:03:15Z senior: status -> ready
- 2026-10-10T22:03:26Z senior: status -> in-progress
