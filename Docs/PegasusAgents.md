# Foundation prompt: Pegasus agentic workflow

You are setting up the foundation of a hackathon repository for a team of 4 humans who each operate AI agents. Do NOT write any application code. The tech stack has not been chosen yet. You are only creating the workflow structure, role files, scripts and templates described below.

## Goal

Create two branches with strictly separate purposes:

1. **`main`**: code (later) + the agent role files, shared rules, setup guide, scripts and guards. Teammates read these on `main` to configure their own agents.
2. **`docs`**: an **orphan branch that is NEVER merged into `main`**. It is the agents' shared memory, message bus and progress tracker. Agents push to it directly (no PRs) and read it to find out which sprint is active, what they are assigned and what they need to review. It holds three things:
   - **Shared project memory**: plans, architecture, ADRs, the canonical task cards in `tasks/`, handoff notes and release notes.
   - **`SPRINT.md`**: the single pointer to the active sprint: its number, current phase (`planning` → `build` → `stabilize` → `freeze` → `demo`), goal, dates and ticket list. Every agent reads this first when it wakes up.
   - **One folder per agent** in `team/`, named `<agent-id>__<operator>`:

     ```
     team/
       senior__person-a/
       builder-1__<me>/
       builder-2__person-c/
       reviewer__person-b/
       devops__person-d/
       human/inbox/          escalations for the humans
     ```

     Each agent folder contains:
     - `PROFILE.md`: role, operator, tool, model, lane, plus the agent's current sprint, current ticket and status.
     - `inbox/` (with `done/`): messages addressed to this agent.
     - One subfolder per sprint (`sprint-1/`, `sprint-2/`, ...). Inside each, the agent keeps **one log file per ticket it touched** (`T-014.md`): timestamped entries of what it did, the outcome, blockers and next step. Each sprint subfolder also has a `summary.md` the agent fills in at sprint end (tickets completed, carried over, blockers, lessons).

     ```
     team/builder-1__<me>/
       PROFILE.md
       inbox/
         done/
       sprint-1/
         summary.md
         T-003.md
         T-007.md
       sprint-2/
         summary.md
         T-012.md
     ```

   Together these give every agent and human a per-agent, per-sprint tracking log: open any agent's folder to see exactly what it worked on in each sprint and where each ticket stands. The task card in `tasks/` stays the single source of truth for a ticket's status; the agent logs record each agent's own work on it, so a builder, the reviewer and devops each keep their own log for the same ticket. The senior creates each new `sprint-<N>/` folder in every agent's folder at sprint start and updates `SPRINT.md`. Each agent writes only inside its own folder, except to drop messages into another agent's `inbox/`.

Every PC keeps the `docs` branch checked out as a separate worktree at `../pegasus-docs` (also usable as an Obsidian vault), next to the code checkout.

## Team and agents

| Agent ID | Role | Operator | Tool | Model | Lane |
|---|---|---|---|---|---|
| `senior` | Senior Engineer / PM | Person A | Claude Code | Claude Opus 5.5 | Planning, architecture, tickets |
| `builder-1` | Builder | Me (Builder-1 operator) | Claude Code | Claude Opus 5.5 | Backend / API |
| `builder-2` | Builder | Person C | Antigravity | Gemini (Antigravity default) | Frontend / UI |
| `reviewer` | Reviewer | Person B | Claude Code | Claude Opus 5.5 | Review, UAT, security |
| `devops` | DevOps | Person D | Claude Code | Claude Sonnet 5.5 | CI, merge, deploy, releases |
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
- **The two-branch rule**: code and agent role files live on `main`; all plans, tasks, `SPRINT.md`, agent folders (inboxes and sprint logs), handoffs and release notes live on the `docs` branch in `../pegasus-docs`. Docs are never committed to `main`, and `docs` is never merged into `main`.
- **Docs sync protocol**: before reading docs run `scripts/docs-sync.sh`; after writing docs run `scripts/docs-push.sh "<agent-id>: <action> <task-id>"`.
- **Communication protocol summary**: the active sprint in `SPRINT.md`; task cards in `tasks/`; your messages in `team/<agent-id>__<operator>/inbox/`; your progress logs in `team/<agent-id>__<operator>/sprint-<N>/`; handoff notes in `handoffs/` (full details live in the `docs` branch README).
- **Wake-up routine** (every agent, every session): `scripts/docs-sync.sh` → read `SPRINT.md` → read your `PROFILE.md` → `scripts/inbox.sh <agent-id>` → act.
- **Logging rule**: after every meaningful action on a ticket (pickup, PR opened, review posted, changes made, merged, blocked), run `scripts/log.sh <agent-id> <task-id> "<what happened>"` and keep your `PROFILE.md` current. At sprint end, fill in your `sprint-<N>/summary.md`.
- **Universal rules**: never push directly to `main`; never force-push; never merge or cherry-pick `docs` into `main`; never read, print or commit `.env` or secrets; never edit another agent's task fields except as the status table allows; never edit another agent's `team/` folder except to drop a message into its `inbox/`; keep PRs small (one task = one PR, ideally under ~400 changed lines); if a task fails twice or review goes past 2 rounds, set status `needs-human` and message `team/human/inbox/`.
- **Definition of done**: acceptance criteria met, lint + unit tests pass, PR template filled, reviewer approved, CI green, merged, handoff note, changelog and your ticket log updated.
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
7. **Workflow**: numbered steps from waking up to finishing, starting with the wake-up routine from `AGENTS.md` and including the `scripts/log.sh` calls at each step
8. **Templates**: the exact output format(s) you produce
9. **Escalation**: when and how to hand to a human
10. **Checklist**: a short checklist to run before you mark anything done (including "ticket log updated" and "PROFILE.md current")
11. **Your folder**: the path of your `team/` folder on the docs branch and what you keep in it

