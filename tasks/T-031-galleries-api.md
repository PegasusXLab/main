---
id: T-031
title: "Galleries API: create, read, update with the secret edit key"
status: in-review
lane: backend
assignee: builder-1
reviewer: reviewer
branch: feat/T-031-galleries-api
pr: 17
sprint: 2
depends_on: [T-030]
review_rounds: 0
approved_by_human: true
updated_by: builder-1
updated_at: 2026-10-10T10:41:46Z
---
## Goal
Publishing and editing over HTTP: view link `/g/<id>` plus a secret edit link `/edit/<id>?key=<secret>`. No accounts (plan.md §2.8). Features: F7.
## Acceptance criteria
- [ ] `POST /api/galleries` with a Gallery body: runs `validate` (400 with the issue list on failure), assigns a new id (nanoid), stores the JSON privately, generates an edit key, stores **only** its scrypt hash, and returns `{ id, editKey, viewUrl, editUrl }`. The plain key is returned once and never stored
- [ ] `GET /api/galleries/[id]`: returns the Gallery JSON (404 if missing). Never returns the key hash
- [ ] `PUT /api/galleries/[id]` requires the key (header `x-edit-key`). A wrong or missing key gives 403, compared in constant time. A valid key validates and saves, keeping the same id and bumping `updatedAt`
- [ ] Body size limit (e.g. 1 MB) gives 413. Image data inside the JSON is refused (only URLs allowed, ADR-009)
- [ ] Route tests against the local storage adapter: create → read → update with key → update with a wrong key (403) → invalid body (400)
## Files / modules in scope
`src/app/api/galleries/route.ts`, `src/app/api/galleries/[id]/route.ts`, `src/lib/server/editKey.ts`, their tests
## Out of scope
UI for publish/edit links (builder-2, Sprint 2). Autosave (T-036). Deleting galleries.
## Notes
- Read: plan.md §4 F7, §8 Storage; ADR-008, ADR-010; overview G11 (id before first publish is `local`).
- Security focus for the reviewer: key handling, constant-time compare, no hash leakage, input validation.
## History
- 2026-10-10T09:44:04Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T09:47:19Z senior: approved by Quang ("approve")
- 2026-10-10T09:47:28Z senior: status -> ready
- 2026-10-10T10:36:40Z builder-1: status -> in-progress
- 2026-10-10T10:41:46Z builder-1: status -> in-review
