---
id: T-148
title: Landing showcase - click a painting to see it big, with its wall label and a "Did you know?" fact
status: in-progress
lane: design
assignee: senior
reviewer: reviewer-3
branch: feat/T-148-showcase-lightbox
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec: ../galleriverse-ui-design (Quang's reference)
updated_by: senior
updated_at: 2026-10-11T03:59:51Z
---
## Goal
Quang (2026-10-11): the conveyor paintings (PR #96, Met Open Access CC0) open in a bigger view with a short fun fact or why the work matters. A marketing moment for the judges: the landing feels like a real museum.
## Acceptance criteria
- [ ] Clicking a painting, or Enter/Space on it, opens a lightbox built on the existing `Dialog` primitive (src/components/ui/Dialog.tsx): the painting fits the viewport, uncropped (object-fit: contain), on a dark wall tone.
- [ ] Beside the painting on desktop, under it on phones: a wall label with the artist, the title in italics, the date and the medium, then **"Did you know?"** with 1-2 sentences (max 240 characters) on a fun fact or why the work matters, then "View at The Met ->" (opens the Met object page in a new tab, rel="noopener").
- [ ] **Facts are true and in our own words.** Each fact comes from the work's Met object page (or the museum's own essay/Heilbrunn timeline), with its source URL stored next to it. Nothing invented, no copy-paste. Check every title/artist/date against the Met Collection API (collectionapi.metmuseum.org/public/collection/v1/objects/<id>) and fix any mismatch in the data and in public/landing/CREDITS.md (e.g. confirm the Water Lilies date).
- [ ] Larger image: one file per work, downloaded once from the Met's CC0 primaryImage (about 1600 px on the longest side, WebP, ≤ 400 KB each) into public/landing/; loaded only when the lightbox opens; the small conveyor image shows at once (scaled up) until the large one loads.
- [ ] Previous/next buttons plus the left/right keys move through all 6 works. Esc, the close button or a backdrop click closes it. Focus is trapped while open and goes back to the painting that opened it. role="dialog", aria-modal, labelled by the title. The conveyor pauses while the dialog is open and resumes after. The aria-hidden second copy of the belt opens the same work on click.
- [ ] Hover/focus on a frame shows a pointer cursor and a subtle lift. Open/close is a ≤ 200 ms fade + scale, none with prefers-reduced-motion.
- [ ] Art data moves out of Showcase.tsx into src/components/landing/showcaseArt.ts (title, artist, date, medium, metId, small, large, alt, fact, factSource, metUrl).
- [ ] Tests: unit (opens on click and Enter; Esc closes and returns focus; arrows cycle and wrap; every work has alt, fact ≤ 240 chars, factSource, metUrl) + a Playwright landing check (open, next, close, 0 console errors). Lint, unit, build green. Desktop + phone screenshots in the PR.
## Files / modules in scope
- src/components/landing/Showcase.tsx (+test), src/components/landing/ShowcaseLightbox.tsx (new, +test), src/components/landing/showcaseArt.ts (new), public/landing/* (large images + CREDITS.md), one e2e landing spec
## Out of scope
- Changing which paintings hang, the conveyor motion (T-129), src/app/page.tsx (T-140/T-146), the 3D gallery.
## Build kit
- **Libraries:** none new. Primitives: Dialog, Button (src/components/ui, T-111). Tokens from T-110. Icons: lucide-react (approved).
## Notes
- Code freeze: Quang requested this after the 18:00 freeze, so it ships only with a reviewer verdict + devops merge + a live smoke, like the auth cards.
- Reviewer: reviewer (Vic), outside Quang's operator.
## History
- 2026-10-11T00:30:15Z senior: carded from Quang's request ("expanded bigger view ... a little fun fact about the art or the significance ... to impress the judges")
- 2026-10-11T00:30:17Z senior: status -> ready
- 2026-10-11T03:59:50Z senior: reassigned designer-2 -> senior by Quang ("make sure the conveyor belt images are clickable ... expanded ... captions and details", ~00:00 EDT); reviewer -> reviewer-3 (Sergio active tonight)
- 2026-10-11T03:59:51Z senior: status -> in-progress
