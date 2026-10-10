---
id: T-090
title: "[P1] Compress artwork textures on a Vultr server at upload"
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer-2
branch:
pr:
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T07:50:00Z
---
## Goal
Galleries with many artworks stay smooth on weaker laptops: each uploaded image is also converted to a GPU-ready compressed texture, which loads faster and uses far less graphics memory. Features: F3, F5, plan.md §7.
## Acceptance criteria
- [ ] (to be refined at Sprint 3 planning) After an upload, a Vultr worker produces a compressed texture next to the WebP files in the bucket; the renderer prefers it and falls back to WebP
- [ ] Upload never waits on compression; galleries work if the worker is down
## Files / modules in scope
TBD at Sprint 3 planning (will not overlap the Sprint 2 upload/API cards).
## Out of scope
Changing the browser-side resize (ADR-009). Lighting baking (T-091).
## Notes
- **Budget:** needs a Vultr server; Quang must approve a spending limit before this goes ready.
- Depends on Sprint 2's `/api/upload` and Frames existing. Exact depends_on is set at Sprint 3 planning.
- Reference R3 (plan/reference-basement.md): Basement ships compressed textures; we'd produce ours at upload instead of by hand.
## History
- 2026-10-10T07:50:00Z senior: created as draft P1 idea (Quang: use Vultr for graphics heavy lifting)
- 2026-10-10T16:00:57Z senior: reviewer -> reviewer-2 (same-operator rule; reviewer's catch)
