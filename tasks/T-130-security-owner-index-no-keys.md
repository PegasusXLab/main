---
id: T-130
title: Security - owner index stores no edit keys; the owner edits via session (ADR-014)
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-126]
review_rounds: 0
approved_by_human: true
design_spec: 
updated_by: senior
updated_at: 2026-10-10T19:59:34Z
---
## Goal
No plain edit keys at rest in the owner index (reviewer finding on T-102). The owner's session authorizes edits, as ADR-014 intended.
## Acceptance criteria
- [ ] `users/galleries/<userId>.json` entries hold `{id, title, createdAt, viewUrl}` only: no key, no editUrl. Existing entries are migrated on read (strip the key) and rewritten.
- [ ] `PUT /api/galleries/[id]` accepts EITHER a valid edit key (unchanged, as today) OR a session whose user owns the gallery; anyone else gets 403.
- [ ] `GET /api/me/galleries` returns `editUrl: /edit/<id>` without a key; the editor loads an owned gallery for its owner without a key (owner check on GET for edit mode), while the key link keeps working for everyone else.
- [ ] Tests: an owner can save without a key; a non-owner can't; the key path is unchanged; no key appears in the index. Publish-view + auth e2e pass.
## Files / modules in scope
- src/lib/auth/ownership.ts (+test), src/app/api/galleries/[id]/route.ts (+test), src/app/api/me/galleries/route.ts (+test), src/app/edit/[id]/page.tsx (owner load only; after T-124 merges)
## Out of scope
- Schema, landing UI beyond the editUrl it already renders.
## Build kit
- **Libraries:** none.
## Notes
- Queued after T-124/T-127 for builder-1; must start after T-126 (same file).
## History
- 2026-10-10T19:59:34Z senior: carded; approved by Quang ("just 1-5", 16:00 EDT)
