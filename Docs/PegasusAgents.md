# Foundation prompt: Pegasus agentic workflow

You are setting up the foundation of a hackathon repository for a team of 4 humans who each operate AI agents. Do NOT write any application code. The tech stack has not been chosen yet. You are only creating the workflow structure, role files, scripts and templates described below.

## Goal

Create two branches with strictly separate purposes:

1. **`main`**: code (later) + the agent role files, shared rules, setup guide, scripts and guards. Teammates read these on `main` to configure their own agents.
2. **`docs`**: an **orphan branch that is NEVER merged into `main`**. It is the agents' shared memory and message bus: plans, architecture, task cards, per-agent inboxes, handoff notes and release notes. Agents push to it directly (no PRs) and read it to find out what they are assigned and what they need to review.

Every PC keeps the `docs` branch checked out as a separate worktree at `../pegasus-docs` (also usable as an Obsidian vault), next to the code checkout.

## Team and agents

| Agent ID | Role | Operator | Tool | Model | Lane |
|---|---|---|---|---|---|
| `senior` | Senior Engineer / PM | Person A | Claude Code | Claude Opus 5.5 | Planning, architecture, tickets |
| `builder-1` | Builder | Me (Builder-1 operator) | Claude Code | Claude Opus 5.5 | Backend / API |
| `builder-2` | Builder | Person C | Antigravity | Gemini (Antigravity default) | Frontend / UI |
| `reviewer` | Reviewer | Person B | Claude Code | Claude Opus 5.5 | Review, UAT, security |
| `devops` | DevOps | Person A (after planning phase) | Claude Code | Claude Sonnet 5.5 | CI, merge, deploy, releases |
| `qa` | QA (planned, not active) | TBD | TBD | TBD | Adversarial testing |
| `pm` | Product Manager (planned, not active) | TBD | TBD | TBD | Stories, acceptance criteria |

Use placeholders like `<Person A>` wherever a real name would go, so the team can fill them in.

---

## Step 0: Preflight (stop and report if anything fails)

1. Confirm you are in a git repository with an `origin` remote, and that `gh auth status` succeeds.
2. Check whether `origin/main` and `origin/docs` already exist. If either already has content other than a README or license, STOP and report what exists instead of overwriting it.
3. Confirm `../pegasus-docs` does not already exist.

---

## Step 1: Files on `main`

Create the following on `main`.

### `AGENTS.md` (shared rules every agent reads first)

Include:
- Project: "Pegasus" hackathon project. Stack: TBD (the Senior fills this in later through a PR).
- The team table above.
- **The two-branch rule**: code and agent role files live on `main`; all plans, tasks, inboxes, handoffs and release notes live on the `docs` branch in `../pegasus-docs`. Docs are never committed to `main`, and `docs` is never merged into `main`.
- **Docs sync protocol**: before reading docs run `scripts/docs-sync.sh`; after writing docs run `scripts/docs-push.sh "<agent-id>: <action> <task-id>"`.
- **Communication protocol summary**: task cards in `tasks/`, messages in `inbox/<agent-id>/`, handoff notes in `handoffs/` (full details live in the `docs` branch README).
- **Universal rules**: never push directly to `main`; never force-push; never merge or cherry-pick `docs` into `main`; never read, print or commit `.env` or secrets; never edit another agent's task fields except as the status table allows; keep PRs small (one task = one PR, ideally under ~400 changed lines); if a task fails twice or review goes past 2 rounds, set status `needs-human` and message `inbox/human/`.
- **Definition of done**: acceptance criteria met, lint + unit tests pass, PR template filled, reviewer approved, CI green, merged, handoff note and changelog updated.
- Final line: "Your role: read `agents/<your-agent-id>.md` (builders read `agents/builder.md`)."

### `CLAUDE.md`

A single line: `@AGENTS.md`

### Role files in `agents/`

Create `agents/senior.md`, `agents/builder.md` (shared by builder-1 and builder-2), `agents/reviewer.md`, `agents/devops.md`, plus `agents/qa.md` and `agents/pm.md` marked at the top as **"Planned, not active"**.

Every role file uses these sections, written in second person ("You are..."), each file under ~600 words:

