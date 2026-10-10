---
id: T-117
title: Live regression runs after each design merge and at 16:30 (matrix + accounts)
status: in-progress
lane: infra
assignee: builder-3
reviewer: reviewer
branch: test/T-115-enable-ui
pr: 65
sprint: 3
depends_on: [T-079, T-115]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: builder-3
updated_at: 2026-10-10T18:22:52Z
---
## Goal
Catch regressions from today's restyle (T-110..T-116, T-101, T-114) on the real site before the 18:00 freeze.
## Acceptance criteria
- [ ] After each merge of T-101 and T-114 (and any later bug fix), run `tests/e2e` (the matrix: Chromium, Firefox, WebKit, iPhone, Pixel, iPad) plus `auth.spec.ts` against https://galleriverse.vercel.app once the deploy is live (`E2E_BASE_URL`).
- [ ] A full run at **16:30 EDT**, and again at **17:45 EDT** before the freeze.
- [ ] Each run: append a line to `tests/e2e/MATRIX.md` (time, main SHA, pass/fail per project) via a small PR, OR post the results on this card's log when no code changes. Any failure becomes a message to the senior within 5 minutes, with the spec name, project and a screenshot path.
- [ ] Turn on T-115's UI tests as soon as T-101 merges.
## Files / modules in scope
- tests/e2e/MATRIX.md, tests/e2e/auth.spec.ts (enable the UI part only)
## Out of scope
- App code; new specs beyond enabling T-115's UI part.
## Build kit
- **Libraries:** none.
## Notes
- Use a dedicated port / E2E_BASE_URL (no stale server). WebKit-on-Windows gray textures are a known false positive (real Safari OK).
## History
- 2026-10-10T18:16:10Z senior: carded; approved by Quang
- 2026-10-10T18:16:12Z senior: status -> ready
- 2026-10-10T18:22:52Z builder-3: status -> in-progress
