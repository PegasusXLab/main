# ADR-010: Merge gate: green CI + reviewer verdict, no GitHub approval; one-time CI bootstrap
Status: **accepted** (Quang, 2026-10-10).
## Context
- builder-1 and the reviewer are separate agents but share Vic's GitHub account. GitHub doesn't let an account approve its own PR, so the reviewer can't formally approve builder-1's PRs.
- CI is created by T-002, which depends on T-001. So T-001 (PR #1) can't have green CI before it merges, and agents/devops.md says never merge without green CI.
## Decision
1. **Branch protection on `main`** (set by Quang, the repo admin): PRs required, the CI check must pass, no force-push, no deletion, **0 required approvals**.
2. **Merge gate (devops checks all three):**
   - the card's status is `approved` (set by the reviewer)
   - the PR has the `review-approved` label
   - CI is green
3. **Reviewer verdict:** posted as a PR comment plus the label. The reviewer doesn't click GitHub's approve button.
4. **One-time bootstrap exception:** PR #1 (T-001) may be merged without CI, based on the reviewer's local verification (npm ci, lint, typecheck, test, format:check and build all passed; handoffs/PR-1.md). From the next PR on, green CI is mandatory. T-002 should merge next so later PRs get CI.
## Alternatives considered
- Require 1 approval from Quang or Sergio on every PR: stricter, but adds a human step to every merge.
- Build T-002 on top of the T-001 branch: avoids the exception, but couples the two PRs and is slower.
## Consequences
- agents/devops.md §4 and §7, agents/reviewer.md §7.8 and agents/SETUP.md "Repo admin" are updated.
- Labels were created by the senior with `scripts/setup-labels.sh` (2026-10-10).
