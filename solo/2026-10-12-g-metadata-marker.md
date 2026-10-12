---
title: Explicit dynamic marker for /g/[id] metadata
size: S
status: shipped
branch: fix/g-metadata-marker
pr: 131
---

## 1 Shape
- **Problem:** dev showed "URL data in generateMetadata()" on every `/g/<id>` (Next 16 Cache Components: metadata reads `params` while the shell prerenders).
### Acceptance criteria
- [x] No console error on `/g/<id>`; `<title>` / `og:title` unchanged.

## 2 Plan
- `src/app/g/[id]/layout.tsx`: `<Suspense><Connection/></Suspense>` marker (`await connection()`), per `generate-metadata.md#with-cache-components`.

## 5 Ship
- PR #131, merged cfc6f180, CI green, preview + prod smoke OK (title intact, 0 console errors).

## Correction (2026-10-12)
- #131's layout marker did NOT clear the notice: it fires only on the first load after a compile, so the follow-up check missed it. Fixed in PR #134 (68a9e380): `page.tsx` is a server component with `generateMetadata` + the marker; the client viewer moved to `ViewerClient.tsx`; layout removed. Verified on a fresh dev server (0 notices in the dev log over 3 loads).
- Lesson: verify dev-only notices on a **fresh** dev server via its log, not a warm browser reload.
