---
id: T-159
title: Logo mark next to the Galleriverse wordmark (landing header, /login, /register)
status: merged
lane: design
assignee: senior
reviewer: reviewer
branch: feat/T-159-logo-mark
pr:
sprint: 4
depends_on: [T-158]
review_rounds: 0
approved_by_human: true
design_spec: Quang's favicon-3-corner.svg (T-158)
updated_by: devops
updated_at: 2026-10-11T08:36:39Z
---
## Goal
Quang: "have the favicon also be right next to the Galleriverse on the top left as well."
## Acceptance criteria
- [ ] The tab icon shows at 24 px left of the "Galleriverse" wordmark, vertically centred, 8 px gap: landing header and the /login + /register pages.
- [ ] Decorative (aria-hidden); the link's accessible name stays "Galleriverse".
- [ ] Same shapes and colours as src/app/icon.svg (a unit test checks it).
- [ ] Lint, unit, typecheck, build green.
## Files / modules in scope
- src/components/brand/LogoMark.tsx (+test, new), src/app/page.tsx (header link only), src/components/auth/AuthPage.tsx (wordmark link only)
## Out of scope
- Editor and viewer headers (they show no wordmark), the OG images.
## Build kit
- **Libraries:** none.
## Notes
- T-140 (designer-2, not started) also edits src/app/page.tsx; this card touches only the header link, so a rebase is trivial.
- Built by senior; reviewer: reviewer (Vic); devops merges. Before the 06:00 EDT freeze.
## History
- 2026-10-11T08:30:01Z senior: carded from Quang's request; built on feat/T-159-logo-mark (d7d89727)
- 2026-10-11T08:30:02Z senior: status -> ready
- 2026-10-11T08:30:07Z senior: status -> in-review
- 2026-10-11T08:36:39Z devops: status -> merged
