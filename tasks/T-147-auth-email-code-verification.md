---
id: T-147
title: Auth - new accounts verify their email with a 6-digit code (Gmail SMTP)
status: approved
lane: backend
assignee: senior
reviewer: reviewer-3
branch: feat/T-147-email-verification
pr: 117
sprint: 4
depends_on: [T-146]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: reviewer-3
updated_at: 2026-10-11T04:48:55Z
---
## Goal
New users prove they are a real person who owns the address: register sends a 6-digit code by email, and the account works only after the code is entered (Quang, 19:55 EDT: "email a 6-digit code"; the code + honeypot + rate limits are the human check, no CAPTCHA).
## Acceptance criteria
- [ ] Register creates the user with `emailVerified: false` and answers 202 `{ needsVerification: true, email }` with NO session. It sends a code from `crypto.randomInt` (6 digits), stored only as an HMAC (AUTH_SECRET), valid 10 min, max 5 wrong tries (then a new code is required).
- [ ] `POST /api/auth/verify { email, code }`: correct -> `emailVerified: true`, session issued (T-146 cookie), 200 user. Wrong/expired -> 400 with a clear message and tries left. `POST /api/auth/verify/resend`: at most 1 per 60 s and 5 per hour per email.
- [ ] Login of an unverified account -> 403 "Verify your email first" + the UI offers "Send a new code". Existing users WITHOUT the field count as verified (no lock-out of accounts made before this).
- [ ] Register page: a code step (6 inputs or one numeric field, paste works, autocomplete="one-time-code"), resend with a countdown, inline errors. A hidden honeypot field: if filled, answer as if OK but create nothing. Register rate limit: 5 per IP per 10 min.
- [ ] Email: nodemailer over Gmail SMTP (smtp.gmail.com:465) with `GMAIL_USER` + `GMAIL_APP_PASSWORD`. Subject "Your Galleriverse code: 123456"; plain text + simple HTML. Unset outside production -> the code is printed to the server console (local first, ADR-008); unset in production -> register answers 503 "Email is not set up yet". Never log the code in production, never return it in a response.
- [ ] E2E: with `E2E_EMAIL_SINK=1` (refused when NODE_ENV=production) codes are also written to `.data/outbox/<email>.txt`; the spec registers, reads the code, verifies, reloads (still signed in), logs out, logs in. Unit tests for code expiry, tries, resend limits, grandfathering, honeypot. Lint, unit, build, e2e green.
## Files / modules in scope
- src/lib/auth/verify.ts (new, +test), src/lib/email/send.ts (new, +test), src/lib/auth/users.ts (emailVerified only), src/app/api/auth/register/route.ts, src/app/api/auth/verify/** (new), src/app/api/auth/login/route.ts (the unverified check only), src/app/register/page.tsx, e2e spec, package.json (nodemailer)
- ADDED 2026-10-11 (Quang revival): src/components/auth/AuthForm.tsx + authClient.ts (+tests) (builder-3's 00:36Z ask), src/app/api/auth/auth.test.ts, src/lib/auth/http.ts (rate-limit helper), tests/e2e/auth.spec.ts + auth-session.spec.ts + fixtures, playwright.config.ts (local E2E_VERIFY_SECRET default), .env.example (names only).
## Out of scope
- Google sign-in, CAPTCHA, password reset, changing an email.
## Build kit
- **Libraries:** nodemailer (+ @types/nodemailer). Approved by Quang 2026-10-10 (plan/stack.md).
## Notes
- **Done (Quang, 2026-10-11T01:02:47Z):** GMAIL_USER + GMAIL_APP_PASSWORD are set in Vercel (Production + Preview). Values live only in Vercel; never print or log them.
- Merge after T-146 (merged 01:13Z, #103). Built by senior (Quang, 2026-10-11 ~01:20Z); reviewer: reviewer (Vic, another operator); devops merges.
- **Revived by Quang 2026-10-11 ~00:30 EDT** ("make it have email verification"). Decisions (AskUserQuestion): verification REQUIRED (existing accounts grandfathered); nodemailer (one-time exception to the night's no-new-deps rule; nodemailer@10.0.10 ships its own types, no @types); live tests use a secret header: requests with `x-e2e-verify-secret` == env `E2E_VERIFY_SECRET` get `testCode` back (replaces the outbox sink). Quang must set E2E_VERIFY_SECRET in Vercel (Prod + Preview) and give it to devops.
## History
- 2026-10-11T00:05:42Z senior: carded from Quang's request (new users must be human + verified by an emailed code)
- 2026-10-11T00:06:08Z senior: status -> ready
- 2026-10-11T01:02:47Z senior: Quang set GMAIL_USER / GMAIL_APP_PASSWORD in Vercel
- 2026-10-11T01:19:26Z senior: reassigned builder-3 -> senior by Quang ("carry on this task yourself instead of asking builder 3")
- 2026-10-11T01:20:35Z senior: status -> in-progress
- 2026-10-11T03:24:10Z senior: status -> draft
- 2026-10-11T03:24:42Z senior: DROPPED to post-Hacklanta roadmap by Quang (2026-10-10 ~23:35 EDT). No branch/PR existed. GMAIL_* stay set in Vercel, unused.
- 2026-10-11T04:27:54Z senior: revived by Quang (draft -> ready -> in-progress), decisions in Notes
- 2026-10-11T04:27:54Z senior: status -> ready
- 2026-10-11T04:27:57Z senior: status -> in-progress
- 2026-10-11T04:43:31Z senior: status -> in-review
- 2026-10-11T04:45:55Z reviewer-3: status -> approved
- 2026-10-11T04:48:55Z reviewer-3: status -> approved
