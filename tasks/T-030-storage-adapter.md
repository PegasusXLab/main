---
id: T-030
title: "Storage adapter: local disk now, Vultr Object Storage when configured"
status: approved
lane: backend
assignee: builder-1
reviewer: reviewer
branch: feat/T-030-storage-adapter
pr: 15
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T10:30:56Z
---
## Goal
One small server-side storage interface that every API route uses, so the app works locally with no accounts and uses Vultr on Vercel (ADR-008 "Local first"). Features: F3, F7.
## Acceptance criteria
- [ ] Interface `Storage` with `putObject(key, bytes, contentType, { public })`, `getObject(key)` (returns null when missing), and `publicUrl(key)`
- [ ] `getStorage()` returns the **Vultr** adapter when all four `VULTR_S3_*` vars are set, otherwise the **local** adapter. It is server-only and never imported by client code
- [ ] Local adapter writes under `.data/` (gitignored). Local public URLs are served by a read-only route `GET /api/files/[...key]` that serves **only** public objects, with no path traversal (`..` refused)
- [ ] Vultr adapter uses `@aws-sdk/client-s3` against `VULTR_S3_ENDPOINT` / `VULTR_S3_BUCKET`. Public objects are written with a public-read ACL; private ones (gallery JSON, key hashes) are not
- [ ] Unit tests cover the local adapter (round trip, missing key, public/private, traversal refused) and adapter selection from env. No test needs real credentials
- [ ] Env values are never logged or returned in errors
## Files / modules in scope
`src/lib/storage/index.ts`, `src/lib/storage/local.ts`, `src/lib/storage/vultr.ts`, `src/lib/storage/*.test.ts`, `src/app/api/files/[...key]/route.ts`, `package.json` + lockfile (add `@aws-sdk/client-s3` only)
## Out of scope
The gallery and upload routes (T-031, T-032). Image resizing (builder-2, in the browser).
## Notes
- Read: ADR-008 (incl. value formats), ADR-009, plan/architecture.md §1 "Local first", AGENTS.md "Hosting and storage" and Gotchas (Next 16.4 route handlers: read `node_modules/next/dist/docs/`).
- This card owns `package.json` changes in Sprint 2; other cards that need a dependency ask the senior.
## History
- 2026-10-10T09:44:04Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T09:47:19Z senior: approved by Quang ("approve")
- 2026-10-10T09:47:24Z senior: status -> ready
- 2026-10-10T10:16:13Z builder-1: status -> in-progress
- 2026-10-10T10:24:30Z builder-1: status -> in-review
- 2026-10-10T10:30:56Z reviewer: status -> approved
