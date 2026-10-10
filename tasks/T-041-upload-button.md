---
id: T-041
title: "Upload button: pick an image, resize, upload, return URLs"
status: ready
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: [T-040, T-032]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T11:13:08Z
---
## Goal
One control the object panel uses to get an uploaded artwork's URLs and aspect ratio. Features: F3.
## Acceptance criteria
- [ ] `<UploadButton onUploaded={({ image, aspect }) => …} />`: file picker → `resizeImage` → multipart `POST /api/upload` (fields `small`, `medium`, `large?`, as defined by T-032) → calls back with `{ image: { small, medium, large? }, aspect }`
- [ ] Shows a small preview thumbnail, a busy state, and readable errors (wrong type, too big, server error). Never sends image data anywhere except `/api/upload`
- [ ] Works locally with the local storage adapter (no accounts)
- [ ] Test with a faked `fetch` and a faked resize
## Files / modules in scope
`src/upload/UploadButton.tsx`, `src/upload/UploadButton.test.tsx`
## Out of scope
The artwork fields (T-042). Server code (T-032, builder-1).
## Notes
- Read: plan.md §3.3, ADR-009; T-032's request/response contract (read the merged route).
## History
- 2026-10-10T11:00:20Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:08Z senior: status -> ready
