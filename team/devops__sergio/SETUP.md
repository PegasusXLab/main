# Setup report: devops (operator: Sergio)

_Written by Sergio's Claude Code agent on 2026-10-09, after the senior's foundation (`main` 867d992, `Docs` 0764e9b) and after Vic's builder-1/reviewer setup (`Docs` db25243)._

> **TL;DR for other agents:** devops is set up and idle. Nothing to merge yet — no tickets exist. I'll broadcast `fyi` + a changelog line whenever a phase ends or something merges/deploys.

---

## 1. How my agent works with the team

I follow `AGENTS.md` and `agents/devops.md` on `main` with no deviations:

- **Every session** starts with the wake-up routine: `scripts/docs-sync.sh` → `SPRINT.md` → my `PROFILE.md` → `scripts/inbox.sh devops` → act → `scripts/log.sh`.
- Picks up `approved` messages one at a time — never two merges concurrently.
- Light quality/documentation pass on the diff, confirms CI is green, squash-merges, deletes the branch, updates `releases/CHANGELOG.md` and the handoff note.
- Sends `merged` to the builder, reviewer and senior; sends `fyi` to every agent (and updates the `SPRINT.md` ticket table) when a phase or feature set finishes — this is the notify-on-merge/phase-complete mechanism Vic flagged needing in their SETUP.md. It's already specified in `agents/devops.md` step 6; no new message type is needed.
- Production/demo deploys require explicit human approval via `team/human/inbox/` before I set a ticket `deployed`.

## 2. Local setup (Sergio's laptop only, not committed)

| Item | What it is | State |
|---|---|---|
| Skills | `code-review` / `security-review` for the pre-merge pass; `run` to verify a build before marking `merging`; `update-config` to manage local hooks/permissions | Available in this session; no extra install needed |
| Local push/merge guard | A `PreToolUse` hook blocking `git push origin main*` and `git push --force*` as a local backstop on top of branch protection | Proposed, not yet registered on this machine |
| Merge-notify hook | A `PostToolUse` hook that, after a detected `gh pr merge`, auto-runs `scripts/log.sh devops <task-id> "merged"` so the notify step can't be skipped | Proposed, not yet registered |
| MCP | None needed for routine merge/CI work (`gh` CLI covers PRs, labels, CI status) | Revisit once stack/host is picked |

## 3. OPEN ITEMS: need attention

1. **Rollback runbook** (`agents/devops.md` #12, owned by me) is a TODO until the stack and host are chosen — writing it now would just be guessing.
2. **CI beyond `docs-guard`** doesn't exist yet (senior open item #7) — blocked on `plan/stack.md`.
3. **`gh` CLI / labels / branch protection** (senior items #1, #3; Vic item #2-3) — I don't have repo admin, so I'm waiting on whoever does (Vic has admin) to run `scripts/setup-labels.sh` and set branch protection before I'd rely on PR labels mirroring task status.
4. Everything else in this report is standby-only, per the team's instruction to hold off on application/stack-specific work until sprint 1 planning lands.

## 4. Replaces

The earlier `Docs/devops-status.md` (written before I knew the real `team/` scaffold existed) is removed in this same commit — this file supersedes it.
