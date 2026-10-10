---
id: T-006
title: Vercel previews per PR and the Vultr Object Storage bucket
status: in-progress
lane: infra
assignee: devops
reviewer: reviewer
branch:
pr:
sprint: 1
depends_on: [T-002]
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T09:43:19Z
---
## Goal
Every PR gets a preview URL (the senior verifies checkpoints there), and storage is ready for publishing (F7, Sprint 2). Hosting = Vercel; storage = Vultr Object Storage (ADR-008).

**Already done by Quang:** the Vercel project exists and is connected. Its `main` URL is **https://galliverse.vercel.app/**. Quang is giving Sergio access to the Vercel project. Quang created the **Vultr Object Storage** subscription, id `721fcbac-04a6-4f70-bdc9-68ea8868e776` (an identifier, not a secret). The bucket, endpoint and access key still need setting up: ask Quang via needs-human, and never post the key or secret.
## Acceptance criteria
- [ ] Verify the project settings: Git connected to `PegasusXLab/main`, production branch `main`, framework Next.js (detectable once T-001 merges), preview deployments on for PRs, and the Vercel bot posts the preview link on each PR
- [ ] Preview links can be opened by the reviewer and the senior without a Vercel login (turn Deployment Protection off for previews, or confirm with Quang who gets invited)
- [ ] https://galliverse.vercel.app/ serves the T-001 placeholder page after T-001 merges. It's the always-current `main` URL for the team; don't share it publicly as "the demo"
- [ ] A Vultr Object Storage bucket exists for Pegasus, with an access key limited to that bucket if Vultr allows it; images can be read publicly, nothing else is listable
- [ ] `VULTR_S3_ENDPOINT`, `VULTR_S3_BUCKET`, `VULTR_S3_ACCESS_KEY`, `VULTR_S3_SECRET_KEY` set in Vercel environment variables (preview + production). The values exist **only** there, never in the repo, logs, PR comments or messages
- [ ] ~~One-off upload check from your machine~~ **Moved to Sprint 2** (senior, per the no-key-sharing rule): storage is verified when `/api/upload` runs on a Vercel deploy using the env vars already set, so nobody handles the keys. T-006 doesn't wait for it
- [ ] Rollback runbook filled in (agents/devops.md §12, on Docs): revert a squash-merge by PR, promote the previous Vercel deployment, notify the team
- [ ] Production/demo deploys still need Quang's approval (agents/devops.md §7.7)
## Files / modules in scope
`vercel.json` (only if needed), Vercel project settings, Vultr bucket settings, agents/devops.md §12 (Docs)
## Out of scope
API routes that use storage (Sprint 2, builder-1). Vultr servers/GPUs (later draft cards). Custom domain (not decided).
## Notes
- **Human steps (Quang owns both accounts):**
  - Vercel access for you: Quang is adding you.
  - Vultr bucket + access key: when you reach that step, send `needs-human` to `team/human/inbox/` with exactly what Quang should click. Recommended: Quang creates the bucket and key in Vultr and types the four values straight into Vercel's environment variables himself, so the secret never passes through anyone else.
  - Never ask anyone to paste keys into chat, docs or messages.
- Vultr **GPU** servers are not part of this card (Quang's request with Vultr is pending; T-090 to T-092 stay on hold).
- Read: plan/stack.md (Hosting), ADR-008, agents/devops.md.
## History
- 2026-10-10T07:40:00Z senior: created as draft (Q4 approved for now: Vercel + Blob)
- 2026-10-10T07:50:00Z senior: storage changed to Vultr Object Storage per Quang; Blob dropped
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T07:54:26Z senior: status -> ready
- 2026-10-10T07:58:48Z senior: on hold. Quang will provide Vercel (and the Vultr access); devops does not start this until the senior sends an fyi that access is ready. Not part of the Sprint 0 checkpoint.
- 2026-10-10T07:58:50Z senior: status -> blocked
- 2026-10-10T08:09:26Z senior: unblocked. Quang provided Vercel (https://galleriverse.vercel.app/, connected) and owns the Vultr account; Sergio's Vercel access is coming from Quang.
- 2026-10-10T08:09:27Z senior: status -> ready
- 2026-10-10T09:07:05Z devops: status -> in-progress
- 2026-10-10T09:07:49Z senior: carried over from Sprint 0 into Sprint 1
- 2026-10-10T09:08:02Z devops: status -> needs-human (escalation sent to team/human/inbox: Vercel access unconfirmed, site 404s, Vultr bucket/key needed)
- 2026-10-10T09:24:41Z senior: the production URL is https://main-six-lemon-62.vercel.app/ (per Quang; verified 200, public, serves the Pegasus page). galleriverse.vercel.app is not attached (DEPLOYMENT_NOT_FOUND). Remaining: PR preview builds all fail (need logs), preview protection, Vultr bucket/key.
- 2026-10-10T09:25:47Z senior: Quang updated the production domain to https://galliverse.vercel.app/ (verified: 200, public, serves Pegasus). It replaces main-six-lemon-62 in all docs.
- 2026-10-10T09:40:02Z senior: Quang CONFIRMS the four VULTR_S3_* env vars are set correctly in Vercel (Production + Preview). Human verification is done; devops doesn't need to re-ask. Remaining: devops's one-off upload/public-read check, the PR preview build failures (logs), and preview protection.
- 2026-10-10T09:40:24Z senior: upload check moved to Sprint 2 (API cards), so keys never leave Vercel.
- 2026-10-10T09:43:19Z devops: status -> in-progress
- 2026-10-10T10:37:22Z senior: ROOT CAUSE of the 'failing previews': Vercel builds every Docs-branch push (no app there), so they all fail. Real PR previews PASS (PR #16: 'Deployment has completed'). Fix: in Vercel Settings > Git > Ignored Build Step, skip VERCEL_GIT_COMMIT_REF = Docs (sent to Quang). The preview AC is effectively met for PRs.
- 2026-10-10T10:44:59Z senior: VERIFIED. After Quang set the Ignored Build Step, 7 Docs pushes created zero Vercel deployments (before: one failed build per push). The 'failing previews' issue is closed.
- 2026-10-10T10:48:03Z senior: VERIFIED. Preview Deployment Protection is off: a PR preview (main-b6t5fcz69-kaiser1xs-projects.vercel.app) returns 200 without login. Left: rollback runbook + handoff (devops).
