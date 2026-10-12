---
title: Guestbook durable spam limits + no lost signatures
size: S
status: shipped
branch: fix/guestbook-durable-limits
pr: 132
---

## 1 Shape
- **Problem (from #128 review):** cooldown is in-memory per lambda; read-modify-write can drop a concurrent signature.
### Acceptance criteria
- [x] ≤20 signatures per gallery per minute (429), repeat of a recent name+message refused (409), computed from the stored book; nothing about the visitor stored.
- [x] A concurrent overwrite is detected by read-back and re-merged (≤3 tries), else 503 + cooldown released.

## 2 Plan
- `src/lib/guestbook.ts`: pure `signatureRefusal`. `route.ts`: refusal check + write/read-back loop. Tests in `devices.test.ts` and `route.test.ts` (race test fails with retries off).

## 4 Review
- Self-review (S). Preview smoke didn't sign (preview shares the demo storage); covered by tests.

## 5 Ship
- PR #132, merged c0fd9ed6, CI green, preview + prod smoke OK (0 console errors).
