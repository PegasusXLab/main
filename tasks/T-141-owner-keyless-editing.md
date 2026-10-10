---
id: T-141
title: T-130 part 2 - owners open and save their galleries without the edit key; remove the encrypted key copy
status: draft
lane: backend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-130, T-132]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T21:32:23Z
---
## Goal
Finish ADR-014: owners edit via their session; no edit key (plain or encrypted) is stored in the owner index.
## Acceptance criteria
- [ ] The editor (`/edit/<id>` with no `?key=`) loads a gallery the logged-in user owns and saves via the owner session (PUT without x-edit-key). A non-owner without a key sees the existing 'needs edit link' state.
- [ ] `/api/me/galleries` returns `editUrl: /edit/<id>` (no key); the owner index drops the encrypted copy (migrated on read).
- [ ] The edit-key flow is unchanged for everyone else. Unit tests + publish-view + edit-link + auth e2e pass.
## Files / modules in scope
- src/app/edit/[id]/page.tsx, src/components/PublishPanel.tsx, src/components/publishClient.ts, src/lib/auth/ownership.ts, src/app/api/me/galleries/route.ts (+ tests)
## Out of scope
- Schema, landing UI.
## Build kit
- **Libraries:** none.
## Notes
- Queued until T-130 (#82) and T-132 merge (shared edit-page files). Built by senior.
## History
- 2026-10-10T21:32:23Z senior: carded; approved by Quang ("i approve", 17:29 EDT)
