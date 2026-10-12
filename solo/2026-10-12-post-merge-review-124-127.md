---
title: Post-merge review of #124 and #127
size: S
status: review
branch: fix/post-merge-hardening
pr: 128
---

## 1 Shape
- **Problem:** #124 (+712) and #127 (+2351) merged unreviewed during the freeze.
- **Surfaces:** `src/lib/schema/validate.ts`, `src/app/api/galleries/[id]/guestbook/route.ts`.

### Acceptance criteria
- [x] Review pass against the subagent checklist (auth, validation, secrets, errors, deps, testids, render loops, XSS).
- [x] Blocking items fixed (none found) and cheap hardening items fixed with tests.

## Assumptions (autopilot)
- Fixed only two cheap hardening items; left the guestbook spam/race notes as follow-ups (they need storage design, not a one-liner).

## 4 Review
- Round 1 (sonnet): **OK, no blocking.** Verified: https-only links (zod + `safeLink`), `rel=noopener` everywhere, no new deps/secrets, guestbook id regex, body caps, 404/403 gating, `inspect-close` testid kept, stable selectors.
- Fixed: `mediaUrl` accepted `/\host` (protocol-relative off-site media) → `/^\/(?![/\\])/`; guestbook storage failures → JSON 503, failed write doesn't burn cooldown.

## 5 Ship
- PR #128, CI green, preview smoke OK (`/g/<id>`, `/edit/local`, guestbook 404 for unknown id). Awaiting Vic's merge.

## Follow-ups
- Guestbook: durable rate limit (in-memory per lambda now; XFF spoofable off Vercel).
- Guestbook: read-modify-write race can drop a concurrent signature.
