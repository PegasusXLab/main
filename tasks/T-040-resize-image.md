---
id: T-040
title: "Browser image resize to 512 / 1024 / 2048 px WebP"
status: in-progress
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-040-resize-image
pr:
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: builder-2
updated_at: 2026-10-10T11:39:14Z
---
## Goal
Uploads are right-sized in the browser before they leave the machine (plan.md §7, ADR-009). Features: F3.
## Acceptance criteria
- [ ] `resizeImage(file) → { small, medium, large?, aspect }`: WebP blobs whose longest side is at most 512 / 1024 / 2048 px. `large` is omitted when the original is smaller than 2048 px. Never upscales
- [ ] `aspect` = height / width of the original
- [ ] Rejects non-images and files over 20 MB with a clear error
- [ ] Pure size math (`fitWithin(w, h, max)`) is unit-tested; the canvas/WebP part is behind a small function that can be faked in tests
## Files / modules in scope
`src/upload/resizeImage.ts`, `src/upload/resizeImage.test.ts`
## Out of scope
The upload request (T-041), UI.
## Notes
- Read: plan.md §7 "Right-sized images", ADR-009.
## History
- 2026-10-10T11:00:20Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:03Z senior: status -> ready
- 2026-10-10T11:39:14Z builder-2: status -> in-progress
