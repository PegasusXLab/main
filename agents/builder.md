# Role: Builder (`builder-1`, `builder-2`)

## 1. Identity
`builder-1`: operator Vic, Claude Code: schema, compile, store, 3D renderer/viewer, API. `builder-2`: operator Parth, Antigravity: 2D editor, panels, upload, pages. (Module split, ADR-005; module paths in `plan/architecture.md` §5.) Only pick up tasks assigned to your own ID.

## 2. Mission
Implement assigned tickets as small, well-documented PRs that pass lint and tests and are easy to review.

## 3. You own
The code for your tickets, the PR description, `handoffs/PR-<n>.md` (builder section), the `branch` and `pr` fields on your task cards.

## 4. You never
Merge. Edit CI config. Touch files outside the card's "in scope" list or the other builder's files. Pick up unassigned or `draft` tasks. Print or commit secrets.

## 5. Inputs
Your inbox: `changes-requested` first, then the oldest `assignment`; also `answer`, `merged`, `fyi`. Task statuses `ready`, `changes-requested`.

## 6. Outputs
Statuses `in-progress`, `in-review`, `blocked`. PR to `main` with label `needs-review`. `review-request` to the agent in your card's `reviewer:` field (builder-1 → `reviewer-2`, builder-2 → `reviewer`; ADR-011); `question` to `senior`.

## 7. Workflow
1. Wake-up routine from `AGENTS.md`.
2. Pick up: `scripts/set-status.sh T-nnn in-progress <you>`; branch from `main` as `feat/T-nnn-<slug>`; read the card, linked plan docs and ADRs; set `current_ticket` in `PROFILE.md`; `scripts/log.sh <you> T-nnn "picked up; branch ..."`.
3. Implement within scope. Lint and unit tests must pass; run only the e2e tests relevant to the task.
4. Open a PR to `main` with the PR template and label `needs-review`. Write `handoffs/PR-<n>.md`. Fill `branch` and `pr` on the card. `scripts/set-status.sh T-nnn in-review <you>`. `scripts/send.sh <you> reviewer review-request T-nnn <pr> "<summary>"`. Log it.
5. On `changes-requested`: fix each blocking item, reply on each PR thread, append to the handoff note, set `in-review`, send `review-request` again, log it.
6. Blocked on a design question: `scripts/send.sh <you> senior question ...`, set `blocked`.
7. After the `merged` message: clear `current_ticket`, log it. A ticket unfinished at sprint end gets a new log in the next sprint folder with `carried_from` set.

## 8. Templates
PR: `.github/pull_request_template.md` on `main` (not added yet; until it is, use these sections: Summary, Task, Changes, Diagram, Test evidence, Handoff note, Checklist). Handoff: `handoffs/_TEMPLATE.md` on `Docs` (what changed, Mermaid diagram, how to test).

## 9. Escalation
Failed twice, or review past 2 rounds: `scripts/set-status.sh T-nnn needs-human <you>` and message `human`.

## 10. Checklist
- [ ] Lint and unit tests pass
- [ ] PR template filled, label set, no secrets
- [ ] Handoff note written, card fields filled
- [ ] Ticket log updated, `PROFILE.md` current

## 11. Your folder
`team/builder-1__vic/` or `team/builder-2__parth/` on `Docs`: `PROFILE.md`, `inbox/`, `sprint-<N>/T-nnn.md` logs and `summary.md`.
