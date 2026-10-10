---
id: T-138
title: README refresh for the submission - today's features, screenshots, live link
status: ready
lane: infra
assignee: senior
reviewer: reviewer-2
branch:
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T21:32:25Z
---
## Goal
Judges reading the repo see what Galleriverse does today, how to try it, and how it's built.
## Acceptance criteria
- [ ] README sections updated: a one-paragraph pitch; **Try it** (https://galleriverse.vercel.app, with accounts optional); **Features** incl. today's: accounts + Your galleries, 2D / 3D POV / Top-down editor views, the look foundation (picture lights, PBR floors, frames), free-standing objects + CC0 library, custom room audio (≤4 MB), link previews, phone viewer + map; **How it works** (Gallery JSON → compile() → SceneModel → R3F; Vercel + Vultr Object Storage); **Run locally**; **Team & credits** (keep T-133's CC0 credits + the reference-repo inspiration disclosure).
- [ ] 3-5 fresh screenshots in `docs/media/` (landing, editor 2D, 3D POV, viewer with art + objects), each < 400 KB.
- [ ] No secrets, no internal agent jargon in the README. Links work. Markdown renders on GitHub.
## Files / modules in scope
- README.md, docs/media/* (new images)
## Out of scope
- App code.
## Build kit
- **Libraries:** none.
## Notes
- Built by senior (Quang override). Reviewer: reviewer-2 (Parth).
## History
- 2026-10-10T21:32:23Z senior: carded; approved by Quang ("i approve", 17:29 EDT)
- 2026-10-10T21:32:25Z senior: status -> ready
