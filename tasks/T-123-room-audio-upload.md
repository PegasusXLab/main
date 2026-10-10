---
id: T-123
title: Room audio - creators upload their own MP3/WAV/OGG/M4A; plays when visitors enter the room
status: in-review
lane: backend
assignee: builder-1
reviewer: reviewer-2
branch: feat/room-audio-upload-autoplay
pr: 70
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: builder-1
updated_at: 2026-10-10T19:17:58Z
---
## Goal
Creators can set a room's soundtrack to their own audio file (Quang approved for today, 15:15 EDT). It retro-cards Vic's PR #70.
## Acceptance criteria
- [ ] `POST /api/upload/audio` accepts only MP3, WAV, OGG and M4A up to 15 MB. It checks the **file signature (magic bytes)**, not just the extension or Content-Type; rejects anything else with 400 / 413; stores under `audio/<random-id>.<ext>`; returns the `/api/files/audio/...` URL.
- [ ] `/api/files` serves audio with the correct `audio/*` Content-Type and `X-Content-Type-Options: nosniff`; it never serves an uploaded file as HTML/SVG/JS.
- [ ] RoomPanel: "Custom audio (upload)" option in Music Track with upload progress/errors and a preview; built with T-111 primitives and tokens (keep the T-116 look); existing ids/testids/labels unchanged; preset tracks still work.
- [ ] Viewer: the room's custom track plays on entering the room and crossfades like the presets. Browsers block sound before a user gesture, so playback starts on the first interaction (or after the existing "enable sound" control); there's no console error when autoplay is blocked; the mute control is respected.
- [ ] **No Gallery schema change** beyond what's already allowed for the room track (a URL string in the existing music field). If the PR adds a schema field, stop and tell the senior first.
- [ ] Unit tests (upload validation incl. a renamed non-audio file being rejected, size limit, RoomAudio custom URL); lint, unit tests, publish-view + editor e2e and `npm run predemo` pass.
## Files / modules in scope
- src/app/api/upload/audio/route.ts (+test), src/audio/RoomAudio.tsx (+test), src/panels/RoomPanel.tsx (+test), src/app/api/files/[...key]/route.ts (content-type/nosniff only, if needed)
## Out of scope
- Image upload, other panels, the landing page (T-122), any new dependency.
## Build kit
- **Libraries:** none (howler is already installed). **Primitives:** Button, Select, Label from `src/components/ui`.
## Notes
- **Quang approved 2026-10-10 15:15 EDT. Hard rule: merged by 16:15 EDT or dropped.**
- Reviewer: reviewer-2 (Parth). The author is Vic, so not reviewer. Security focus: magic-byte validation, size cap, served content-type, no stored XSS.
- Vercel *preview* of #70 deployed fine, which suggests the production failure on 2f742c9 was transient.
## History
- 2026-10-10T19:14:55Z senior: retro-carded PR #70; approved by Quang
- 2026-10-10T19:14:56Z senior: status -> ready
- 2026-10-10T19:16:21Z builder-1: status -> in-progress
- 2026-10-10T19:17:58Z builder-1: status -> in-review
