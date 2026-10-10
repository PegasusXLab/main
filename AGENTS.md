# Pegasus: shared agent rules

Project: **Pegasus** hackathon project. Stack (approved by Quang, 2026-10-10; details in `plan/stack.md`): **Next.js (App Router) + TypeScript + Tailwind · three + @react-three/fiber + drei · zustand · @use-gesture/react · zod · vitest + Playwright. Hosting: Vercel; storage: Vultr Object Storage (S3 client).** Stack changes need Quang's approval via the senior.

## Team

| Agent ID | Role | Operator | Tool | Model | Lane |
|---|---|---|---|---|---|
| `senior` | Senior Engineer / PM | Quang | Claude Code | Claude Opus 5.5 | Planning, architecture, tickets |
| `builder-1` | Builder | Vic | Claude Code | Claude Opus 5.5 | Schema, compile, store, 3D renderer/viewer, API |
| `builder-2` | Builder | Parth | Antigravity | Gemini (Antigravity default) | 2D editor, panels, upload, pages |
| `reviewer` | Reviewer | Vic | Claude Code | Claude Opus 5.5 | Review, UAT, security |
| `devops` | DevOps | Sergio | Claude Code | Claude Sonnet 5.5 | CI, merge, deploy, releases |
| `qa` | QA (planned, not active) | TBD | TBD | TBD | Adversarial testing |
| `pm` | Product Manager (planned, not active) | TBD | TBD | TBD | Stories, acceptance criteria |

`builder-1` and `reviewer` share an operator but are separate agents in separate sessions. The reviewer agent never reviews work it produced in a builder session.

## The two-branch rule

- **`main`**: application code only (and, later, CI config and the PR template).
- **`Docs`**: everything else: this file, `agents/` role files, `scripts/`, plans, tasks, `SPRINT.md`, agent folders (inboxes and sprint logs), handoffs and release notes. It is checked out as a worktree at `../pegasus-docs` next to the code checkout.
- Docs are never committed to `main`. `Docs` is never merged into `main`. Agents push to `Docs` directly (no PRs).
- **Script paths**: every `scripts/...` path in these files is relative to the Docs worktree. Run `cd ../pegasus-docs` first, or call them as `../pegasus-docs/scripts/<name>.sh` from the code checkout.

## Reference repo

Reference repo (read-only, inspiration only, never copy): basementstudio/website-2k25 @ 70d274e3638a20d53246896177e6ed24915c7662.
Read it with `gh api` or raw.githubusercontent.com URLs; do not clone it into this repo.

## Docs sync protocol

- Before reading docs: `scripts/docs-sync.sh`
- After writing docs: `scripts/docs-push.sh "<agent-id>: <action> <task-id>"`

## Communication protocol (summary)

- Active sprint: `SPRINT.md`. Task cards: `tasks/`. Your messages: `team/<agent-id>__<operator>/inbox/`. Your progress logs: `team/<agent-id>__<operator>/sprint-<N>/`. Handoff notes: `handoffs/`.
- Send a message: `scripts/send.sh <from> <to> <type> <task-id> [pr] "<body>"`. Change a status: `scripts/set-status.sh <task-id> <status> <agent-id>`.
- Full details are in `README.md` at the root of this branch.

## Wake-up routine (every agent, every session)

`scripts/docs-sync.sh` -> read `SPRINT.md` -> read your `PROFILE.md` -> `scripts/inbox.sh <agent-id>` -> act.

## Logging rule

After every meaningful action on a ticket (pickup, PR opened, review posted, changes made, merged, blocked) run `scripts/log.sh <agent-id> <task-id> "<what happened>"` and keep your `PROFILE.md` current. At sprint end, fill in your `sprint-<N>/summary.md`.

## Universal rules

- Never push directly to `main` (code goes in by PR); never force-push; never merge or cherry-pick `Docs` into `main`.
- Never read, print or commit `.env` or secrets.
- Never edit another agent's task fields except as the status table allows.
- Never edit another agent's `team/` folder except to drop a message into its `inbox/`.
- Keep PRs small: one task = one PR, ideally under ~400 changed lines.
- If a task fails twice or review goes past 2 rounds, set status `needs-human` and message `team/human/inbox/`.

## Definition of done

Acceptance criteria met, lint and unit tests pass, PR template filled, reviewer approved, CI green, merged, handoff note, changelog and your ticket log updated.

Your role: read `agents/<your-agent-id>.md` (builders read `agents/builder.md`).
