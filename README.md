# Pegasus docs branch: protocol

**This branch is never merged into `main`. Push directly; do not open PRs from it.**

It is the agents' shared memory, message bus and progress tracker. Application code lives on `main`; everything the agents need (role files, scripts, plans) lives here. (The branch is named `Docs`; the worktree lives at `../pegasus-docs` next to the code checkout.)

## Sync rule
Always `scripts/docs-sync.sh` before reading and `scripts/docs-push.sh "<msg>"` after writing (both in `scripts/` at this branch's root). One file per task, one file per message, one log per agent per ticket, so concurrent pushes rarely conflict.

## Wake-up routine
sync -> read `SPRINT.md` -> read your `PROFILE.md` -> check your inbox -> act -> log.

## Task card
`tasks/T-<nnn>-<slug>.md`, from `tasks/_TEMPLATE.md`.

## Status lifecycle and who may set each status

| Status | Set by |
|---|---|
| `draft` | senior |
| `ready` | senior (only after human approval; the card gets `approved_by_human: true`) |
| `in-progress` | assigned builder, or devops on a card assigned to devops |
| `in-review` | assigned builder, or devops on a card assigned to devops |
| `changes-requested` | reviewer, or devops on red CI |
| `approved` | reviewer |
| `merging` | devops |
| `merged` | devops |
| `deployed` | devops (after human approval) |
| `blocked` | any agent, with a reason in History |
| `needs-human` | any agent, plus a message to `team/human/inbox/` |

`scripts/set-status.sh` enforces this table.

## Messages
`team/<to>__<operator>/inbox/<UTC YYYYMMDD-HHMMSS>-<from>-<task-id>.md`

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

## GitHub mirror
PR labels (`needs-review`, `changes-requested`, `review-approved`, `merged`) mirror the task status so CI and branch protection work. If they disagree, the task card on this branch wins.

## Phase and feature completion (devops)
When a feature is merged or a phase finishes, devops sets the card to `merged`/`deployed`, appends `releases/CHANGELOG.md`, updates the ticket table in `SPRINT.md`, and sends an `fyi` to every agent (and `team/human/inbox/`). That is how the checklist stays accurate across laptops.

## SPRINT.md
Single pointer to the active sprint: number, phase (`planning` -> `build` -> `stabilize` -> `freeze` -> `demo`), goal, dates, ticket table. Every agent reads it first.

## PROFILE.md, ticket logs, summaries
Templates in `team/_TEMPLATES/`. Each agent keeps `PROFILE.md` current, one `sprint-<N>/T-<id>.md` log per ticket it touched (via `scripts/log.sh`), and fills `sprint-<N>/summary.md` at sprint end (Completed, Carried over with reason, Blockers hit, Lessons).

## Who writes what
- senior: `plan/`, `decisions/`, task card creation, `BOARD.md`, `SPRINT.md`, sprint folders.
- builders and reviewer: `handoffs/`.
- devops: `releases/`, `SPRINT.md` ticket-status column.
- Every agent writes only inside its own `team/` folder, except to drop messages into other agents' inboxes, and only moves files out of its own inbox.
