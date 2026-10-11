# ADR-009: Upload images as soon as they're added
Status: **accepted** (Quang, Q9, 2026-10-10).
## Context
Autosave keeps the gallery document in localStorage (about 5 MB). Three WebP sizes per artwork stored as data URLs would overflow it after a few images (overview G12).
## Decision
When a creator adds an image, the browser resizes it (512 / 1024 / 2048 px WebP) and uploads it right away to `/api/upload`, which stores it in Vultr Object Storage (ADR-008). The document holds only the returned URLs. Publishing then saves only JSON.
## Alternatives considered
- IndexedDB until publish: works offline, but publish has to move many files at once, and there are two image paths to test.
- Data URLs in localStorage: overflows.
## Consequences
`/api/upload` (Sprint 2, builder-1) must exist before F3's upload button (Sprint 2, builder-2). Images uploaded and then abandoned stay in the Vultr bucket, which is acceptable for the hackathon.

## Amendment 1 (senior, 2026-10-10T14:23:56Z): Safari fallback (T-070)
WebP stays the preferred format. Browsers that cannot encode WebP from a canvas (Safari) fall back to JPEG (quality 0.85) in `resizeImage`. `/api/upload` accepts WebP, JPEG and PNG, validated by magic bytes, with the same 2 MB cap, and stores each with its matching content type and extension. JPEG and PNG are accepted only as that fallback.
