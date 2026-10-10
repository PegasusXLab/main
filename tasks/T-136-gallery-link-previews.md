---
id: T-136
title: Per-gallery link previews: /g/<id> shares show that gallery's title + an OG image
status: merged
lane: frontend
assignee: senior
reviewer: human
branch: t-136-gallery-link-previews
pr: 83
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: devops
updated_at: 2026-10-10T21:47:50Z
---
## Goal
A shared gallery link (Devpost, Discord, iMessage) shows the gallery's own title and a branded preview card.
## Acceptance criteria
- [ ] `src/app/g/[id]/layout.tsx` (new) exports `generateMetadata`: title "<Gallery title> · Galleriverse", description "A 3D gallery. Walk through it in your browser.", og:url, twitter:card=summary_large_image. Unknown id → the default site metadata (no throw, no 500).
- [ ] `src/app/g/[id]/opengraph-image.tsx` (new, next/og, built in): 1200x630, the gallery title in Archivo-style bold on plaster, a Klein-blue accent bar, the "Galleriverse" wordmark, and the room count. Never includes the edit key or any private data.
- [ ] Reads the gallery through the existing storage/galleries read path (no new public endpoint); cached sensibly (revalidate ≤ 5 min).
- [ ] `/g/[id]` page behaviour unchanged; publish-view e2e passes. Verified on a validator after merge (screenshot).
## Files / modules in scope
- src/app/g/[id]/layout.tsx (new), src/app/g/[id]/opengraph-image.tsx (new) (+ a unit test for the metadata function)
## Out of scope
- src/app/g/[id]/page.tsx (T-124), site-wide metadata (T-134, designer-2).
## Build kit
- **Libraries:** none (next/og built in). **Skills:** `pegasus-ui`.
## Notes
- Built by senior (Quang override). Reviewer: reviewer (Vic), another operator.
## History
- 2026-10-10T20:42:00Z senior: carded; approved by Quang
- 2026-10-10T20:42:04Z senior: status -> ready
- 2026-10-10T20:43:46Z senior: status -> in-progress
- 2026-10-10T20:45:06Z senior: Quang reviews this card himself (one-time exception to the same-operator rule, his call).
- 2026-10-10T21:08:24Z senior: status -> in-review
- 2026-10-10T21:29:23Z human: status -> approved
- 2026-10-10T21:31:33Z senior: Quang approved ("i approve", 17:29 EDT; he is the reviewer). Supersedes the ambiguous 21:19Z 'human' record.
- 2026-10-10T21:47:40Z devops: status -> merging
- 2026-10-10T21:47:50Z devops: status -> merged
