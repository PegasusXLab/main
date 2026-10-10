---
id: T-130
title: Security - owner index stores no edit keys; the owner edits via session (ADR-014)
status: merged
lane: backend
assignee: senior
reviewer: human
branch: t-130-owner-index-no-keys
pr: 82
sprint: 4
depends_on: [T-126]
review_rounds: 0
approved_by_human: true
design_spec: 
updated_by: devops
updated_at: 2026-10-10T21:41:02Z
---
## Goal
No plain edit keys at rest in the owner index (reviewer finding on T-102). The owner's session authorizes edits, as ADR-014 intended.
## Acceptance criteria
- [ ] `users/galleries/<userId>.json` entries hold `{id, title, createdAt, viewUrl}` only: no key, no editUrl. Existing entries are migrated on read (strip the key) and rewritten.
- [ ] `PUT /api/galleries/[id]` accepts EITHER a valid edit key (unchanged, as today) OR a session whose user owns the gallery; anyone else gets 403.
- [ ] `GET /api/me/galleries` returns `editUrl: /edit/<id>` without a key; the editor loads an owned gallery for its owner without a key (owner check on GET for edit mode), while the key link keeps working for everyone else.
- [ ] Tests: an owner can save without a key; a non-owner can't; the key path is unchanged; no key appears in the index. Publish-view + auth e2e pass.
## Files / modules in scope
- src/lib/auth/ownership.ts (+test), src/app/api/galleries/[id]/route.ts (+test), src/app/api/me/galleries/route.ts (+test)
- **Part 2, after T-124 + T-135 merge:** src/app/edit/[id]/page.tsx (owner load without a key). Until then `editUrl` keeps the key for owners (the server never stores it).
## Out of scope
- Schema, landing UI beyond the editUrl it already renders.
## Build kit
- **Libraries:** none.
## Notes
- Queued after T-124/T-127 for builder-1; must start after T-126 (same file).
## History
- 2026-10-10T19:59:34Z senior: carded; approved by Quang ("just 1-5", 16:00 EDT)
- 2026-10-10T19:59:43Z senior: status -> ready
- 2026-10-10T20:36:11Z senior: reassigned to senior (Quang override: senior builds cards; reviewer stays reviewer-3, another operator). Split: part 1 = server/index now; part 2 = edit-page owner load after T-124/T-135.
- 2026-10-10T20:45:06Z senior: Quang reviews this card himself (one-time exception to the same-operator rule, his call).
- 2026-10-10T20:48:18Z senior: status -> in-progress
- 2026-10-10T21:06:49Z senior: PR #82 (part 1). Deviation: the key is stored ENCRYPTED (AES-256-GCM, key derived from AUTH_SECRET), not dropped, because the current editor needs ?key= to save. Part 2 (after T-124, now merged): editor saves owned galleries keyless → drop the encrypted copy.
- 2026-10-10T21:06:52Z senior: status -> in-review
- 2026-10-10T21:19:45Z human: status -> approved
- 2026-10-10T21:31:33Z senior: Quang approved ("i approve", 17:29 EDT; he is the reviewer). Supersedes the ambiguous 21:19Z 'human' record.
- 2026-10-10T21:40:53Z devops: status -> merging
- 2026-10-10T21:41:02Z devops: status -> merged
