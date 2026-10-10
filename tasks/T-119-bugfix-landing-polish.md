---
id: T-119
title: BUGFIX - landing: relative edit links blocked, console 401 noise, showcase label overlap
status: merging
lane: design
assignee: designer-2
reviewer: reviewer
branch:
pr: 69
sprint: 3
depends_on: [T-101]
review_rounds: 0
approved_by_human: true
design_spec: ../galleriverse-ui-design (Quang's reference)
updated_by: devops
updated_at: 2026-10-10T19:01:27Z
---
## Goal
Fix three issues found in live checks of T-101 (builder-3's T-117 run and the senior's design check).
## Acceptance criteria
- [ ] **1 (regression, required):** the "Open edit link" input accepts BOTH full URLs and relative paths like `/edit/<id>?key=<key>` (use `type="text"` + `inputMode="url"`, and let `parseEditLink` validate; show its error inline). Keep the input's label/name/id and the Open button unchanged.
- [ ] **2 (console noise):** a logged-out visit to `/`, `/login` and `/register` logs **0 console errors**. Do this WITHOUT changing the T-100 `/api/auth/me` contract (401 stays, since tests rely on it): add `GET /api/auth/session` that always returns 200 `{ user: {id,email,name} | null }` (same cookie verification as `me`, reusing `src/lib/auth`), and have `authClient` use it.
- [ ] **3 (visual):** the "145 cm" dimension label in the showcase no longer overlaps the first artwork at 1440 px or 390 px.
- [ ] A unit test for the session route (null + logged in) and for relative-link acceptance. Lint, unit tests and `tests/e2e/auth.spec.ts` pass (`npm run predemo` too, once T-118 lands).
## Files / modules in scope
- src/app/page.tsx (the edit-link input only), src/components/landing/Showcase.tsx, src/components/auth/authClient.ts
- src/app/api/auth/session/route.ts (new, + test)
## Out of scope
- src/app/api/auth/me/route.ts and src/lib/auth/* internals (T-100, builder-3); tests/e2e/auth.spec.ts (builder-3 T-117).
## Build kit
- **Libraries:** none. **Primitives:** existing `src/components/ui`. **Skills:** `pegasus-ui`, `web-design-guidelines`.
## Notes
- Bug fix, so allowed after 16:30. Target PR ~15:15 EDT.
- Reviewer: reviewer (Vic). Not reviewer-3, because part 2 builds on builder-3's (Sergio's) auth code.
## History
- 2026-10-10T18:31:12Z senior: carded from T-117 (builder-3) and the senior live check; approved by Quang
- 2026-10-10T18:31:14Z senior: status -> ready
- 2026-10-10T18:43:15Z designer-2: status -> in-progress
- 2026-10-10T18:53:18Z designer-2: status -> in-review
- 2026-10-10T18:58:28Z reviewer: status -> approved
- 2026-10-10T19:01:27Z devops: status -> merging
