# Setup report: devops (operator: Sergio)

_Written by Sergio's Claude Code agent on 2026-10-09, after the senior's foundation (`main` 867d992, `docs` 0764e9b) and after Vic's builder-1/reviewer setup (`docs` db25243)._

> **TL;DR for other agents:** devops is set up and idle. Nothing to merge yet — no tickets exist. I'll broadcast `fyi` + a changelog line whenever a phase ends or something merges/deploys.

---

## 1. How my agent works with the team

I follow `AGENTS.md` and `agents/devops.md` with no deviations. **Note:** these now live at the root of `docs`, not on `main` — `main`'s foundation push was reverted and not yet restored (see Quang's setup-report update at the bottom of `docs/PegasusAgents.md`).

- **Every session** starts with the wake-up routine: `scripts/docs-sync.sh` → `SPRINT.md` → my `PROFILE.md` → `scripts/inbox.sh devops` → act → `scripts/log.sh`.
- Picks up `approved` messages one at a time — never two merges concurrently.
- Light quality/documentation pass on the diff, confirms CI is green, squash-merges, deletes the branch, updates `releases/CHANGELOG.md` and the handoff note.
- Sends `merged` to the builder, reviewer and senior; sends `fyi` to every agent (and updates the `SPRINT.md` ticket table) when a phase or feature set finishes — this is the notify-on-merge/phase-complete mechanism Vic flagged needing in their SETUP.md. It's already specified in `agents/devops.md` step 6; no new message type is needed.
- Production/demo deploys require explicit human approval via `team/human/inbox/` before I set a ticket `deployed`.

## 2. Local setup (Sergio's laptop only, not committed)

| Item | What it is | State |
|---|---|---|
| Skills | `code-review` / `security-review` for the pre-merge pass; `run` to verify a build before marking `merging`; `update-config` to manage local hooks/permissions | Available in this session; no extra install needed |
| Local push/merge guard | A `PreToolUse` hook on `Bash|PowerShell` denying any `git push` matching `origin`+`main` or `--force`/`-f` | **Installed and tested** in `~/.claude/settings.json` (global, not in the repo) |
| Merge-notify hook | A `PostToolUse` hook that auto-runs `scripts/log.sh devops <task-id> "merged"` after a `gh pr merge` | Deferred — there's nothing to merge yet; building it now would be speculative. Revisit once the first ticket reaches `approved` |
| MCP | None needed for routine merge/CI work (`gh` CLI covers PRs, labels, CI status) | Revisit once stack/host is picked |
| Branch name quirk | Resolved 2026-10-12: the remote branch was renamed `Docs` → `docs`, so the local `docs` branch now matches it (re-clone or `git fetch && git checkout -B docs origin/docs` after the history rewrite). Previously: local `docs` vs remote `Docs` made `push.default=simple` refuse bare pushes | Workaround: push explicitly with `git push origin docs:Docs` when a script's push step fails — the commit itself still lands correctly |

## 3. OPEN ITEMS: need attention

1. **Rollback runbook** (`agents/devops.md` #12, owned by me) is a TODO until the stack and host are chosen — writing it now would just be guessing.
2. **CI beyond `docs-guard`** doesn't exist yet (senior open item #7) — blocked on `plan/stack.md`.
3. **`gh` CLI / labels / branch protection** (senior items #1, #3; Vic item #2-3) — labels are now created (Vic ran `setup-labels.sh`). Branch protection still unset.
4. **`main`'s foundation is still reverted** — `agents/*.md` and `scripts/*` currently live only at the root of `docs`, not on `main`. Open decision from Quang's report: who restores it to `main`, and how.
5. Caught and fixed one instance of the `git add -A` risk senior flagged (item #11): `log.sh` swept a local-only template fill-in in `docs/agent-setup-prompt.txt` into a pushed commit. Reverted it (commit `dcb2c68`) and marked the file `git update-index --skip-worktree` locally so it can't recur (same fix Vic independently applied for the same file).
6. Everything else in this report is standby-only, per the team's instruction to hold off on application/stack-specific work until sprint 1 planning lands.

## 4. Replaces

The earlier `docs/devops-status.md` (written before I knew the real `team/` scaffold existed) is removed in this same commit — this file supersedes it.
