---
id: T-102
title: My galleries (backend): record the owner on publish + list a user's galleries
status: ready
lane: backend
assignee: builder-1
reviewer: reviewer-2
branch:
pr:
sprint: 3
depends_on: [T-100]
review_rounds: 0
approved_by_human: true
design_spec: 
updated_by: senior
updated_at: 2026-10-10T18:34:02Z
---
## Goal
Accounts become useful: a logged-in creator's published galleries are remembered and can be listed (ADR-014). The landing-page list is a follow-up for designer-2.
## Acceptance criteria
- [ ] `POST /api/galleries` (create): when a valid `gv_session` is present, append `{id, title, createdAt, editKey-bearing editUrl}` to that user's private index `users/galleries/<userId>.json` (under `users/`, which `/api/files` already refuses to serve). Anonymous publish is unchanged.
- [ ] Saving edits (`PUT`) updates the title in the owner's index if the gallery is in it; nothing else changes. **The Gallery JSON schema is unchanged** and the edit-key flow keeps working exactly as today.
- [ ] `GET /api/me/galleries` returns 200 `{galleries: [...]}` (newest first) for a logged-in user, or 401 when logged out. It only ever returns the caller's own galleries.
- [ ] Failure to write the index never fails the publish (log and continue).
- [ ] Unit tests: owner recorded when logged in, not when anonymous, list only own, title update on save. Lint, unit tests, publish-view + auth e2e pass.
## Files / modules in scope
- src/app/api/galleries/route.ts, src/app/api/galleries/[id]/route.ts (owner-index hook only)
- src/lib/auth/ownership.ts (new, + test)
- src/app/api/me/galleries/route.ts (new, + test)
## Out of scope
- Any UI (follow-up card for designer-2). Owner editing without the key (later). Schema or storage-adapter changes; `src/lib/auth/session.ts` / `users.ts` internals (reuse their exports).
## Build kit
- **Libraries:** none.
## Notes
- **HARD RULE (Quang): merged by 16:15 EDT or dropped.** Keep it small. Security review: the list never leaks other users' galleries; editUrl only goes to the owner.
## History
- 2026-10-10T18:33:51Z senior: carded; approved by Quang
- 2026-10-10T18:34:02Z senior: status -> ready
