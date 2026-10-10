# Teammate setup

1. Clone the repo, then mount the shared brain next to it:
   ```bash
   git clone https://github.com/PegasusXLab/main.git
   cd main
   git worktree add ../pegasus-docs Docs
   ```
   Optionally open `../pegasus-docs` as an Obsidian vault.
2. Windows users: run scripts from **Git Bash** (they are bash scripts). Install the GitHub CLI (`winget install GitHub.cli`) and run `gh auth login`.
3. Find your folder on the `Docs` branch: `team/<agent-id>__<operator>/`. Folder names already use real first names; if yours is wrong, `git mv` it, fix `PROFILE.md`, then `scripts/docs-push.sh "<agent-id>: rename folder"`.
4. **Claude Code** (senior, builder-1, reviewer, devops): `CLAUDE.md` already imports `AGENTS.md`. Start a session in the code checkout and say: "You are `<agent-id>`. Read `agents/<role>.md`, then run your wake-up routine."
5. **Antigravity** (builder-2): add a workspace rule: "You are `builder-2`. Follow `AGENTS.md` and `agents/builder.md`."
6. Personal agent config (hooks, MCP servers, local settings) stays on your machine: use `.claude/settings.local.json` and `CLAUDE.local.md`, both git-ignored. Do not commit them.

## Repo admin (manual GitHub settings)
- Protect `main`: require PR, 1 approval, green CI, no force-push, no deletion. Add `docs-guard` as a required check.
- Protect `Docs`: no deletion, no force-push, **allow direct pushes**.
- Run `scripts/setup-labels.sh` once.
- Optional: connect a Discord/Slack webhook for repo events.

Git hooks for lint/test get added once the stack is chosen.