1. **Identity**: agent ID(s), operator, tool, model, lane
2. **Mission**: one paragraph
3. **You own**: responsibilities
4. **You never**: hard limits
5. **Inputs**: which inbox you read, which task statuses you watch
6. **Outputs**: statuses you set, files you write, messages you send (and to whom)
7. **Workflow**: numbered steps from waking up to finishing
8. **Templates**: the exact output format(s) you produce
9. **Escalation**: when and how to hand to a human
10. **Checklist**: a short checklist to run before you mark anything done

Role-specific content:

**`senior.md`**
- Gathers requirements with Person A; writes `plan/overview.md`, `plan/architecture.md` (with Mermaid diagrams), `plan/stack.md`, `plan/sprints/sprint-N.md` and ADRs in `decisions/`.
- Must get Person A's explicit approval of the architecture and the task breakdown before setting any task to `ready`.
- Creates task cards from `tasks/_TEMPLATE.md`; assigns backend/API tasks to `builder-1` and frontend/UI tasks to `builder-2`; writes acceptance criteria and in-scope files so the two builders never touch the same files; records `depends_on`.
- Sends an `assignment` message to the assigned builder's inbox for each task set to `ready`.
- Is the only agent that edits `BOARD.md`; regenerates it after creating or reprioritizing tasks.
- Answers `question` messages in `inbox/senior/`.
- Changes to `AGENTS.md`, role files or the stack go to `main` through a PR, never a direct push.

**`builder.md`**
- Lane section: `builder-1` = backend/API, `builder-2` = frontend/UI. Only pick up tasks assigned to your own ID.
- Order of work: first any `changes-requested` messages, then the oldest `assignment`.
- On pickup: set the task to `in-progress`, branch from `main` as `feat/<task-id>-<slug>`, read the task card, linked plan docs and ADRs.
- Before opening a PR: lint + unit tests must pass; run only the e2e tests relevant to the task.
- Opens a PR to `main` using the PR template, adds the label `needs-review`, writes `handoffs/PR-<n>.md`, sets the task to `in-review`, fills `branch` and `pr` on the task card, and sends a `review-request` to `inbox/reviewer/`.
- On `changes-requested`: fix each blocking item, reply on each PR thread, append to the handoff note, set back to `in-review`, send a `review-request` again.
- If blocked on a design question, send a `question` to `inbox/senior/` and set the task to `blocked`.
- Never merges, never edits CI config, never edits another builder's files.

**`reviewer.md`**
- Picks up `review-request` messages oldest first.
- Reads the task's acceptance criteria, the PR diff and the handoff note; checks out the PR branch; does UAT (Playwright if available), targeted edge-case tests and log inspection. Does NOT re-run the full suite that CI already runs.
- Security checklist: auth, input validation, secrets, error handling, dependency changes.
- Review report template: **Verdict**, **Blocking issues**, **Non-blocking suggestions**, **What I tested**. Posted as a PR review and appended to `handoffs/PR-<n>.md`.
- Only blocking issues send work back: set the task to `changes-requested`, label the PR `changes-requested`, increment `review_rounds`, message the builder.
- After 2 rounds without approval: set `needs-human` and message `inbox/human/`.
- On approval: approve the PR on GitHub, label `review-approved`, set the task to `approved`, message `inbox/devops/` with type `approved`.
- Never edits source code, never pushes to the PR branch, never merges.

**`devops.md`**
- Picks up `approved` messages, one at a time (never two merges concurrently).
- Sets the task to `merging`; does a light quality and documentation pass on the diff; confirms CI is green.
- If CI is red: triages the logs, explains the failure, sets `changes-requested`, messages the builder.
- If green: squash-merges, deletes the branch, sets the task to `merged`, appends release notes to `releases/CHANGELOG.md` and the handoff note, sends a `merged` message to the builder, the reviewer and the senior, and comments on any other open PRs that now need a rebase (does not rebase them itself).
- Preview deploys are automatic via CI. Production/demo deploys require explicit approval from a human, requested through `inbox/human/`; after deploying, sets the task to `deployed`.
- Owns CI config, deploy config and the rollback runbook (a section in this file: how to revert a squash-merge and redeploy the previous build).
- Deploy freeze: after the cutoff time recorded in `plan/overview.md`, only merges tasks labeled `bugfix`.

**`qa.md` / `pm.md`**: short stubs describing the intended role (QA: try to break the deployed preview and file bug tasks via `inbox/senior/`; PM: write user stories and acceptance criteria that feed the Senior). Mark both as not active.

