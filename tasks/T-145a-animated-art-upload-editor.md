---
id: T-145a
title: Animated artwork - upload + schema + editor: GIF and MP4 (≤4 MB) on the Object panel
status: merged
lane: backend
assignee: builder-3
reviewer: reviewer-2
branch: feat/T-145a-animated-art
pr: 99
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: devops
updated_at: 2026-10-11T00:30:31Z
---
## Goal
Creators can hang animated GIFs and short MP4 videos ("TV" or animated portraits), as Quang asked (19:10 EDT).
**Shared contract (both cards):** `Artwork` gains OPTIONAL `media?: { kind: "gif" | "video"; url: string; posterUrl?: string; aspect: number }` and `frameStyle?: "frame" | "tv"` (default "frame"). Additive only: old galleries validate unchanged and `version` stays 1. When `media` is set, it is shown instead of `image` (`image` stays the poster/fallback for the plaque and 2D markers).
## Acceptance criteria
- [ ] `POST /api/upload/media`: accepts **GIF** (magic `GIF87a`/`GIF89a`) and **MP4** (`ftyp` with a video brand: isom/mp42/avc1/iso2/mp41, AND contains a `vide` handler) up to **4 MB** (Vercel limit; a clear 413 message: "Animated art can be up to 4 MB. Try a shorter clip (10-15 s at 720p) or a smaller GIF."). Stores `media/<random>.<gif|mp4>`, served by /api/files with the correct type + nosniff + Range (T-144). Returns {url, kind, aspect?}.
- [ ] Schema: add the contract fields to types.ts + validate.ts (kind enum, a url under /api/files/media/ or https, aspect 0.2-5) + tests proving old fixtures still validate.
- [ ] Object panel: "Image / Animated (GIF or MP4)" choice; for animated, upload → read the aspect client-side (an img's naturalWidth/Height or a video's videoWidth/Height, muted preview) → set `media` + a poster: extract the first frame to a 1024 px WebP via canvas and upload it via the existing image upload so `image` is set; a "Frame style: Frame / TV" toggle. Inline 413/415 messages; a muted, looping preview in the panel.
- [ ] Lint, unit, build, publish-view + edit-link e2e green.
## Files / modules in scope
- src/app/api/upload/media/route.ts (+test, new), src/lib/schema/types.ts + validate.ts (+tests; the contract fields only), src/panels/ObjectPanel.tsx (+test)
## Out of scope
- 3D rendering (T-145b), floor objects, direct-to-Vultr uploads.
## Build kit
- **Libraries:** none.
## Notes
- Pairs with T-145b (render). Merge T-145a first (schema), then T-145b. Reviewer: reviewer-2.
## History
- 2026-10-10T23:13:34Z senior: carded from Quang's request ("allow gif + mp4 ... TV objects or portraits with gifs")
- 2026-10-10T23:13:37Z senior: status -> ready
- 2026-10-10T23:17:41Z builder-3: status -> in-progress
- 2026-10-10T23:49:59Z builder-3: status -> in-review
- 2026-10-11T00:07:59Z reviewer-2: status -> approved
- 2026-10-11T00:30:19Z devops: status -> merging
- 2026-10-11T00:30:31Z devops: status -> merged
