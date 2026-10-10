---
id: T-115
title: End-to-end tests - register, log in, log out (API now, landing UI when T-101 lands)
status: merging
lane: infra
assignee: builder-3
reviewer: reviewer-2
branch: feat/T-115-e2e-accounts
pr: 59
sprint: 3
depends_on: [T-100]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: devops
updated_at: 2026-10-10T18:00:14Z
---
## Goal
Prove accounts work for every user before the freeze, and guard the existing start flow against the landing-page change.
## Acceptance criteria
- [ ] `tests/e2e/auth.spec.ts`, API level (request context): register a unique email → 201 + cookie (T-100 contract); `/api/auth/me` returns that user; log out → `me` is 401; log in again → 200; wrong password and unknown email return the SAME 401 body; duplicate register → 409; short password → 400.
- [ ] UI level (enabled once T-101 merges, skipped with a clear reason until then): from `/`, register through the form → lands in the editor → the header shows the user → log out → the register/login panel is back. Also `/login` deep link.
- [ ] Regression: the existing start-screen tests (new gallery, open an edit link) still pass on the landing page.
- [ ] Runs on Chromium in CI; added to the T-079 matrix for WebKit + iPhone on the UI part. Uses a dedicated port / `E2E_BASE_URL` (no stale-server reuse); unique emails per run; no reliance on shared `.data` state.
- [ ] One manual run against https://galleriverse.vercel.app after T-100 deploys (E2E_BASE_URL), with the result posted on the card.
## Files / modules in scope
- tests/e2e/auth.spec.ts (new), tests/e2e/MATRIX.md (a row), tests/e2e/README.md (how to run)
## Out of scope
- App code (T-100, T-101), playwright.config.ts and CI (devops).
## Build kit
- **Libraries:** none (Playwright 1.64 already installed).
## Notes
- Reviewer reviewer-2 (builder-3 is Sergio's). API part PR ~15:00; the UI part can be a follow-up commit once T-101 merges (~16:30). Freeze today 18:00 EDT.
## Live run (builder-3)
- 2026-10-10 ~17:55Z, E2E_BASE_URL=https://galleriverse.vercel.app, Chromium: **3 passed, 2 skipped** (UI waits for T-101). Accounts API (register 201, me, logout, login, the same 401 for wrong pw / unknown email, 409, 400) and start screen (new gallery, open edit link) all pass live.
## History
- 2026-10-10T17:42:46Z senior: carded; approved by Quang
- 2026-10-10T17:42:47Z senior: status -> ready
- 2026-10-10T17:45:19Z builder-3: status -> in-progress
- 2026-10-10T17:49:31Z builder-3: status -> in-review
- 2026-10-10T17:53:02Z reviewer-2: status -> approved
- 2026-10-10T18:00:14Z devops: status -> merging