### `agents/SETUP.md` (for teammates)

- Clone, then `git worktree add ../pegasus-docs docs`; open `../pegasus-docs` in Obsidian if desired.
- **Claude Code** (senior, reviewer, devops): `CLAUDE.md` already imports `AGENTS.md`; start a session and tell it "You are `<agent-id>`. Read `agents/<role>.md` and check your inbox."
- **OpenCode** (builder-1): it reads `AGENTS.md` natively; create `.opencode/agents/builder.md` with frontmatter (`description`, `mode: primary`, the DeepSeek V4 model ID from `opencode models`, `temperature: 0.3`, and `permission` denying `git push --force*`, `git push origin main*` and `gh pr merge*`), and a body telling it it is `builder-1` and to follow `agents/builder.md`.
- **Antigravity** (builder-2): add a workspace rule saying it is `builder-2` and must follow `AGENTS.md` and `agents/builder.md`.
- Manual GitHub settings for a repo admin: protect `main` (require PR, 1 approval, green CI, no force-push, no deletion); protect `docs` from deletion and force-push but allow direct pushes; run `scripts/setup-labels.sh`; optionally connect a Discord/Slack webhook for repo events.
- Note that git hooks for lint/test get added once the stack is chosen.

### `.github/pull_request_template.md`

Sections: Summary, Task (`T-xxx` + link to the task card on the `docs` branch), Changes, Diagram (Mermaid), Test evidence, Handoff note (`handoffs/PR-<n>.md` on the `docs` branch), Checklist (lint passed, unit tests passed, relevant e2e passed, no secrets, no files from the docs branch).

### `.github/workflows/docs-guard.yml`

On `pull_request` targeting `main`: fail if the head branch is `docs`, or if any changed file path starts with `plan/`, `tasks/`, `inbox/`, `handoffs/`, `decisions/`, `releases/` or `BOARD.md`. Print a clear message explaining the two-branch rule.

### Scripts in `scripts/` (bash, executable, `set -euo pipefail`, usable from any tool)

- `docs-sync.sh`: `git -C ../pegasus-docs pull --rebase`; prints a clear error if the worktree is missing.
- `docs-push.sh "<message>"`: in `../pegasus-docs`: `git add -A`, commit, then push; on rejection, `pull --rebase` and retry up to 3 times.
- `send.sh <from> <to> <type> <task-id> [pr] "<body>"`: syncs, creates `inbox/<to>/<UTC YYYYMMDD-HHMMSS>-<from>-<task-id>.md` from the message format below, and pushes. Validates `<to>` and `<type>` against the allowed lists.
- `inbox.sh <agent-id>`: syncs, then lists pending messages (not in `done/`) oldest first with their type and task.
- `done.sh <agent-id> <message-file>`: `git mv` the message into `inbox/<agent-id>/done/` and pushes.
- `set-status.sh <task-id> <new-status> <agent-id>`: updates `status`, `updated_by`, `updated_at` in the task card's frontmatter, appends a line to its History section, and pushes. Rejects transitions the status table doesn't allow for that agent.
- `setup-labels.sh`: `gh label create ... --force` for `needs-review`, `changes-requested`, `review-approved`, `merged`, `bugfix`, `needs-human`.

### `.gitignore` and `.env.example`

`.gitignore`: `.env`, `.env.*` (but keep `.env.example`), `node_modules/`, `.obsidian/workspace*.json`, OS/editor junk. `.env.example`: a comment saying real values go in `.env` locally and GitHub Actions secrets, never in docs.

Commit as `chore: agent workflow foundation` and push to `origin main` (this initial push happens before branch protection is enabled).

---

## Step 2: The `docs` branch (orphan, never merged)

Create it in its own worktree so the main checkout is never disturbed:

```bash
git worktree add --detach ../pegasus-docs
cd ../pegasus-docs
git checkout --orphan docs
git rm -rf --quiet .
```

Create this structure:

```
README.md                  protocol (below)
BOARD.md                   task overview, edited by senior only
plan/overview.md           requirements, goals, deploy freeze time (placeholders)
plan/architecture.md       placeholder with a Mermaid stub
plan/stack.md              placeholder
plan/sprints/sprint-1.md   placeholder
decisions/ADR-000-template.md
tasks/_TEMPLATE.md
inbox/senior/   inbox/builder-1/   inbox/builder-2/
inbox/reviewer/ inbox/devops/      inbox/human/
   (each with .gitkeep and a done/ subfolder with .gitkeep)
handoffs/_TEMPLATE.md
releases/CHANGELOG.md
```

