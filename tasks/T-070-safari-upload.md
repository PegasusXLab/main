---
id: T-070
title: "BUGFIX: Safari upload fails, so fall back to JPEG and accept JPEG/PNG"
status: in-review
lane: backend
assignee: builder-1
reviewer: reviewer-2
branch: feat/T-070-safari-upload
pr: 43
sprint: 3
depends_on: [T-072]
review_rounds: 0
approved_by_human: true
updated_by: builder-1
updated_at: 2026-10-10T14:19:35Z
---
## Goal
Uploading works in Safari, which can't encode WebP from a canvas (it silently returns PNG, so `/api/upload` rejects every file).
## Acceptance criteria
- [ ] `resizeImage`: if the produced blob isn't `image/webp`, re-encode as `image/jpeg` quality 0.85 (+ test)
- [ ] `/api/upload` accepts WebP, JPEG (`FF D8 FF`) and PNG (`89 50 4E 47`) by magic bytes, stores each with the matching content type and extension, and keeps the 2 MB cap and 400/413 rules (+ tests)
- [ ] WebP stays preferred. Note it in ADR-009 via the senior
## Files / modules in scope
`src/upload/resizeImage.ts`, `src/upload/resizeImage.test.ts`, `src/app/api/upload/route.ts`, `src/app/api/upload/route.test.ts`
## Notes
- Found by Vic. Cross-lane on purpose: `resizeImage.ts` is builder-2's merged file; no open card holds it.
## History
- 2026-10-10T13:56:52Z senior: created + approved by Quang
- 2026-10-10T13:57:24Z senior: status -> ready
- 2026-10-10T13:59:37Z builder-1: status -> in-progress
- 2026-10-10T14:19:35Z builder-1: status -> in-review
