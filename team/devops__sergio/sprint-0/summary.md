# Sprint summary

## Completed
- Merged T-001, T-002, T-003, T-004, T-005 (squash commits `07f3698`, `39c7694`, `a0a8016`, `719cdac`, `a4d526a`) — all of sprint 0's builder cards plus devops's own CI card.
- T-002 built `ci.yml` (install/lint/typecheck/test, required-check name `ci`) and `docs-guard.yml` (blocks `Docs`-branch paths on PRs to `main`), restored `CLAUDE.md`/`.env.example`/PR template from the reverted `867d992` draft, adjusted for the Docs-root layout and the Vultr storage decision. Proved the AC's red/green requirement with a disposable PR, not just a local simulation.
- Tracked and nudged PR #2/#3 (cut before T-002 existed) through a rebase to pick up CI; both merged cleanly after.
- Installed and authenticated `gh` CLI on this machine (wasn't present — same gap Quang hit).
- Caught and fixed two real local-tooling incidents before they caused damage: `log.sh`'s `git add -A` sweeping a local-only template edit into a Docs commit (reverted, then `skip-worktree`'d so it can't recur), and a worktree I created landing nested inside the Docs checkout instead of as a sibling (caught before anything got swept into a commit).
- Set up a 5-minute local loop (cron-based) so the devops queue keeps moving without a manual nudge each cycle.

## Carried over (with reason)
- **T-006 (Vercel previews + Vultr Object Storage)**: genuinely blocked on human action, not agent work. Sent an escalation to `team/human/inbox/` asking Quang to confirm my Vercel access and set up the Vultr bucket/key directly in Vercel's env vars. Also flagged that `https://galleriverse.vercel.app/` currently 404s despite `main` having five merged PRs — worth checking once someone with Vercel access looks.

## Blockers hit
- **This machine's `gh` CLI wasn't installed or authenticated** — cost real time at the start of the sprint (had Sergio complete the interactive browser login, since that step can't be automated).
- **Local branch/remote name mismatch (`docs` vs `Docs`)** broke every script's bare `git push` the whole sprint; worked around with an explicit refspec push every time rather than touching git config. A rename attempt mid-sprint also left a duplicate `branch "Docs"` config section (likely VS Code's git integration writing concurrently) that I chose not to touch, for the same reason.
- **Two real `git add -A` incidents** from shared scripts sweeping up local-only state — not blockers exactly, but worth the team knowing the failure mode is real, not just theoretical (senior's open item #11 called it correctly).

## Lessons / suggestions for next sprint
- **`.gitattributes` is still unowned.** No LF normalization means every Windows checkout shows pre-existing files as local `format:check` false positives (invisible on CI, but confusing to read). Small, nobody's claimed it yet.
- **The devops ↔ builder handoff on CI worked well in practice**: commenting on PR + messaging the operator directly (not just the GitHub comment) got both T-003 and T-005 rebased fast. Worth keeping as the default pattern once more PRs start needing it.
- **A fixed-interval loop (checking inbox + PR status every few minutes) kept the merge queue from stalling** during a period when three PRs went reviewer-approved within about 15 minutes of each other. Worth considering for other roles with bursty inbound work (reviewer, in particular).
- Everything that needed a human (gh auth, Vercel/Vultr access) was discovered by trying the thing, not by reading the plan first — worth front-loading an "accounts/tooling I'll need" check at the very start of future sprints.
