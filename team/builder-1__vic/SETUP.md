# Setup report: builder-1 + reviewer (operator: Vic)

_Written by Vic's Claude Code agent on 2026-10-09. Updated for the final layout, where `AGENTS.md`, `agents/` and `scripts/` live at the `Docs` root and `main` holds only code (senior revert `04cf5e1`, `Docs` `33ad808`). Covers both agents on Vic's laptop: `builder-1` (backend/API) and `reviewer` (review, UAT, security)._

> **TL;DR for other agents:** Both agents are set up and idle. They use the team scripts (`scripts/*.sh` at the Docs root) and talk to the team only through this branch. Before builder-1's first PR, the **team** has to decide who approves builder-1's PRs on GitHub (Open item #1).

---

## 1. How my agents work with the team

I follow `AGENTS.md`, `agents/builder.md` and `agents/reviewer.md` at the root of `Docs` with no deviations. In short:

- **Every session** starts with: `scripts/docs-sync.sh`, then `SPRINT.md`, then my `PROFILE.md`, then `scripts/inbox.sh builder-1` (or `reviewer`). Then I act and log with `scripts/log.sh`.
- **builder-1**
  - Reads its inbox: `changes-requested` first, then the oldest `assignment`.
  - Branches `feat/T-nnn-<slug>` and opens a PR with `needs-review`.
  - Writes `handoffs/PR-<n>.md` and sends `review-request` to `reviewer`.
- **reviewer**
  - Takes `review-request` messages oldest first.
  - Does UAT, edge cases and the security checklist.
  - Sends `changes-requested` back to the builder, or `approved` to `devops`.
  - Escalates to `human` after 2 rounds without approval.
- **Separate sessions.** Each agent runs in its own Claude Code session. The reviewer never reviews work from the session that built it.
- **What I watch from devops (Sergio):**
  - `merged` and `deployed` messages in my inboxes;
  - `phase` in `SPRINT.md`;
  - `releases/CHANGELOG.md`.

  My session-start summary prints all three. Sergio confirmed this flow in `team/devops__sergio/SETUP.md` (`agents/devops.md` step 6). Thanks!
- **For builder-2 (Parth's Q4):** reviewer messages go to `team/reviewer__vic/inbox/`, i.e. `scripts/send.sh builder-2 reviewer review-request T-nnn <pr> "..."`. `send.sh` resolves the folder automatically.

## 2. Local setup (Vic's laptop only, not committed)

| Item | What it is | State |
|---|---|---|
| Checkout layout | `main/` is the clone, checked out on `Docs` (the brain). `pegasus-docs` is a symlink to it, which matches the `../pegasus-docs` paths in `AGENTS.md`. `pegasus-code/` is a git worktree on `main` (code only). | Done. Team scripts tested from the Docs root after the move: `docs-sync`, `inbox` for both agents |
| Local edit protection | A one-time local edit to `Docs/agent-setup-prompt.txt` is marked `skip-worktree`, so `docs-push.sh`'s `git add -A` never commits it. This avoids senior open item #11. | Done |
| `~/.pegasus/bin/peg status` | Wake-up summary for both of my agents: sprint, profiles, inboxes, latest releases. It also has fallback `send/log/inbox` commands that only stage `team/`, `handoffs/` and `tasks/`. | Done |
| `~/.pegasus/hooks/guard.sh` | PreToolUse guard that enforces the AGENTS.md universal rules locally. It blocks pushes to `main`, force-pushes, merging `Docs` into code, `gh pr merge`, and reading or committing `.env`. | Written and tested; **Vic needs to register it** |
| `~/.pegasus/hooks/session-start.sh` | Prints `peg status` into each new session in the repo. | Written; **Vic needs to register it** |
| Playwright MCP | Browser UAT for `reviewer` (`agents/reviewer.md` step 3) | **Vic needs to install it** |
| GitHub | `gh` CLI, logged in as `victorgooge` (repo admin) | Working. The GitHub MCP plugin doesn't connect, so I use `gh`. |

## 3. OPEN ITEMS: need attention

1. **Who approves builder-1's PRs on GitHub** (owner: **team**). `builder-1` and `reviewer` both use Vic's GitHub account, and GitHub doesn't let anyone approve their own PR. With "1 approval" protection on `main`, my reviewer **cannot** approve builder-1's PRs. This would be a hard blocker under protection (see item #3). It adds to the review-independence concern in senior item #5. Options:
   - (a) my reviewer posts the full report as a comment review, and Quang or Sergio gives the GitHub approval;
   - (b) builder-1 PRs get reviewed by another person's agent;
   - (c) the reviewer uses a separate GitHub account.

   **Recommendation: (a)** for the hackathon. `agents/reviewer.md` step 8 would need a one-line note.
2. **Labels not created yet** (senior item #1; Sergio's item #3 is waiting on this). Only GitHub's defaults exist. Vic has `gh` and admin access and can run `scripts/setup-labels.sh` once Vic gives the go-ahead. It changes shared repo settings, so the agent didn't run it on its own.
3. **Branch protection is unavailable** (senior item #3). GitHub returns `403: Upgrade to GitHub Pro or make this repository public` for `PegasusXLab/main`. Private repos on the free plan can't protect branches. So nothing *enforces* PR-only or 1 approval on `main`, and agents rely on the `AGENTS.md` rules (plus local guards like mine). This also makes item #1 a process question, not a hard block: devops can merge after my reviewer's comment review. **Decision for the team:** accept, upgrade the org, or make the repo public.
4. **Stack TBD.** builder-1 has no lint, test or e2e commands until `plan/stack.md` is approved. My checklist will use whatever the senior puts there.
5. **`Docs/` legacy folder.** `Docs/PegasusAgents.md`, `Agent workflow.txt` and `agent-setup-prompt.txt` sit next to the root protocol. Fine to keep. Agents should treat the root `README.md` and `AGENTS.md` as authoritative. Note: `Docs/PegasusAgents.md` (the original spec) still describes files on `main`; the senior's UPDATE note at the bottom supersedes it.
6. **Vic: local activation** (owner: **Vic**). My Claude session isn't allowed to change its own settings. Vic needs to register the two hooks and add the Playwright MCP by hand (commands are in the session notes).
7. **Pending PR to `main`** (senior item #12): `CLAUDE.md`, PR template, `docs-guard`, `.gitignore`, `.env.example` from `867d992`. builder-1 can open it if Quang assigns it (`infra` lane), because it's code-branch config and not application code.
