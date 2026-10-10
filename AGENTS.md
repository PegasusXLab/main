# Pegasus: shared agent rules

Project: **Pegasus** hackathon project. Stack (approved by Quang, 2026-10-10; details in `plan/stack.md`): **Next.js (App Router) + TypeScript + Tailwind · three + @react-three/fiber + drei · zustand · @use-gesture/react · zod · vitest + Playwright. Hosting: Vercel; storage: Vultr Object Storage (S3 client).** Stack changes need Quang's approval via the senior.

## Team

| Agent ID | Role | Operator | Tool | Model | Lane |
|---|---|---|---|---|---|
| `senior` | Senior Engineer / PM | Quang | Claude Code | Claude Opus 5.5 | Planning, architecture, tickets |
| `builder-1` | Builder | Vic | Claude Code (temporarily Antigravity) | Claude Opus 5.5 (temporarily Gemini, until Vic's Claude usage resets) | Schema, compile, store, 3D renderer/viewer, API |
| `builder-2` | Builder | Parth | Antigravity | Gemini (Antigravity default) | 2D editor, panels, upload, pages |
| `reviewer` | Reviewer (builder-2 PRs) | Vic | Claude Code (temporarily Antigravity) | Claude Opus 5.5 (temporarily Gemini, until Vic's Claude usage resets) | Review, UAT, security |
| `reviewer-2` | Reviewer (builder-1 and devops PRs) | Parth | Antigravity | Gemini (High) | Review, UAT, security (ADR-011; Parth's builder-2 work comes first) |
| `builder-3` | Builder | Sergio | TBD | TBD | Tests (Playwright e2e), demo gallery, README; Sprint 3: room audio (ADR-012) |
| `reviewer-3` | Reviewer (overflow: any PR not built by Sergio's agents) | Sergio | Codex | (Codex default) | Review, UAT, security (ADR-012) |
| `devops` | DevOps | Sergio | Claude Code | Claude Sonnet 5.5 | CI, merge, deploy, releases |
| `qa` | QA (planned, not active) | TBD | TBD | TBD | Adversarial testing |
| `pm` | Product Manager (planned, not active) | TBD | TBD | TBD | Stories, acceptance criteria |

Operators run several agents, each in its own session: Vic runs `builder-1` + `reviewer`, Parth runs `builder-2` + `reviewer-2`, and Sergio runs `devops` + `builder-3` + `reviewer-3`. **Review routing (ADR-011, ADR-012):** builder-1 and devops PRs go to `reviewer-2`; builder-2 PRs go to `reviewer`; builder-3 PRs go to `reviewer` or `reviewer-2`; `reviewer-3` takes overflow reviews of builder-1 and builder-2 PRs when the senior assigns them. **No agent ever reviews work built by its own operator's agents.** The card's `reviewer:` field is the source of truth, and `set-status.sh` enforces it.

## The two-branch rule

- **`main`**: application code only (and, later, CI config and the PR template).
- **`Docs`**: everything else: this file, `agents/` role files, `scripts/`, plans, tasks, `SPRINT.md`, agent folders (inboxes and sprint logs), handoffs and release notes. It is checked out as a worktree at `../pegasus-docs` next to the code checkout.
- Docs are never committed to `main`. `Docs` is never merged into `main`. Agents push to `Docs` directly (no PRs).
- **Script paths**: every `scripts/...` path in these files is relative to the Docs worktree. Run `cd ../pegasus-docs` first, or call them as `../pegasus-docs/scripts/<name>.sh` from the code checkout.

## Hosting and storage

- **Local first:** build and verify everything with `npm run dev` (http://localhost:3000) and `npm test`. No accounts are needed. Server storage falls back to local disk under `.data/` (gitignored) when the `VULTR_S3_*` variables are unset (ADR-008).
- **Vercel (hosting):** set up and connected by Quang. The always-current `main` deploys to **https://galliverse.vercel.app/** (team only, not the public demo). Every PR gets a preview link. Production/demo deploys need Quang's approval. Setup is tracked in T-006 (devops).
- **Vultr Object Storage (gallery JSON + images):** Quang's Vultr account. It is reached through the S3 client with `VULTR_S3_ENDPOINT`, `VULTR_S3_BUCKET`, `VULTR_S3_ACCESS_KEY` and `VULTR_S3_SECRET_KEY`. Their values live **only** in Vercel environment variables or your uncommitted local `.env`. Never paste them into chat, docs, PRs or messages.
- **Vultr cloud GPU:** Quang's request is pending. Don't plan or start GPU work (T-090 to T-092 are on hold).

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

## Gotchas (maintained by the senior; send new ones as an `fyi` to senior)

- **Next.js 16.4 with Cache Components differs from model memory.** Before writing pages or API routes, read the installed docs in `node_modules/next/dist/docs/`. Do not rely on memory. (builder-1, T-001)
- **Next writes its own `AGENTS.md` into the repo root on `next dev`** when it detects an AI agent. `next.config.ts` sets `agentRules: false` so it never lands on `main`. Do not remove that setting. (builder-1, T-001)
- **`CLAUDE.md` on main imports `../pegasus-docs/AGENTS.md`**: shared rules live on the Docs worktree, never on main. (T-002)

- **Vercel builds every branch, including `Docs`.** Docs pushes used to show up as failed Vercel deployments. Fixed 2026-10-10: the Ignored Build Step now skips `Docs`. Judge PRs by their own Vercel check. (senior, T-006)

## Definition of done

Acceptance criteria met, lint and unit tests pass, PR template filled, reviewer approved, CI green, merged, handoff note, changelog and your ticket log updated.

Your role: read `agents/<your-agent-id>.md` (builders read `agents/builder.md`).
