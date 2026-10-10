---
id: T-032
title: "Upload API: store resized artwork images and return their URLs"
status: ready
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: [T-030]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T09:47:32Z
---
## Goal
The browser resizes each image to 512 / 1024 / 2048 px WebP and uploads it right away (ADR-009). This route stores the files and returns their public URLs. It's also where Vultr storage gets verified for real on a Vercel deploy (deferred from T-006). Features: F3.
## Acceptance criteria
- [ ] `POST /api/upload` (multipart): accepts `small`, `medium` and optional `large` WebP files. Each file must be `image/webp`, checked by magic bytes, not only by the header, and within a size cap (e.g. 2 MB each). Otherwise 400 / 413
- [ ] Stores each as a **public** object under `images/<nanoid>/<size>.webp` via `getStorage()` and returns `{ small, medium, large? }` URLs
- [ ] Route tests with the local adapter: valid upload, wrong type, oversize, missing medium
- [ ] `@aws-sdk/client-s3` pinned to an exact version in `package.json` (T-030 used a caret range; stack.md requires exact pins)
- [ ] **Vultr verification:** after merge, on the Vercel deploy, one upload returns URLs that load publicly. Record the result (not keys) in the handoff note. This closes the check deferred from T-006
## Files / modules in scope
`src/app/api/upload/route.ts`, its test, `package.json` + lockfile (only to pin `@aws-sdk/client-s3` to an exact version; senior, 2026-10-10T10:40:52Z)
## Out of scope
Browser-side resizing and the upload button (builder-2). Texture compression (T-090, on hold).
## Notes
- Read: ADR-008, ADR-009; plan.md §7 "Right-sized images".
## History
- 2026-10-10T09:44:04Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T09:47:19Z senior: approved by Quang ("approve")
- 2026-10-10T09:47:32Z senior: status -> ready
- 2026-10-10T10:40:52Z senior: added the exact-pin fix for @aws-sdk/client-s3 (design check on T-030); package.json in scope for that only
