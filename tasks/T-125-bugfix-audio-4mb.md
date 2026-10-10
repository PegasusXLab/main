---
id: T-125
title: BUGFIX - audio upload: cap at 4 MB with a clear message (Vercel body limit)
status: in-progress
lane: backend
assignee: builder-3
reviewer: reviewer
branch:
pr:
sprint: 4
depends_on: [T-123]
review_rounds: 0
approved_by_human: true
design_spec: 
updated_by: builder-3
updated_at: 2026-10-10T20:01:53Z
---
## Goal
Uploads over ~4.5 MB fail in prod with 413 FUNCTION_PAYLOAD_TOO_LARGE (senior, verified live with 5.2 MB). Make the limit honest.
## Acceptance criteria
- [ ] Server: `/api/upload/audio` rejects bodies over **4 MB** with 413 and JSON `{error: "Audio files can be up to 4 MB. Try a shorter clip or a 128 kbps MP3."}`.
- [ ] Client (RoomPanel upload): check `file.size` BEFORE uploading and show the same message inline; the hint text says "MP3, WAV, OGG or M4A, up to 4 MB". No request is sent for oversize files.
- [ ] Tests: 4 MB + 1 byte rejected client- and server-side; 3.9 MB accepted (unit). Live check: 3.5 MB uploads OK on prod after merge.
## Files / modules in scope
- src/app/api/upload/audio/route.ts (+test), src/panels/RoomPanel.tsx (+test; upload hint/check only)
## Out of scope
- Presigned direct-to-Vultr uploads (post-hackathon).
## Build kit
- **Libraries:** none.
## Notes
- Queued after T-128. Bugfix, so allowed any time.
## History
- 2026-10-10T19:59:34Z senior: carded; approved by Quang ("just 1-5", 16:00 EDT)
- 2026-10-10T19:59:35Z senior: status -> ready
- 2026-10-10T20:01:53Z builder-3: status -> in-progress
