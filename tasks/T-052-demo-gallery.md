---
id: T-052
title: "Seeded demo gallery and a one-command publish script"
status: ready
lane: infra
assignee: builder-3
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T11:13:37Z
---
## Goal
A polished, ready-made gallery to demo with, so the demo never depends on building one live (plan.md §10, Sprint 4 "seeded demo gallery").
## Acceptance criteria
- [ ] `demo/demo-gallery.json`: 3–4 connected rooms with distinct wall colors and lighting presets, and 6–8 artworks with real titles, artists and stories. Passes `validate`
- [ ] `demo/images/`: the artwork images, **team-made or with written permission only** (plan.md §13: demo artwork source is still an open decision for Quang)
- [ ] `demo/publish-demo.ts` (run with `npx tsx demo/publish-demo.ts <baseUrl>`): uploads the images through `/api/upload`, rewrites the URLs, publishes through `/api/galleries`, and prints the view and edit links. The edit key is printed once to the terminal only, never written to a file in the repo
- [ ] Works against `http://localhost:3000` and against the Vercel URL
## Files / modules in scope
`demo/demo-gallery.json`, `demo/images/*`, `demo/publish-demo.ts`, `demo/README.md`
## Out of scope
App code. Choosing the artwork source (Quang decides).
## Notes
- Blocked on content until Quang answers plan.md §13 "Demo artwork source". The script and room layout can be built first with placeholder images.
## History
- 2026-10-10T11:09:19Z senior: created as draft for builder-3 (ADR-012)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:37Z senior: status -> ready
- 2026-10-10T11:58:34Z senior: DEFERRED until after 9 am EDT (Quang's crunch plan). Stays ready; don't start before the critical path is done.
