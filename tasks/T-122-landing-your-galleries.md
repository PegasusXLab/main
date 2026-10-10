---
id: T-122
title: Landing - "Your galleries" for logged-in users (uses T-102)
status: approved
lane: design
assignee: designer-2
reviewer: reviewer
branch:
pr: 71
sprint: 3
depends_on: [T-102, T-119]
review_rounds: 0
approved_by_human: true
design_spec: ../galleriverse-ui-design (Quang's reference)
updated_by: reviewer
updated_at: 2026-10-10T19:31:43Z
---
## Goal
Make accounts visible: a logged-in creator sees the galleries they published, and can reopen or share them.
## Acceptance criteria
- [ ] When logged in (`/api/auth/session` from T-119), the landing page shows a "Your galleries" section from `GET /api/me/galleries` (T-102): one card per gallery (title, date, "View" → viewUrl, "Edit" → editUrl), newest first, using the T-111 primitives and tokens.
- [ ] Empty state: "No galleries yet" with a primary "Create a gallery" action (new blank gallery). Loading and error states are handled; logged out = section hidden (no request, so no console errors).
- [ ] Edit URLs are only rendered for the owner (they come from their own list) and are never logged.
- [ ] All existing ids/testids/accessible names unchanged; 0 console errors logged out and logged in; works at 390 px.
- [ ] A unit test for the section (list, empty, logged out). Lint, unit tests, auth e2e and predemo pass.
## Files / modules in scope
- src/components/landing/YourGalleries.tsx (new, + test), src/components/auth/authClient.ts (a `listMyGalleries()` helper), src/app/page.tsx (mount the section only)
## Out of scope
- The API (T-102, builder-1), the editor, deleting galleries, sharing UI beyond the links.
## Build kit
- **Libraries:** `lucide-react` if already present. **Primitives:** Button, Tooltip. **Skills:** `pegasus-ui`, `web-design-guidelines`.
## Notes
- page.tsx is also in T-119 (#69, in review): build the component now and mount it after T-119 merges (rebase). Target PR ~15:45; hard stop 16:30 EDT.
- Reviewer: reviewer-2 (reviewer has T-119/T-120; reviewer-3 is inactive).
## History
- 2026-10-10T18:57:36Z senior: carded; approved by Quang ("approve any sort of assignments queued")
- 2026-10-10T18:57:38Z senior: status -> ready
- 2026-10-10T19:13:37Z designer-2: status -> in-progress
- 2026-10-10T19:20:45Z designer-2: status -> in-review
- 2026-10-10T19:29:42Z reviewer: claimed under ADR-012 amendment 1 (reviewer-2 idle; PR #71 unclaimed)
- 2026-10-10T19:31:43Z reviewer: status -> approved
