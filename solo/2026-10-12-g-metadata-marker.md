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
