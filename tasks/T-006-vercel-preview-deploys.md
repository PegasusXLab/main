---
id: T-006
title: Vercel previews per PR and the Vultr Object Storage bucket
status: ready
lane: infra
assignee: devops
reviewer: reviewer
branch:
pr:
sprint: 0
depends_on: [T-002]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T08:09:27Z
---
## Goal
Every PR gets a preview URL (the senior verifies checkpoints there), and storage is ready for publishing (F7, Sprint 2). Hosting = Vercel; storage = Vultr Object Storage (ADR-008).

**Already done by Quang:** the Vercel project exists and is connected. Its `main` URL is **https://galleriverse.vercel.app/**. Quang is giving Sergio access to the Vercel project.
## Acceptance criteria
- [ ] Verify the project settings: Git connected to `PegasusXLab/main`, production branch `main`, framework Next.js (detectable once T-001 merges), preview deployments on for PRs, and the Vercel bot posts the preview link on each PR
- [ ] Preview links can be opened by the reviewer and the senior without a Vercel login (turn Deployment Protection off for previews, or confirm with Quang who gets invited)
- [ ] https://galleriverse.vercel.app/ serves the T-001 placeholder page after T-001 merges. It's the always-current `main` URL for the team; don't share it publicly as "the demo"
- [ ] A Vultr Object Storage bucket exists for Pegasus, with an access key limited to that bucket if Vultr allows it; images can be read publicly, nothing else is listable
- [ ] `VULTR_S3_ENDPOINT`, `VULTR_S3_BUCKET`, `VULTR_S3_ACCESS_KEY`, `VULTR_S3_SECRET_KEY` set in Vercel environment variables (preview + production). The values exist **only** there, never in the repo, logs, PR comments or messages
- [ ] A one-off check (from your machine, not committed) proves upload + public read work with those settings; record the result (not the keys) in the handoff note
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
