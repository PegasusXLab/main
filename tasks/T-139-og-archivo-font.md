---
id: T-139
title: Link-preview title in Archivo (bundle the font for next/og)
status: in-review
lane: frontend
assignee: senior
reviewer: reviewer-2
branch: t-139-og-archivo
pr: 94
sprint: 4
depends_on: [T-136]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T23:17:01Z
---
## Goal
Shared-link preview cards use the site's display font.
## Acceptance criteria
- [ ] `src/app/g/[id]/opengraph-image.tsx` loads a bundled Archivo (bold, latin subset, ≤ 60 KB, OFL license noted) and renders the title in it; the fallback is the current font if loading fails.
- [ ] Build + unit pass; the preview is checked on a validator after merge.
## Files / modules in scope
- src/app/g/[id]/opengraph-image.tsx, src/app/g/[id]/fonts/Archivo-Bold.ttf (new)
## Out of scope
- Site-wide OG (T-134, designer-2).
## Build kit
- **Libraries:** none.
## Notes
- Queued until T-136 (#83) merges (same file).
## History
- 2026-10-10T21:32:23Z senior: carded; approved by Quang ("i approve", 17:29 EDT)
- 2026-10-10T21:32:31Z senior: status -> ready
- 2026-10-10T22:07:43Z senior: status -> in-progress
- 2026-10-10T23:16:35Z senior: PR #94 (7d22d324): Archivo Bold+Regular (37 KB, OFL), title weight 700; unit 597, build green, local render verified.
- 2026-10-10T23:17:01Z senior: status -> in-review
