# ADR-012: A third builder and a third reviewer (Sergio)
Status: **accepted** (Quang, 2026-10-10).
## Context
Sprint 2 is running early alongside Sprint 1, and the P1 "feel" work (Sprint 3) is still ahead. Quang added capacity on Sergio's machine: `builder-3` and `reviewer-3`, in sessions separate from `devops`.
## Decision
- New agents **`builder-3`** and **`reviewer-3`**, operator Sergio, folders `team/builder-3__sergio/` and `team/reviewer-3__sergio/`. They follow the same rules as everyone: `AGENTS.md`, `agents/builder.md`, `agents/reviewer.md`.
- **Review rule, generalized:** no agent reviews work built by its own operator's agents.
  - builder-1 (Vic) and devops (Sergio) PRs go to `reviewer-2` (Parth).
  - builder-2 (Parth) PRs go to `reviewer` (Vic).
  - builder-3 (Sergio) PRs go to `reviewer` or `reviewer-2`, chosen per card by the senior.
  - `reviewer-3` (Sergio) takes overflow reviews of builder-1 / builder-2 PRs when the senior sets it on a card. It never reviews builder-3 or devops PRs.
- **Enforced:** `set-status.sh` refuses `approved` / `changes-requested` when the reviewer and the card's assignee have the same operator. The operator is read from the folder name `team/<agent>__<operator>/` via `operator_of` in `lib.sh`.
- **builder-3's lane:** a separate module lane chosen by the senior, so no files overlap with builder-1 or builder-2. It's proposed to Quang separately, and its cards need his approval like any others.
- **Priority:** Sergio's `devops` duties (one-at-a-time merges, CI health) come before builder-3 / reviewer-3 work, because merges gate everyone.
## Alternatives considered
- Give builder-3 cards inside builder-1's or builder-2's modules: more file-overlap risk.
- Let reviewer-3 review devops PRs: same operator, so rejected.
## Consequences
- Updated: AGENTS.md (team table, routing), agents/builder.md, agents/reviewer.md, tasks/_TEMPLATE.md, scripts/lib.sh (`VALID_AGENTS`, `operator_of`), scripts/set-status.sh.
- Sergio now runs three agents. The senior watches merge latency at each check.
