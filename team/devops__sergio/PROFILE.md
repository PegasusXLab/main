---
agent: devops
role: DevOps
operator: Sergio
tool: Claude Code
model: Claude Sonnet 5.5
lane: CI, merge, deploy, releases
current_sprint: 1
current_ticket:
status: idle
updated_at: 2026-10-10T10:15:00Z
---
## Working on now
Running on a 5-minute self-scheduled loop so I don't need a manual nudge each cycle — check inbox/PRs, act, report only if something needs Sergio.

**Briefly stood in as reviewer** on PR #13 (T-021) while Vic's reviewer agent was offline (Sergio's explicit go-ahead, noting it breaks ADR-010's build/review/merge separation). Got partway through: fetched the branch, ran lint/typecheck/test/format:check clean (154/154 tests), was setting up live browser UAT for the specific regression (room-click deselect bug) when reviewer came back online. Stopped there and handed it back — no verdict posted, so PR #13 is exactly where the real reviewer left it (`changes-requested`, builder-2's round-2 fix pending review).

**Vic's builder-1 and reviewer are temporarily on Antigravity (Gemini) models**, not Claude Code, until Vic's Claude Code usage resets — broadcast to every agent so nobody's surprised by a different response style from those two.

**Sprint 0: fully merged.** T-001, T-002, T-003, T-004, T-005 all squash-merged; CI (`ci` + `docs-guard`) permanently live on `main`. Only T-006 remains, `needs-human` (below).

**Sprint 1, lane A (compile → renderer) so far: T-010, T-011, T-012 merged.** T-013 (renderer, PR #12) is open against `main`, `needs-review` — waiting on the reviewer to carry the approval over after a mistake (below).

**Process mistake caught and fixed:** merging a stacked PR with `--delete-branch` auto-closes the next PR in the stack if it's still based on the deleted branch — hit this on PR #11 (T-013) when merging #10. Builder-1 reopened it as #12 against `main`; reviewer is re-confirming the diff before re-approving. **Going forward:** for any PR I know has a stacked dependent, I merge without `--delete-branch` and delete the branch myself only after confirming (`gh pr view <dependent> --json baseRefName`) that the dependent has already retargeted to `main`.

**T-006:** still `needs-human`/unresolved on Vultr, but the Vercel domain mystery is likely solved — Sergio shared `https://galliverse.vercel.app/`, which is live and serves the Pegasus placeholder correctly. The team had been chasing `galleriverse.vercel.app` (DEPLOYMENT_NOT_FOUND) and even `main-six-lemon-62.vercel.app` — the real domain is spelled **galliverse** (one fewer "re"). Relayed to senior. PR preview builds still fail even though production succeeds — still needs someone with Vercel access to check the build logs.

**Open item raised, still unowned:** no `.gitattributes` anywhere means Windows checkouts show every pre-existing file as a local `format:check` false-positive (CRLF vs. the LF blobs; invisible on CI). Flagged in `handoffs/PR-4.md`; not blocking.

## Notes for other agents
- `main` branch protection is active (PR required, 0 approvals, no force-push/delete); `ci` + `docs-guard` are the required-check names.
- `docs-guard.yml` blocks PRs to `main` touching `AGENTS.md`, `agents/`, `scripts/`, `plan/`, `tasks/`, `team/`, `handoffs/`, `decisions/`, `releases/`, `BOARD.md`, `SPRINT.md`, `Docs/`.
- **Stacked PRs:** retarget your PR to `main` (`gh pr edit <n> --base main`) as soon as the PR it's stacked on merges, before its branch gets deleted — otherwise GitHub auto-closes yours. I'll also avoid deleting a base branch with a known stacked dependent until I've confirmed the retarget.
- I'll send `fyi` to every agent (and a `releases/CHANGELOG.md` line) whenever a phase ends or something merges/deploys, per `agents/devops.md` step 6.
- One merge at a time, never two concurrent — ping me in my inbox, don't assume.
