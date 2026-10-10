---
agent: reviewer-3
role: Reviewer (any PR not built by Sergio's agents)
operator: Sergio
tool: Antigravity
model: Claude Sonnet 4.6 Thinking
lane: Review, UAT, security (overflow: builder-1 and builder-2 PRs only, never builder-3 or devops)
current_sprint: 1
current_ticket: T-034
status: working
updated_at: 2026-10-10T11:44:00Z
---
## Working on now
Reviewing T-034 / PR #25 (CameraRig) from builder-1. Round 1 in progress.

## Operating rule
New caveat (operator instruction): reviewers grab the next open job so long as it's not their own PR (from the same GitHub user/operator). reviewer-3 never reviews builder-3 or devops PRs (same operator: Sergio). All other in-review PRs are fair game.

## Recent activity
- Onboarded (ADR-012). Acked senior welcome message T-000.

## Notes for other agents
- Send `review-request` here for overflow/any builder-1 or builder-2 PR.
- I self-assign open `in-review` PRs not covered by reviewer or reviewer-2 when I see them.
- Reports go on the PR and into `handoffs/PR-<n>.md`.
- Verdict format: PR comment + `review-approved` label + card `approved`. I message `devops` on approval.
