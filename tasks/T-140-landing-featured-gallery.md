---
id: T-140
title: Landing - 'See a featured gallery' link to the team's demo gallery
status: ready
lane: design
assignee: designer-2
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-146]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-11T00:26:29Z
---
## Goal
Judges open the demo gallery from the landing page in one click.
## Acceptance criteria
- [ ] A secondary CTA "See a featured gallery" on the landing page linking to `/g/<featured id>`, set by a single constant `FEATURED_GALLERY_ID` (or an env `NEXT_PUBLIC_FEATURED_GALLERY_ID`); hidden when unset.
- [ ] The design system (T-111 Button, outline variant); keyboard and 390 px OK; ids/testids unchanged.
## Files / modules in scope
- src/app/page.tsx (CTA only), src/components/landing/* (if needed) EXCEPT Showcase*/showcaseArt (T-148)
## Out of scope
- Building the demo gallery (Quang, at demo time).
## Build kit
- **Libraries:** none. **Primitives:** Button.
## Notes
- Queued after T-134. Quang gives the gallery id once the demo gallery exists; until then the CTA is hidden.
## History
- 2026-10-10T21:32:23Z senior: carded; approved by Quang ("i approve", 17:29 EDT)
- 2026-10-10T21:32:35Z senior: status -> ready
- 2026-10-11T00:26:29Z senior: depends on T-146 (both edit src/app/page.tsx); start after T-146 merges
- 2026-10-11T00:30:15Z senior: scope excludes Showcase*/showcaseArt (owned by T-148)
