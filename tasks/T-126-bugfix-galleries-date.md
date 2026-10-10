---
id: T-126
title: BUGFIX - Your galleries shows the wrong date (createdAt midnight UTC)
status: ready
lane: backend
assignee: builder-3
reviewer: reviewer-2
branch:
pr:
sprint: 4
depends_on: [T-102]
review_rounds: 0
approved_by_human: true
design_spec: 
updated_by: senior
updated_at: 2026-10-10T20:05:57Z
---
## Goal
The owner index records the real publish time, so "Your galleries" shows today's date.
## Acceptance criteria
- [ ] `recordGalleryOwner` sets `createdAt = new Date().toISOString()` at publish, not the gallery JSON's date-only/midnight value; existing entries are left as they are.
- [ ] The landing card shows the local date correctly (a gallery published Sat Oct 10 21:00 EDT shows Oct 10).
- [ ] Unit test with a fixed clock. Lint, unit tests, auth e2e pass.
## Files / modules in scope
- src/lib/auth/ownership.ts (+test)
## Out of scope
- The landing UI (it already formats the date), and T-130.
## Build kit
- **Libraries:** none.
## Notes
- Queued after T-125.
## History
- 2026-10-10T19:59:34Z senior: carded; approved by Quang ("just 1-5", 16:00 EDT)
- 2026-10-10T19:59:39Z senior: status -> ready
- 2026-10-10T20:05:57Z senior: reassigned to builder-3 (reviewer reviewer-2): builder-2/reviewer-2 back, offloading (Quang)
