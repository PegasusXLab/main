---
id: T-143
title: Landing hanging wall - real public-domain artworks from the Art Institute of Chicago (AIC)
status: blocked
lane: frontend
assignee: senior
reviewer: reviewer-2
branch: t-143-aic-artworks
pr:
sprint: 4
depends_on: [T-129, T-138]
review_rounds: 0
approved_by_human: true
design_spec: Quang's pasted spec (2026-10-10 17:52 EDT), summarized below
updated_by: senior
updated_at: 2026-10-11T00:05:59Z
---
## Goal
Replace the placeholder frames on the landing hanging wall with 10 real, curated public-domain artworks from AIC, downloaded once into the repo (no AIC calls at page load).
## Acceptance criteria
- [ ] **API rules:** only `is_public_domain = true` works; every request sends `AIC-User-Agent: Galleriverse (https://galleriverse.vercel.app)`; requests one at a time with a 1 s delay (≤ 60/min); only title/artist/date/medium/classification (CC0) are used, **never `description`**; image URLs are built from the API's `config.iiif_url` as `{iiif_url}/{image_id}/full/843,/0/default.jpg`.
- [ ] **Step 1:** `scripts/aic/search.ts` runs the 10 queries (interior, window, architecture, room, light, woodblock print, photograph, textile, drawing, blue) with `query[term][is_public_domain]=true`, limit=30, and the listed fields; drops results without image_id/thumbnail size; aspect = h/w; writes `scripts/aic/candidates.json` + `candidates.html` (400 px previews with id, title, artist, date, medium, classification, aspect).
- [ ] **Step 2:** a proposed shortlist of 10 meeting the mix (≥1 painting, woodblock print, photograph, drawing, textile/poster; ≥3 portrait aspect > 1.2, ≥3 landscape < 0.8, 2 near-square; muted blues/greys/earth/off-whites; rooms/windows/interiors/architecture/light; not the most famous). **Quang approves**, then it's saved to `scripts/aic/selected.json`.
- [ ] **Step 3:** `scripts/aic/download.ts` re-fetches each id, re-confirms public domain, downloads 843 px, and with sharp writes `public/art/<slug>-512.webp` (512 longest side) and `-843.webp` (slug = kebab(title)-id); writes `src/data/featured-art.json` with the spec's fields (id, slug, title, artist, year, medium, classification, aspect, alt, small, large*, sourceUrl, museum, license) + `lqip`. *The spec lists "medium" twice; the image key is `large`.*
- [ ] **Step 4:** the hanging wall uses the real aspect, uncropped, centred on the 145 cm line; 512 in the strip, 843 when enlarged; a blurred `lqip` placeholder while loading; on hover/focus a wall label (artist, *title*, year); every image has alt text. The conveyor behaviour (T-129 + #84) is unchanged.
- [ ] **Step 5:** README "Featured artwork" (one line per work: title, artist, year, "Art Institute of Chicago, CC0", link) + a disclosure that these images come from AIC's public-domain collection and aren't made by the team.
- [ ] Lint, unit, `npm run build`, auth + publish-view e2e green; total `public/art` ≤ 2 MB. **Push only if green.**
## Files / modules in scope
- scripts/aic/search.ts, download.ts, candidates.json, candidates.html, selected.json (new)
- public/art/*.webp (new), src/data/featured-art.json (new)
- src/components/landing/Showcase.tsx (+ test), README.md (Featured artwork + disclosure), package.json (sharp as a dev dependency, pinned; a tsx runner if needed)
## Out of scope
- Any runtime AIC call; other landing parts; the gallery editor/viewer.
## Build kit
- **Libraries:** sharp (dev only; Quang specified it). **Skills:** `pegasus-ui`, `web-design-guidelines`.
## Notes
- Phase A (steps 1-2) now; phase B (steps 3-5) after Quang OKs the shortlist and after #84 (Showcase.tsx) + #86 (README) merge.
- Built by senior (Quang). Reviewer: reviewer-2 (another operator); devops merges.
## History
- 2026-10-10T21:53:01Z senior: carded from Quang's spec; assigned to senior by Quang
- 2026-10-10T21:53:04Z senior: status -> ready
- 2026-10-10T21:53:10Z senior: status -> in-progress
- 2026-10-11T00:05:59Z senior: status -> blocked
