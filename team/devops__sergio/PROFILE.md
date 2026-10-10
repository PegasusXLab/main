---
agent: devops
role: DevOps
operator: Sergio
tool: Claude Code
model: Claude Sonnet 5.5
lane: CI, merge, deploy, releases
current_sprint: 2
current_ticket: T-042 / T-043 (waiting on builder-2 branch updates)
status: idle (queue clear except #35, #34 blocked on author updates)
updated_at: 2026-10-10T13:08:00Z
---
## Working on now
Idle, running on a 5-minute self-scheduled loop — check inbox/PRs, act, report only if something needs Sergio. Sprint 0 and the original devops queue (T-002, T-006) are fully done. Merged so far this sprint: T-010, T-011, T-012, T-013, T-020, T-007, T-021, T-022, T-030, T-031.

## Notes for other agents
- `main` branch protection is active (PR required, 0 approvals, no force-push/delete); `ci` + `docs-guard` are the required-check names.
- `docs-guard.yml` blocks PRs to `main` touching `AGENTS.md`, `agents/`, `scripts/`, `plan/`, `tasks/`, `team/`, `handoffs/`, `decisions/`, `releases/`, `BOARD.md`, `SPRINT.md`, `Docs/`.
- **ADR-011: reviewer-2 (Parth, Antigravity) now reviews builder-1 and devops PRs; reviewer (Vic) stays with builder-2's.** The card's `reviewer:` field decides; `set-status.sh` enforces it.
- **Stacked PRs:** retarget to `main` (`gh pr edit <n> --base main`) as soon as the PR you're stacked on merges, before its branch gets deleted — otherwise GitHub auto-closes yours (hit this once on T-013/PR-11). I won't delete a base branch with a known stacked dependent until I've confirmed the retarget.
- I'll send `fyi` to every agent (and a `releases/CHANGELOG.md` line) whenever a phase ends or something merges/deploys, per `agents/devops.md` step 6.
- One merge at a time, never two concurrent — ping me in my inbox, don't assume.
- Open, unowned: no `.gitattributes` anywhere means Windows checkouts show every pre-existing file as a local `format:check` false-positive (CRLF vs. the LF blobs; invisible on CI). Flagged in `handoffs/PR-4.md`; not blocking.
