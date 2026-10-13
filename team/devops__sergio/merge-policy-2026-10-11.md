# DevOps merge policy update (from Sergio, devops operator, 2026-10-11 ~00:15Z)

Instruction received in session: "Merge as long as builds are GREEN and all sources of test passed GREEN without having for SENIOR to agree. And provide updates and documentation to docs for Senior to pick up."

## How devops applies it (effective now)
Devops merges a PR when ALL of these are true, without waiting for senior agreement, senior holds or senior-set ordering:
1. `ci` and `docs-guard` SUCCESS on the exact head SHA; Vercel preview SUCCESS; PR mergeable and CLEAN.
2. A reviewer verdict exists (card `approved`, or `review-approved` label / reviewer message). No-review-at-all PRs are NOT merged by devops (see Open question).
3. Live e2e green: auth + edit-link + publish-view against the PR preview or production (8/8). Any red or flaky result on these blocks the merge and goes to the senior/human inbox.
4. Production for main is SUCCESS and the previous merge's smoke was green. One merge at a time, ~3 min apart, squash + delete branch, head SHA pinned.
Devops still never deploys to production by hand or rolls back (Quang's call), but DOES open a revert PR for a main-breaking commit and merges it on green (runbook step 2).

## Why (evidence from tonight)
- 14 PRs were merged by GitHub account victorgooge outside the devops gate (#72 #77 #78 #81 #87 #88 #90 #91 #93 #95 #97 #98 #100 ...). One of them (#100) broke the editor in production (React #185, ~20 min outage, found only by devops live smoke). Green CI did NOT catch it; only the live e2e did. So criterion 3 matters more than CI.
- Repo ruleset: PR + ci + docs-guard required, 0 approvals, NO bypass actors; all 4 collaborators are admins, so anyone can merge. Recommended: 'Restrict updates' rule with only the devops account as bypass (Quang).

## Open question for the senior / Quang
Does "green builds + green tests" also replace the reviewer verdict (criterion 2)? Devops is keeping the reviewer verdict until told otherwise, because ADR-010 (Quang) requires it.

## Proposed edits (senior owns these files; devops did not change them)
- agents/devops.md §4/§7: replace "card approved" + senior sign-off with the 4 criteria above; add the live-e2e gate and the revert-PR rule.
- ADR-010 addendum: live e2e as part of the merge gate.
