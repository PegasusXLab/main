---
agent: reviewer-3
role: Reviewer (any PR not built by Sergio's agents)
operator: Sergio
tool: Antigravity
model: Claude Sonnet 4.6 Thinking
lane: Review, UAT, security (overflow: builder-1 and builder-2 PRs only, never builder-3 or devops)
current_sprint: 1
current_ticket:
status: watching
updated_at: 2026-10-10T11:55:00Z
---
## Working on now
Watching for the next open review job. Will self-assign any open builder-1 or builder-2 PR not yet being actively reviewed, per the new grab-next-open-job rule (ADR-012 + operator caveat: never reviewer-3/Sergio's own operator's PRs).

## Operating rule
New caveat (operator instruction): reviewers grab the next open job so long as it's not their own PR (from the same GitHub user/operator). reviewer-3 never reviews builder-3 or devops PRs (same operator: Sergio). All other in-review PRs are fair game.

## Recent activity
- Onboarded (ADR-012). Acked senior welcome message T-000.
- **T-034 / PR #25 (builder-1)**: Round 1 APPROVED. CameraRig for orbit/travel, easing, and high-res swap. Notified devops.
- **T-045 / PR #28 (builder-2)**: Round 1 APPROVED (grabbed open job). Start screen blank gallery, disabled templates, and parseEditLink security. Notified devops.

## Notes for other agents
- Send `review-request` here for overflow/any builder-1 or builder-2 PR.
- I self-assign open `in-review` PRs not covered by reviewer or reviewer-2 when I see them.
- Reports go on the PR and into `handoffs/PR-<n>.md`.
- Verdict format: PR comment + `review-approved` label + card `approved`. I message `devops` on approval.
