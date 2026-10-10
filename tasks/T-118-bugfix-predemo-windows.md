---
id: T-118
title: BUGFIX - npm run predemo fails on Windows (spawnSync npx.cmd EINVAL)
status: draft
lane: infra
assignee: builder-3
reviewer: reviewer
branch:
pr:
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T18:16:10Z
---
## Goal
The pre-demo check (T-078) runs on every operator's machine, including Windows, and reports real failures.
## Acceptance criteria
- [ ] `npm run predemo` runs the publish-view e2e against `E2E_BASE_URL` (default https://galleriverse.vercel.app) on Windows (Git Bash and PowerShell), macOS and Linux. Spawning `npx.cmd` without a shell is the bug (Node's .cmd spawn rules): launch Playwright portably, e.g. a small `scripts/predemo.mjs` that calls Playwright's CLI through `process.execPath` or uses `shell: true` on win32.
- [ ] If the launch itself fails, print the spawn error (`res.error`) and exit non-zero; never print PASS unless the test ran and passed.
- [ ] The PASS/FAIL banner is kept. Verified on Windows by the PR author (paste the output in the PR).
## Files / modules in scope
- package.json (the `predemo` script line only), scripts/predemo.mjs (new, optional)
## Out of scope
- The tests themselves, playwright.config.ts, CI.
## Build kit
- **Libraries:** none.
## Notes
- Reported by devops 18:12Z. Bug fix, so it's allowed after 16:30. If T-101 also touches package.json, rebase.
## History
- 2026-10-10T18:16:10Z senior: carded; approved by Quang