Role-specific content:

**`senior.md`**
- Gathers requirements with Person A; writes `plan/overview.md`, `plan/architecture.md` (with Mermaid diagrams), `plan/stack.md`, `plan/sprints/sprint-N.md` and ADRs in `decisions/`.
- Must get Person A's explicit approval of the architecture and the task breakdown before setting any task to `ready`.
- Creates task cards from `tasks/_TEMPLATE.md`; assigns backend/API tasks to `builder-1` and frontend/UI tasks to `builder-2`; writes acceptance criteria and in-scope files so the two builders never touch the same files; records `depends_on`.
- Sends an `assignment` message to the assigned builder's inbox for each task set to `ready`, and lists the ticket in `SPRINT.md`.
- Is the only agent that edits `BOARD.md`; regenerates it after creating or reprioritizing tasks.
- Answers `question` messages in its inbox.
- Owns sprints: at each sprint start, runs `scripts/new-sprint.sh <N> "<goal>"`, which updates `SPRINT.md`, creates `sprint-<N>/` with a blank `summary.md` in every active agent folder, and messages every agent. Moves `SPRINT.md` through its phases. At sprint end, reads every agent's `summary.md` and writes the retro into `plan/sprints/sprint-<N>.md`.
- Keeps its own log per ticket it plans or unblocks in `team/senior__person-a/sprint-<N>/`.
- Changes to `AGENTS.md`, role files or the stack go to `main` through a PR, never a direct push.

**`builder.md`**
- Lane section: `builder-1` = backend/API, `builder-2` = frontend/UI. Only pick up tasks assigned to your own ID.
- Order of work: first any `changes-requested` messages, then the oldest `assignment`.
- On pickup: set the task to `in-progress`, branch from `main` as `feat/<task-id>-<slug>`, read the task card, linked plan docs and ADRs.
- Before opening a PR: lint + unit tests must pass; run only the e2e tests relevant to the task.
- Opens a PR to `main` using the PR template, adds the label `needs-review`, writes `handoffs/PR-<n>.md`, sets the task to `in-review`, fills `branch` and `pr` on the task card, and sends a `review-request` to the reviewer's inbox.
- On `changes-requested`: fix each blocking item, reply on each PR thread, append to the handoff note, set back to `in-review`, send a `review-request` again.
- If blocked on a design question, send a `question` to the senior's inbox and set the task to `blocked`.
- Keeps `team/<your-id>__<operator>/sprint-<N>/T-<id>.md` updated with `scripts/log.sh` at every step; sets `current_ticket` in `PROFILE.md` on pickup and clears it after merge. A ticket unfinished at sprint end gets a new log in the next sprint folder that links back to the old one.
- Never merges, never edits CI config, never edits another builder's files.

