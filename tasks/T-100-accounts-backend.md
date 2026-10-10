---
id: T-100
title: Accounts backend - register, log in, log out, me (ADR-014)
status: in-progress
lane: backend
assignee: builder-3
reviewer: reviewer
branch: feat/T-100-accounts-backend
pr: 57
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: builder-3
updated_at: 2026-10-10T17:29:27Z
---
## Goal
Real, minimal email + password accounts so the landing page (T-101) can register and log users in. ADR-014, accepted by Quang.
## Acceptance criteria
- [ ] `POST /api/auth/register` {email, password, name?} creates a user: email trimmed + lower-cased, password at least 8 chars, scrypt + random salt (Node `crypto`). A duplicate email returns 409 with a generic message.
- [ ] `POST /api/auth/login` {email, password} returns 200 and sets the session cookie; a wrong email OR password returns the SAME 401 "Email or password is incorrect" (no user enumeration), with a constant-time compare. Basic per-instance attempt limit (e.g. 10/min per email+IP), returning 429.
- [ ] `POST /api/auth/logout` clears the cookie. `GET /api/auth/me` returns {id, email, name} or 401.
- [ ] Session cookie `gv_session`: HttpOnly, Secure (in production), SameSite=Lax, Path=/, 7 days; value = HMAC-SHA256-signed {userId, exp} using `AUTH_SECRET`. Tampered or expired tokens are rejected.
- [ ] `AUTH_SECRET` missing: in development use a clearly-labelled dev-only fallback; in production the auth routes return 503 "Accounts not configured" (other features unaffected). Never log secrets, passwords or hashes.
- [ ] Users are stored privately through the existing storage adapter as `users/<sha256(email)>.json` and are never served by `/api/files` (add a deny for `users/` there if that route would expose it; it's a one-line guard and in scope).
- [ ] Unit tests: hashing, the token sign/verify/tamper/expire path, register/login/logout/me routes, enumeration-safe errors. Lint, unit tests and `npm run predemo` pass.
- [ ] Add `AUTH_SECRET=` (empty) to `.env.example` with a comment.
## Files / modules in scope
- src/lib/auth/* (new: password.ts, session.ts, users.ts + tests)
- src/app/api/auth/{register,login,logout,me}/route.ts (new, + tests)
- src/app/api/files/[...key]/route.ts (only the `users/` deny guard)
- .env.example (one line)
## Out of scope
- UI (T-101, designer-2). Gallery ownership / editing without the key (T-102, deferred). Email verification, password reset, OAuth.
- Changing the Gallery schema or the storage adapter's interface.
## Build kit
- **Libraries:** none (Node `crypto` only).
## Notes
- ADR-014. Security review focus for reviewer: hashing params, cookie flags, enumeration, signature check, `users/` not publicly readable.
- 🔑 Quang adds `AUTH_SECRET` in Vercel (Production + Preview). Never in the repo or messages.
- Freeze today 18:00 EDT. Target PR by ~15:30 EDT so T-101 can wire to it.
- Publish the API contract (request/response shapes above) unchanged; T-101 codes against it in parallel.
## History
- 2026-10-10T17:25:57Z senior: carded from ADR-014 (accepted by Quang); assigned to builder-3 per Quang ("assign it to Sergio")
- 2026-10-10T17:26:17Z senior: status -> ready
- 2026-10-10T17:29:27Z builder-3: status -> in-progress
