---
id: T-155
title: Showcase gallery - about-me, music, sculpture, video rooms; one room via Gemini
status: draft
lane: infra
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-151, T-152, T-145b]
review_rounds: 0
approved_by_human: false
design_spec:
updated_by: senior
updated_at: 2026-10-11T03:30:00Z
---
## Goal
The demo gallery shows personality: an "About me" story room, a music room with a track, a sculpture room (cutout + GLB/library), a video piece on a TV, and one room kitted via the Gemini mood field (demo phrase answered from demoCache). Serves: demo, Creative track, Gemini visibility.
## Acceptance criteria
- [ ] Built through the production UI after T-151/T-152/T-145b deploy (senior acting as devops), then published. View link and edit link go in plan/hackathon.md (the edit key nowhere else).
- [ ] Demo path passes on it in a fresh Chrome profile: walk every room, video plays, music plays, plaques open.
- [ ] Only CC0 or own media; credits listed in plan/hackathon.md.
## Files / modules in scope
- No code. plan/hackathon.md (Docs).
## Out of scope
- Code changes: if something breaks, card a bugfix instead.
## Build kit
- **Libraries:** none.
## Notes
- Production/demo deploy go-ahead from Quang via team/human/inbox/.
- **Demo priority 1** (start no later than 04:30 EDT with whatever has merged).
## History
- 2026-10-11T03:30:00Z senior: carded (draft)
