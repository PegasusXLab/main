---
id: T-044
title: "Publish panel: publish, save edits, show view and edit links"
status: merged
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-044-publish-panel
pr: 27
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T11:53:38Z
---
## Goal
The creator publishes and gets a view link plus a secret edit link (F7 done-criteria).
## Acceptance criteria
- [ ] Small client helper: `publishGallery(gallery) → { id, editKey, viewUrl, editUrl }` (POST `/api/galleries`) and `saveGallery(id, key, gallery)` (PUT with header `x-edit-key`), with readable errors for 400 (validation issues), 403 (wrong key) and 413
- [ ] `<PublishPanel gallery id? editKey? onPublished />`: first publish shows both links with Copy buttons and a warning that the edit link is secret. Later saves use the key
- [ ] The edit key is never logged or sent anywhere except that header
- [ ] Tests with a faked `fetch`
## Files / modules in scope
`src/components/PublishPanel.tsx`, `src/components/publishClient.ts`, their tests
## Out of scope
Wiring the Publish button on the editor page (T-046). Server routes (T-031, merged).
## Notes
- Read: plan.md §4 F7; T-031's merged routes (request/response); ADR-010 security notes.
## History
- 2026-10-10T11:00:20Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:20Z senior: status -> ready
- 2026-10-10T11:48:59Z builder-2: status -> in-progress
- 2026-10-10T11:50:14Z builder-2: status -> in-review
- 2026-10-10T11:52:40Z reviewer: status -> approved
- 2026-10-10T11:53:38Z devops: status -> merged
