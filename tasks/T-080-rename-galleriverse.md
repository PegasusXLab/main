---
id: T-080
title: "Rename the product to Galleriverse in user-visible text"
status: merged
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr: 50
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T15:57:38Z
---
## Goal
The product name is **Galleriverse** (Quang, 2026-10-10). Everything a user or judge sees should say so.
## Acceptance criteria
- [ ] Browser tab title and metadata description (`layout.tsx`): "Galleriverse"
- [ ] Start screen heading (`page.tsx`): "Galleriverse"
- [ ] The sample gallery's placeholder artist "Pegasus Sample" becomes "Galleriverse Sample"
- [ ] **Do NOT rename internal identifiers:** the localStorage key `pegasus:gallery:` (renaming would orphan users' autosaves), `PEGASUS_DATA_DIR`, and the package name stay as they are
- [ ] Tests updated where they assert the visible text
## Files / modules in scope
`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/page.test.tsx`, `src/fixtures/sample-3room.json`
## Out of scope
README (T-078, builder-3). The Vercel domain (Quang's call).
## History
- 2026-10-10T15:44:58Z senior: created + approved by Quang (product name decision)
- 2026-10-10T15:45:52Z senior: status -> ready
- 2026-10-10T15:51:29Z builder-2: status -> in-progress
- 2026-10-10T15:53:56Z builder-2: status -> in-review
- 2026-10-10T15:56:08Z reviewer: status -> approved
- 2026-10-10T15:57:06Z devops: status -> merging
- 2026-10-10T15:57:13Z devops: status -> merged
- 2026-10-10T15:57:38Z devops: status -> merged