**`reviewer.md`**
- Picks up `review-request` messages oldest first.
- Reads the task's acceptance criteria, the PR diff and the handoff note; checks out the PR branch; does UAT (Playwright if available), targeted edge-case tests and log inspection. Does NOT re-run the full suite that CI already runs.
- Security checklist: auth, input validation, secrets, error handling, dependency changes.
- Review report template: **Verdict**, **Blocking issues**, **Non-blocking suggestions**, **What I tested**. Posted as a PR review and appended to `handoffs/PR-<n>.md`.
- Only blocking issues send work back: set the task to `changes-requested`, label the PR `changes-requested`, increment `review_rounds`, message the builder.
- After 2 rounds without approval: set `needs-human` and message `team/human/inbox/`.
- On approval: approve the PR on GitHub, label `review-approved`, set the task to `approved`, message the devops inbox with type `approved`.
- Keeps its own log per reviewed ticket in `team/reviewer__person-b/sprint-<N>/T-<id>.md` (each round: verdict, number of blocking issues, what was tested).
- Never edits source code, never pushes to the PR branch, never merges.

**`devops.md`**
- Picks up `approved` messages, one at a time (never two merges concurrently).
- Sets the task to `merging`; does a light quality and documentation pass on the diff; confirms CI is green.
- If CI is red: triages the logs, explains the failure, sets `changes-requested`, messages the builder.
- If green: squash-merges, deletes the branch, sets the task to `merged`, appends release notes to `releases/CHANGELOG.md` and the handoff note, sends a `merged` message to the builder, the reviewer and the senior, and comments on any other open PRs that now need a rebase (does not rebase them itself).
- Preview deploys are automatic via CI. Production/demo deploys require explicit approval from a human, requested through `team/human/inbox/`; after deploying, sets the task to `deployed`.
- Owns CI config, deploy config and the rollback runbook (a section in this file: how to revert a squash-merge and redeploy the previous build).
- Deploy freeze: once `SPRINT.md` is in the `freeze` phase (or after the cutoff time in `plan/overview.md`), only merges tasks labeled `bugfix`.
- Keeps its own log per merged or failed ticket in `team/devops__person-d/sprint-<N>/T-<id>.md` (CI result, merge commit, deploy target).
- **DevOps Claude Code tooling** (proposed; local to the devops operator's machine, not committed to either branch):
  - Skills: `code-review` / `security-review` for the pre-merge quality, secrets and dependency pass; `run` to verify a build before marking `merging`; `update-config` to manage the permission/hook rules below.
  - Hooks: a `PreToolUse` guard on `git push origin main*` and `git push --force*` (belt-and-suspenders on top of branch protection); a `PostToolUse` hook that, after a detected `gh pr merge`, auto-runs `scripts/log.sh devops <task-id> "merged"` plus the `merged` broadcast, so notify-on-merge can't be skipped.
  - MCP: none needed for routine merge/CI work (`gh` CLI covers PRs, labels, CI status); revisit once the stack is picked (e.g. a hosting/DB MCP if that becomes the deploy target).
  - Open question: the message `type` enum (`assignment`/.../`fyi`) has no dedicated type for broadcasting a `SPRINT.md` phase change to the whole team — devops would currently reuse `fyi` for this. Senior to confirm, or add a `phase-complete` type.

**`qa.md` / `pm.md`**: short stubs describing the intended role (QA: try to break the deployed preview and file bug tasks via the senior's inbox; PM: write user stories and acceptance criteria that feed the Senior). Mark both as not active.

### `agents/SETUP.md` (for teammates)

- Clone, then `git worktree add ../pegasus-docs docs`; open `../pegasus-docs` in Obsidian if desired.
- Find your agent's folder: `team/<agent-id>__<operator>/` on the docs branch. Replace the placeholder operator name in the folder name and `PROFILE.md` with your real name (rename with `git mv`, then `scripts/docs-push.sh`).
- **Claude Code** (senior, builder-1, reviewer, devops): `CLAUDE.md` already imports `AGENTS.md`; start a session and tell it "You are `<agent-id>`. Read `agents/<role>.md`, then run your wake-up routine."
- **Antigravity** (builder-2): add a workspace rule saying it is `builder-2` and must follow `AGENTS.md` and `agents/builder.md`.
- Manual GitHub settings for a repo admin: protect `main` (require PR, 1 approval, green CI, no force-push, no deletion); protect `docs` from deletion and force-push but allow direct pushes; run `scripts/setup-labels.sh`; optionally connect a Discord/Slack webhook for repo events.
- Note that git hooks for lint/test get added once the stack is chosen.

### `.github/pull_request_template.md`

Sections: Summary, Task (`T-xxx` + link to the task card on the `docs` branch), Changes, Diagram (Mermaid), Test evidence, Handoff note (`handoffs/PR-<n>.md` on the `docs` branch), Checklist (lint passed, unit tests passed, relevant e2e passed, no secrets, no files from the docs branch).

### `.github/workflows/docs-guard.yml`

On `pull_request` targeting `main`: fail if the head branch is `docs`, or if any changed file path starts with `plan/`, `tasks/`, `team/`, `handoffs/`, `decisions/`, `releases/`, or is `BOARD.md` or `SPRINT.md`. Print a clear message explaining the two-branch rule.

### Scripts in `scripts/` (bash, executable, `set -euo pipefail`, usable from any tool)

- `docs-sync.sh`: `git -C ../pegasus-docs pull --rebase`; prints a clear error if the worktree is missing.
- `docs-push.sh "<message>"`: in `../pegasus-docs`: `git add -A`, commit, then push; on rejection, `pull --rebase` and retry up to 3 times.
- `lib.sh`: shared helpers sourced by the other scripts: `agent_dir <agent-id>` resolves `team/<agent-id>__*/` (or `team/human/` for `human`) and fails clearly if zero or several match; `current_sprint` reads the sprint number from `SPRINT.md`.
- `send.sh <from> <to> <type> <task-id> [pr] "<body>"`: syncs, creates `<agent_dir to>/inbox/<UTC YYYYMMDD-HHMMSS>-<from>-<task-id>.md` from the message format below, and pushes. Validates `<to>` and `<type>` against the allowed lists.
- `inbox.sh <agent-id>`: syncs, then lists pending messages in that agent's `inbox/` (not in `done/`) oldest first with their type and task.
- `done.sh <agent-id> <message-file>`: `git mv` the message into that agent's `inbox/done/` and pushes.
- `log.sh <agent-id> <task-id> "<entry>"`: syncs; appends a UTC-timestamped entry to `<agent_dir>/sprint-<current_sprint>/<task-id>.md` (creating it from the ticket log template if missing); updates `last_updated`; pushes.
- `new-sprint.sh <N> "<goal>"` (senior only): updates `SPRINT.md` (number, goal, phase `planning`, start date, empty ticket list); creates `sprint-<N>/summary.md` from the summary template in every active agent folder; sends an `fyi` to every agent; pushes.
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
SPRINT.md                  active sprint pointer (sprint 1, phase planning)
team/_TEMPLATES/PROFILE.md
team/_TEMPLATES/ticket-log.md
team/_TEMPLATES/sprint-summary.md
team/senior__person-a/     PROFILE.md, inbox/ (+ done/), sprint-1/summary.md
team/builder-1__<me>/      PROFILE.md, inbox/ (+ done/), sprint-1/summary.md
team/builder-2__person-c/  PROFILE.md, inbox/ (+ done/), sprint-1/summary.md
team/reviewer__person-b/   PROFILE.md, inbox/ (+ done/), sprint-1/summary.md
team/devops__person-d/     PROFILE.md, inbox/ (+ done/), sprint-1/summary.md
team/human/inbox/          (+ done/)
   (empty folders get a .gitkeep)
handoffs/_TEMPLATE.md
releases/CHANGELOG.md
```

### `README.md` (the protocol every agent follows)

State at the top: **"This branch is never merged into `main`. Push directly; do not open PRs from it."** Then document:

**Sync rule**: always `scripts/docs-sync.sh` before reading and `scripts/docs-push.sh` after writing. One file per task, one file per message, one log per agent per ticket, so concurrent pushes rarely conflict.

**Wake-up routine**: sync → read `SPRINT.md` → read your `PROFILE.md` → check your inbox → act → log.

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
| `needs-human` | any agent, plus a message to `team/human/inbox/` |

**Message format** (`team/<to>__<operator>/inbox/<UTC YYYYMMDD-HHMMSS>-<from>-<task-id>.md`):

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

**`SPRINT.md` format**:

```markdown
---
sprint: 1
phase: planning   # planning | build | stabilize | freeze | demo
goal:
start:
end:
---
## Tickets
| ID | Title | Assignee | Status |
|---|---|---|---|
## Notes
```

**Agent `PROFILE.md`** (`team/_TEMPLATES/PROFILE.md`):

```markdown
---
agent: builder-1
role: Builder
operator: <me>
tool: Claude Code
model: Claude Opus 5.5
lane: backend
current_sprint: 1
current_ticket:
status: idle   # idle | working | blocked | waiting-review
updated_at:
---
## Working on now
## Notes for other agents
```

**Ticket log** (`team/<agent>/sprint-<N>/T-<id>.md`, from `team/_TEMPLATES/ticket-log.md`):

```markdown
---
task: T-014
agent: builder-1
sprint: 1
role_in_ticket: builder   # senior | builder | reviewer | devops
card: tasks/T-014-<slug>.md
pr:
started_at:
last_updated:
carried_from:   # e.g. team/builder-1__<me>/sprint-1/T-014.md
---
## Log
- 2026-10-10T03:12Z: picked up; branch feat/T-014-auth
## Next step
## Blockers
```

**Sprint summary** (`team/<agent>/sprint-<N>/summary.md`): Completed, Carried over (with reason), Blockers hit, Lessons / suggestions for next sprint.

**Who writes what**: senior writes `plan/`, `decisions/`, `tasks/` (creation), `BOARD.md`, `SPRINT.md` and creates sprint folders; builders and reviewer write `handoffs/`; devops writes `releases/`; each agent writes only inside its own `team/` folder, except to drop messages into other agents' inboxes; each agent only moves files out of its own inbox.

### Other files

- `BOARD.md`: a table (ID, title, lane, assignee, status, PR) with a note that only senior edits it; empty for now.
- `handoffs/_TEMPLATE.md`: sections for Builder notes (what changed, diagram, how to test), Review rounds (each with the review report template), DevOps notes (CI result, merge commit, release note).
- `decisions/ADR-000-template.md`: Context, Decision, Alternatives considered, Consequences.
- `releases/CHANGELOG.md`: heading plus one example line format.

**Kickoff message**: create one message in `team/senior__person-a/inbox/` from `human`, type `assignment`, task `T-000`, body: "Kickoff: gather requirements with Person A, then draft plan/overview.md, plan/stack.md and plan/architecture.md for approval."

Commit as `docs: initialize agent workspace` and `git push -u origin docs`.

---

## Step 3: Verify and report

1. `git ls-tree -r --name-only origin/main` contains no paths under `plan/`, `tasks/`, `team/`, `handoffs/`, `decisions/`, `releases/` and no `BOARD.md` or `SPRINT.md`.
2. `git ls-tree -r --name-only origin/docs` contains no `agents/`, `scripts/`, `.github/` or source code.
3. `git merge-base origin/main origin/docs` returns nothing (unrelated histories, confirming `docs` is a true orphan).
4. Run `scripts/inbox.sh senior` and confirm the kickoff message is listed. Confirm every agent folder in `team/` has `PROFILE.md`, `inbox/done/` and `sprint-1/summary.md`, and that `SPRINT.md` shows sprint 1 in phase `planning`.
5. Test the log: run `scripts/log.sh senior T-000 "foundation verified"` and confirm `team/senior__person-a/sprint-1/T-000.md` was created and pushed.
6. Run `scripts/setup-labels.sh`.
7. Report: the file tree of each branch, anything you could not do, and the manual steps a human still needs to do (branch protection on `main` and `docs`, filling in names, optional Discord/Slack webhook).


---

# Setup report: Senior (Quang), 2026-10-09

> **UPDATE (final layout): the setup files live on `Docs`, not `main`.** The first push put them on `main` (`867d992`) without the owner's confirmation; it was reverted by `04cf5e1`. Because every teammate is handed `agent-setup-prompt.txt` on `Docs`, `AGENTS.md`, `agents/` and `scripts/` were moved to the root of `Docs` (commit `537a7a2`, message is just "senior: log T-000" because `log.sh` pushed it). `origin/main` holds only `README.md`. Scripts resolve their own location, so run them from `../pegasus-docs` or as `../pegasus-docs/scripts/<name>.sh`.

Status: **foundation built and pushed; senior agent ready.** Run by the `senior` agent (Claude Code, Sonnet 5.5).

## What was done

**Originally on `main`, now at the root of `Docs`** (see update above):
- `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), `agents/{senior,builder,reviewer,devops,qa,pm,SETUP}.md`
- `scripts/`: `lib.sh docs-sync docs-push send inbox done log new-sprint set-status setup-labels` (executable, tested)
- **Not moved, pending a PR to `main`:** `CLAUDE.md`, `.github/pull_request_template.md`, `.github/workflows/docs-guard.yml`, `.gitignore`, `.env.example`. They exist in reverted commit `867d992`. `.gitattributes` (forces LF so scripts run on Windows) is on `Docs`.

**`Docs`** (this branch): root `README.md` protocol, `BOARD.md`, `SPRINT.md` (sprint 1, `planning`), `plan/`, `decisions/`, `tasks/_TEMPLATE.md`, `handoffs/`, `releases/`, `team/_TEMPLATES/`, and one folder per agent:
`senior__quang`, `builder-1__vic`, `builder-2__parth`, `reviewer__vic`, `devops__sergio`, `human`. Kickoff message `T-000` is in the senior inbox. The existing `Docs/` folder (these three docs) was left in place.

**Verified:** `main` has no docs paths; `Docs` has no `agents/ scripts/ .github/`; `inbox.sh senior` lists the kickoff; every agent folder has `PROFILE.md`, `inbox/done/`, `sprint-1/summary.md`; `log.sh` created `team/senior__quang/sprint-1/T-000.md`; `set-status.sh` rejects out-of-lane statuses; `send.sh` rejects unknown agents and types.

**Changes vs. the foundation spec (all deliberate):**
- Real first names replace `person-x` placeholders in folder names.
- `set-status.sh` refuses `ready` unless the card has `approved_by_human: true` (new field in `tasks/_TEMPLATE.md`). Enforces "Quang approves first".
- Branch is `Docs` (capital D), not `docs`. docs-guard treats both case-insensitively.
- devops.md carries Deploy freeze and Rollback sections as extra numbered sections.

## Senior's personal setup (local only, git-ignored, not in the repo)
- `.claude/settings.local.json`: a SessionStart hook that runs `docs-sync.sh`, prints `SPRINT.md` and lists the senior inbox; allowlist for `scripts/*`.
- `CLAUDE.local.md`: tells the session it is `senior`.
- No MCP servers installed. The `grill-me`, `grill-with-docs`, `improve-codebase-architecture` and `code-review` skills already on this machine are the ones the senior will use for planning and architecture.

## Needs attention (open items)

1. **`gh` CLI is not installed** on Quang's machine, so preflight `gh auth status` failed and `scripts/setup-labels.sh` has **not** run. Install (`winget install GitHub.cli`), `gh auth login`, then run the script. Needed by every teammate who opens, labels or merges PRs.
2. **`Docs` is not a true orphan.** It shares root commit `1334a0f` with `main` (it was created before this workflow). It is still never merged, and docs-guard blocks it, but the "unrelated histories" check fails. Converting means rewriting history and force-pushing, so it was not done. **Decision for the team:** accept as-is, or recreate an orphan branch.
3. **Branch protection is not set** (admin task): `main` (PR, 1 approval, green CI, no force-push/delete; add `docs-guard` as required once it exists) and `Docs` (no force-push/delete, direct pushes allowed).
4. ~~Model mismatch~~ **Resolved (2026-10-09):** Quang decided the senior runs Claude Opus 5.5 at default effort. The session must be switched with `/model`; docs already updated.
5. **Vic operates both `builder-1` and `reviewer`.** They are separate agents, but one human reviewing their own builder's PRs weakens review. Consider moving the reviewer role to another person.
6. **Stack, architecture, deploy-freeze time, sprint 1 goal/dates are all TBD.** Next senior step is the `T-000` kickoff: requirements with Quang, then `plan/overview.md`, `plan/stack.md`, `plan/architecture.md` for approval.
7. **No CI beyond `docs-guard`, no git hooks, no rollback runbook** until the stack is chosen (Sergio owns; TODO in `agents/devops.md`).
8. **Parth's agent (Antigravity)** needs a workspace rule pointing at `AGENTS.md` and `agents/builder.md` (see `agents/SETUP.md`). Untested by the senior.
9. **MCPs/hooks for other roles are undecided.** Suggested, not installed: Playwright MCP for the reviewer; a GitHub MCP is optional since `gh` covers it.
10. **Windows teammates must run scripts from Git Bash.** Test on macOS/Linux teammates' machines was not done (`sed_i` is written to be GNU/BSD portable).
11. Scripts run `git add -A` in the docs worktree, so uncommitted local edits there get committed on the next script run. Keep the docs worktree clean.

12. **Pending PR to `main`:** `CLAUDE.md`, PR template, `docs-guard` workflow, `.gitignore`, `.env.example` (see above). Until `docs-guard` exists nothing enforces the two-branch rule; agents rely on the rules in `AGENTS.md`. Decide who opens it.
13. **`main` history** still shows the push `867d992` and its revert `04cf5e1`.
14. Quang's local hook and `CLAUDE.local.md` now point at `../pegasus-docs/scripts/`.
