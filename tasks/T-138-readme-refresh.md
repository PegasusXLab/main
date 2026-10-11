---
id: T-138
title: README refresh for the submission - today's features, screenshots, live link
status: merged
lane: infra
assignee: senior
reviewer: reviewer-2
branch: t-138-readme-refresh
pr: 86
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: devops
updated_at: 2026-10-10T21:58:02Z
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
- 2026-10-10T21:33:21Z senior: status -> in-progress
- 2026-10-10T21:37:19Z senior: PR #86 (bf1d86e4). Screenshots in readme-assets/ (the existing folder) instead of docs/media/. Claims verified against origin/main 140c07e2; per-gallery previews (#83) and the add-object flow (T-132) aren't claimed yet; update after they merge.
- 2026-10-10T21:37:23Z senior: status -> in-review
- 2026-10-10T21:54:34Z reviewer-2: status -> approved
- 2026-10-10T21:57:52Z devops: status -> merging
- 2026-10-10T21:58:02Z devops: status -> merged
