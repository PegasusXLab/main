---
id: T-137
title: BUGFIX - audio upload: M4A must be audio (check the ftyp brand), not any MP4
status: merging
lane: backend
assignee: senior
reviewer: human
branch: t-137-m4a-brand-check
pr: 80
sprint: 4
depends_on: [T-125]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: devops
updated_at: 2026-10-10T21:34:23Z
---
## Goal
A video .mp4 renamed to .m4a is rejected (reviewer-3's follow-up on T-123).
## Acceptance criteria
- [ ] For the MP4 container (`ftyp` at offset 4), accept only audio brands: `M4A `, `M4B `, `M4P `, `F4A `, `F4B `; plus `mp42`/`isom` ONLY if a quick scan of the first 64 KB finds no `vide` handler (`hdlr` ... `vide`). Otherwise 400 with the existing format message.
- [ ] MP3/WAV/OGG behaviour unchanged; the 4 MB cap unchanged.
- [ ] Unit tests: an M4A brand passes; an `isom` with a `vide` hdlr is rejected; an `isom` audio-only passes; existing tests stay green.
## Files / modules in scope
- src/app/api/upload/audio/route.ts (+ route.test.ts)
## Out of scope
- Client, RoomAudio, other uploads.
## Build kit
- **Libraries:** none.
## Notes
- Built by senior (Quang override). Reviewer: reviewer-2 (Parth), another operator. Bugfix label.
## History
- 2026-10-10T20:42:00Z senior: carded; approved by Quang
- 2026-10-10T20:42:19Z senior: status -> ready
- 2026-10-10T20:43:33Z senior: status -> in-progress
- 2026-10-10T20:45:06Z senior: Quang reviews this card himself (one-time exception to the same-operator rule, his call).
- 2026-10-10T20:55:30Z senior: status -> in-review
- 2026-10-10T21:19:44Z human: status -> approved
- 2026-10-10T21:31:33Z senior: Quang approved ("i approve", 17:29 EDT; he is the reviewer). Supersedes the ambiguous 21:19Z 'human' record.
- 2026-10-10T21:34:23Z devops: status -> merging