### `README.md` (the protocol every agent follows)

State at the top: **"This branch is never merged into `main`. Push directly; do not open PRs from it."** Then document:

**Sync rule**: always `scripts/docs-sync.sh` before reading and `scripts/docs-push.sh` after writing. One file per task, one file per message, so concurrent pushes rarely conflict.

**Task card** (`tasks/T-<nnn>-<slug>.md`, from `_TEMPLATE.md`):

```markdown
---
id: T-000
title:
status: draft
lane: backend | frontend | infra
assignee: builder-1 | builder-2
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: []
review_rounds: 0
updated_by:
updated_at:
---
## Goal
## Acceptance criteria
- [ ]
## Files / modules in scope
## Out of scope
## Notes
## History
- <UTC timestamp> <agent-id>: <event>
```

**Status lifecycle and who may set each status:**

| Status | Set by |
|---|---|
| `draft` | senior |
| `ready` | senior (only after human approval) |
| `in-progress` | assigned builder |
| `in-review` | assigned builder |
| `changes-requested` | reviewer, or devops on red CI |
| `approved` | reviewer |
| `merging` | devops |
| `merged` | devops |
| `deployed` | devops (after human approval) |
| `blocked` | any agent, with a reason in History |
| `needs-human` | any agent, plus a message to `inbox/human/` |

**Message format** (`inbox/<to>/<UTC YYYYMMDD-HHMMSS>-<from>-<task-id>.md`):

```markdown
---
from: reviewer
to: builder-1
type: changes-requested
task: T-014
pr: 23
created_at: 2026-10-10T03:12:00Z
---
Short body. Details in handoffs/PR-23.md.
```

Allowed types: `assignment`, `question`, `answer`, `review-request`, `changes-requested`, `approved`, `merged`, `deployed`, `escalation`, `fyi`.

**Processing rule**: on waking, run `scripts/inbox.sh <agent-id>`, handle messages oldest first (builders handle `changes-requested` before `assignment`), and move each handled message to `done/` with `scripts/done.sh`.

**GitHub mirror**: PR labels (`needs-review`, `changes-requested`, `review-approved`, `merged`) mirror the task status so CI and branch protection work. If they disagree, the task card on this branch wins.

**Who writes what**: senior writes `plan/`, `decisions/`, `tasks/` (creation), `BOARD.md`; builders and reviewer write `handoffs/`; devops writes `releases/`; everyone writes to other agents' inboxes and only moves files out of their own.

### Other files

- `BOARD.md`: a table (ID, title, lane, assignee, status, PR) with a note that only senior edits it; empty for now.
- `handoffs/_TEMPLATE.md`: sections for Builder notes (what changed, diagram, how to test), Review rounds (each with the review report template), DevOps notes (CI result, merge commit, release note).
- `decisions/ADR-000-template.md`: Context, Decision, Alternatives considered, Consequences.
- `releases/CHANGELOG.md`: heading plus one example line format.

**Kickoff message**: create one message in `inbox/senior/` from `human`, type `assignment`, task `T-000`, body: "Kickoff: gather requirements with Person A, then draft plan/overview.md, plan/stack.md and plan/architecture.md for approval."

Commit as `docs: initialize agent workspace` and `git push -u origin docs`.

---

## Step 3: Verify and report

1. `git ls-tree -r --name-only origin/main` contains no paths under `plan/`, `tasks/`, `inbox/`, `handoffs/`, `decisions/`, `releases/` and no `BOARD.md`.
2. `git ls-tree -r --name-only origin/docs` contains no `agents/`, `scripts/`, `.github/` or source code.
3. `git merge-base origin/main origin/docs` returns nothing (unrelated histories, confirming `docs` is a true orphan).
4. Run `scripts/inbox.sh senior` and confirm the kickoff message is listed.
5. Run `scripts/setup-labels.sh`.
6. Report: the file tree of each branch, anything you could not do, and the manual steps a human still needs to do (branch protection on `main` and `docs`, filling in names, optional Discord/Slack webhook).
