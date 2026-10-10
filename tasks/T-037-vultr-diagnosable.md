---
id: T-037
title: "Storage hardening: trim Vultr config, log the real error, fix flaky shared-.data tests"
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer-3
branch:
pr:
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T11:53:31Z
---
## Goal
Production uploads fail with `Vultr storage operation failed (TypeError)`, and the sanitized error hides the cause. Make it diagnosable, and immune to stray whitespace in env values. Features: F3, F7.
## Acceptance criteria
- [ ] `getStorage()` trims all four `VULTR_S3_*` values. It also validates that the endpoint is a valid `https://` URL and fails fast with a clear message naming the variable (never its value)
- [ ] On S3 failure, `console.error` logs `err.name`, `err.message`, `.httpStatusCode` and the S3 `Code`, but **never** credentials or env values. The HTTP response stays generic
- [ ] Tests: whitespace-padded values work; an endpoint missing `https://` gives the clear message; a logged error contains no key material
- [ ] **Flaky tests fixed** (reported by builder-2): every test using the local adapter gets its own temp directory (e.g. `fs.mkdtemp`), so parallel vitest files never share `.data/`. `npm test` passes 5 runs in a row
- [ ] After merge: one production upload succeeds, or the Vercel log shows the real cause. Record it in handoffs/PR-19.md (T-032's open verification)
## Files / modules in scope
`src/lib/storage/index.ts`, `src/lib/storage/vultr.ts`, `src/lib/storage/vultr.test.ts`, `src/lib/storage/storage.test.ts`, `src/lib/storage/local.ts` (only to accept a base directory), `src/lib/storage/local.test.ts`, `src/app/api/upload/route.test.ts`, `src/app/api/galleries/route.test.ts`
## Out of scope
Changing the storage interface.
## Notes
- Root symptom: a TypeError before any request leaves (0.3 s). That's most likely an invalid endpoint URL, or an invalid character (whitespace/newline) in a credential header.
## History
- 2026-10-10T11:53:31Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T11:54:28Z senior: added the flaky shared-.data test fix (builder-2 report) to scope
