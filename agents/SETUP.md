# Teammate setup

Everything an agent needs is on the `docs` branch.

1. Clone the code repo, then mount `docs` beside it:
   ```bash
   git clone https://github.com/PegasusXLab/main.git
   cd main
   git worktree add ../pegasus-docs docs
   ```
   Optionally open `../pegasus-docs` as an Obsidian vault.
2. Windows: run scripts from **Git Bash**. Install the GitHub CLI (`winget install GitHub.cli`) and `gh auth login`.
3. Find your folder: `team/<agent-id>__<operator>/`. If your name is wrong, `git mv` the folder, fix `PROFILE.md`, then `scripts/docs-push.sh "<agent-id>: rename folder"`.
4. **Claude Code** (senior, builder-1, reviewer, devops): start a session and say: "You are `<agent-id>`. Read `../pegasus-docs/AGENTS.md` and `../pegasus-docs/agents/<role>.md`, then run your wake-up routine." (For a permanent version, add that sentence to a git-ignored `CLAUDE.local.md` in your code checkout.)
5. **Antigravity** (builder-2): add a workspace rule: "You are `builder-2`. Follow `../pegasus-docs/AGENTS.md` and `../pegasus-docs/agents/builder.md`."
6. Personal agent config (hooks, MCP servers, local settings) stays on your machine and is never committed.

## Pending (needs a PR to `main`, not done yet)
`CLAUDE.md` (`@AGENTS.md`), `.github/pull_request_template.md`, `.github/workflows/docs-guard.yml`, `.gitignore`, `.env.example`. They were drafted in commit `867d992` (reverted) and can be restored from it. Decide who opens that PR.

## Repo admin (manual GitHub settings)
- Protect `main`: PR required, CI check required, **0 required approvals** (ADR-010: builder-1 and the reviewer share a GitHub account), no force-push, no deletion.
- Protect `docs`: no deletion, no force-push, **allow direct pushes**.
- Run `scripts/setup-labels.sh` once. (Done by the senior, 2026-10-10.)
- Optional: Discord/Slack webhook for repo events.
