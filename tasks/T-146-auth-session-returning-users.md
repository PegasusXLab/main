---
id: T-146
title: BUGFIX auth - logins keep the session and user data; track new vs returning users
status: merged
lane: backend
assignee: builder-3
reviewer: reviewer-2
branch: fix/T-146-auth-session
pr: 103
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: devops
updated_at: 2026-10-11T01:13:21Z
---
## Goal
Quang (19:55 EDT): "logins [must] retain user data and session" and the app must tell new from returning users. Freeze lifted for auth by Quang.
## Acceptance criteria
- [ ] **Reproduce first:** a failing Playwright spec (e2e/auth.spec.ts or a new auth-session.spec.ts) against a prod build: register -> reload -> new tab -> still signed in; log out -> log in with the same email -> same user id, same name, same "Your galleries" list. Write the root cause in the PR.
- [ ] Session cookie `gv_session` is persistent (Max-Age = SESSION_TTL_SECONDS), HttpOnly, SameSite=Lax, Path=/, Secure in production; it survives reloads, new tabs and a browser restart for 7 days. Logout clears it (Max-Age=0, same attributes).
- [ ] Returning users: `StoredUser` gains optional `lastLoginAt` (set on login and register); `GET /api/auth/me` returns `{ id, email, name, isNew }` where `isNew` = no gallery yet and created < 24 h ago. Old user records without the field still load.
- [ ] After log in, returning users land on "Your galleries" (no blank gallery is started); new users (register) land on the new-gallery flow. Root cause (builder-3): AuthPage and the landing page call startBlankGallery on every auth success.
- [ ] Owner galleries (T-102/T-130) still open for edit after log out + log in.
- [ ] Unit tests for the cookie attributes + lastLoginAt; lint, unit, build, the auth + publish-view + edit-link e2e green.
## Files / modules in scope
- src/lib/auth/session.ts, src/lib/auth/http.ts, src/lib/auth/users.ts (lastLoginAt only), src/app/api/auth/{login,logout,me,session}/route.ts (+tests), src/app/login/page.tsx, src/components/auth/AuthPage.tsx + authClient.ts (+tests), src/app/page.tsx (the auth-success routing only), e2e auth spec
## Out of scope
- Email verification (T-147), OAuth, password reset. Showing the signed-in name in the editor/viewer headers (dropped by Quang 2026-10-11).
## Build kit
- **Libraries:** none.
## Notes
- T-147 builds on this (same login route): merge T-146 first.
## History
- 2026-10-11T00:05:42Z senior: carded from Quang's request ("make sure logins retain user data and session"); freeze lifted for auth by Quang
- 2026-10-11T00:06:03Z senior: status -> ready
- 2026-10-11T00:09:14Z builder-3: status -> in-progress
- 2026-10-11T00:24:03Z builder-3: status -> blocked
- 2026-10-11T00:26:29Z senior: scope expanded (AuthPage, authClient, landing page auth routing) and header-name AC dropped, approved by Quang; editor crash was #100 (reverted in #101), not GalleryPanel
- 2026-10-11T00:33:41Z builder-3: status -> in-progress
- 2026-10-11T00:39:12Z builder-3: status -> in-review
- 2026-10-11T00:42:34Z reviewer-2: status -> approved
- 2026-10-11T01:13:10Z devops: status -> merging
- 2026-10-11T01:13:21Z devops: status -> merged
