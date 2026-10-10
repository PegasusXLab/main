---
agent: devops
role: DevOps
operator: Sergio
tool: Codex
model: GPT-6
lane: CI, merge, deploy, releases
current_sprint: 2
current_ticket:
status: watching
updated_at: 2026-10-10T20:20:00Z
---
## Working on now
Own the serial DevOps merge queue; check every three minutes during this active session. Isolated Docs checkout: C:/Users/blech/Documents/HackAtlanta26/pegasus-devops-docs. App verification checkout: ../pegasus-devops-code.

- Latest main: T-123 / PR70, 5cded670fcaaa804ef97eddf7f7207f5c8155265. Vercel production SUCCESS; builder-3 live publish-view + auth smoke PASS 7/7 and auth/session 200. Exact approved head local publish-view/phone gate: 7 passed, 6 intentional phone creator skips. Reviewer manual audio playback/large production upload limits remain recorded in PR70 handoff.
- T-124 / PR72, cc0f050396594d32fa9f8451c548dce2ba735594: needs-human after two exact-head publish-view failures at line183 (old title persisted after Saved). Editor and iPhone/Android viewer tests passed. Senior confirmed hold; require fixed head, green publish-view/phone gate, reviewer-3 re-ack and card approved before 16:30 EDT. No author code modified.
- User explicitly approved revised schedule: Saturday18:00 demo marker, feature merges until Sunday2026-10-11 06:00EDT, bugfix-only06:00-09:00. Local helper updated and bash syntax checked. T12316:15/T12416:30 individual cutoffs retained.
- At17:45 builder-3 runs full live suite. Record its passing deployment URL/SHA in plan/overview.md and SPRINT.md as demo rollback target. Quang owns promotion/rollback and deliberately pinned demo deployments.

## Merge and deploy rules
- Card approved, review-approved label, ci/docs-guard SUCCESS; risky work also green preview and passing required e2e. Exact expected PR head enforced.
- Serial merges at least three minutes apart; latest main Vercel production SUCCESS before next merge. Check deployment after merge; notify builder-3 for live smoke within10minutes.
- Squash/delete author branch; immediately mark card merged. Batch handoff, changelog, own logs, board status and merged notifications to builder/reviewer/senior; push Docs once.
- Task reviewer field is authoritative. Parth restored per senior20:06Z: Vic builder-1/designer -> reviewer-2 or reviewer-3; Parth builder-2 -> reviewer or reviewer-3; Sergio builder-3 -> reviewer or reviewer-2. No same-operator reviews. T-127/T-132 moved to builder-2.
- Two failures or more than two review rounds: needs-human and human inbox notification. Failed main deployment: escalate immediately; no arbitrary recovery merge or rollback.
- Git Bash scripts preserve multiword arguments; DOCS_DEFER_PUSH=1 batches records. No direct main pushes, force pushes, secrets, or Docs merges into main.

## Completed and verified
- All merged PRs through #71 (except open #72) have task logs, release records, handoffs and team notifications. See releases/CHANGELOG.md for exact SHAs.
- T-119 production2f742c9 failure recovered by team redeploy; live smoke7/7. Earlier rollback baseline b29284b stays documented until demo checkpoint replaces it.
- T-118 Windows predemo launcher fixed; npm run predemo passed from PowerShell and Git Bash on live production. P0 live artwork verified by senior.
- Previous pegasus-reviewer3-docs checkout now belongs to reviewer-3; its dirty changes were left untouched. Use the isolated devops clone above.
- Incoming in-review PRs: #73 T-128 objects schema; #74 T-129 landing conveyor; #75 T-125 audio4MB cap. Await required approvals before merges.

- HOLD ALL MERGES: builder-3 live publish-view on0e9f73c failed title-save assertion (second occurrence); T125audio acceptance and auth6/6passed. T126 merge had already completed before interruption, e02f970 productionSUCCESS; card merged aligned. Human/senior notified; require investigation/recovery clearance.
