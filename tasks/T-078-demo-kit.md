---
id: T-078
title: "Demo kit: README screenshots/GIF + one-command pre-demo check against the live site"
status: ready
lane: infra
assignee: builder-3
reviewer: reviewer
branch:
pr:
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T15:41:41Z
---
## Goal
The README shows the product at a glance, and before every demo run one command proves the live site works end to end.
## Acceptance criteria
- [ ] 3–4 screenshots (editor 2D, editor 3D, viewer with artwork + plaque, an atmosphere room) and one short GIF (build → toggle → tour) in `readme-assets/`, embedded in README.md. Each file under ~2 MB
- [ ] `npm run predemo`: runs the T-051 demo-flow e2e against `https://galliverse.vercel.app/` (via `E2E_BASE_URL`) and prints PASS/FAIL clearly
- [ ] Documented in the README "Demo" section, including the demo-checklist link
## Files / modules in scope
`README.md`, `readme-assets/*`, `package.json` (the `predemo` script only)
## Notes
- T-052 is superseded; take screenshots from any gallery built with team-made images. **Also rename the README title and prose to "Galleriverse"** (product name decided by Quang), and link the live URL.
## History
- 2026-10-10T15:41:05Z senior: created + approved by Quang
- 2026-10-10T15:41:41Z senior: status -> ready
- 2026-10-10T15:44:58Z senior: T-052 dependency removed; README rename to Galleriverse added
