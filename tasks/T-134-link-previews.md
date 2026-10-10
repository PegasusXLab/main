---
id: T-134
title: Link previews - title, description and Open Graph image for sharing galleriverse.vercel.app
status: ready
lane: design
assignee: designer-2
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec: ../galleriverse-ui-design (Quang's reference)
updated_by: senior
updated_at: 2026-10-10T20:21:08Z
---
## Goal
A link to Galleriverse pasted into Devpost, Discord, iMessage or Slack shows a branded card, not a bare URL.
## Acceptance criteria
- [ ] Site metadata: `title` "Galleriverse: draw a room, hang your work, open the doors", a one-line description, `metadataBase` = https://galleriverse.vercel.app, theme colour graphite.
- [ ] An Open Graph / Twitter image (1200x630) in the design system (Archivo headline, Klein-blue accent, the kraft/graphite showcase motif), via `src/app/opengraph-image.tsx` (Next ImageResponse, built in) or a static PNG in `public/`.
- [ ] `og:type`, `og:url`, `twitter:card=summary_large_image`; a favicon/apple icon present (reuse existing if any).
- [ ] Verified: the card renders on opengraph.xyz (or an equivalent validator) for the prod URL after merge; screenshot in the PR.
- [ ] No layout/visual change to pages; lint + unit tests pass.
## Files / modules in scope
- src/app/layout.tsx (the `metadata` export only), src/app/opengraph-image.tsx (new) or public/og.png, src/app/twitter-image.tsx (optional)
## Out of scope
- Per-gallery previews for /g/[id] (later, after T-124: `generateMetadata` with the gallery title).
## Build kit
- **Libraries:** none (next/og is built in). **Skills:** `pegasus-ui`.
## Notes
- Queued after T-129. Reviewer: reviewer-3.
## History
- 2026-10-10T20:20:53Z senior: carded; approved by Quang
- 2026-10-10T20:21:08Z senior: status -> ready
