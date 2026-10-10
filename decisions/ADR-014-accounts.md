# ADR-014: Minimal accounts (register / log in / log out)
Status: **accepted** (Quang, 2026-10-10 ~13:35 EDT). T-102 (owner-based edit) deferred unless time allows. Changes plan.md §2.8 ("no accounts").

## Context
Quang wants a landing page where new users **register or log in** (designer-2, from the reference `galleriverse-ui-design`). Today there are no accounts: a gallery is edited with a secret edit link. Freeze is TODAY Sat 2026-10-10 18:00 EDT (~4.5 h), so this must be very small and reuse what exists.

## Decision (proposed)
- **Email + password only.** Out of scope: email verification, password reset, OAuth/social login, and profiles beyond a display name.
- **Passwords:** scrypt with a random salt (Node `crypto`, same as the edit key, T-031). Min 8 characters. Emails are normalized (trimmed, lower-cased).
- **Storage:** through the existing storage adapter (local disk in dev, Vultr in production), as **private** objects `users/<sha256(email)>.json` = `{id, email, name, passwordHash, createdAt}`. No database.
- **Session:** an HTTP-only, `Secure`, `SameSite=Lax` cookie holding an HMAC-SHA256-signed token `{userId, exp}` (7 days). The secret is **`AUTH_SECRET`**, set **only in Vercel env vars**. 🔑 **Quang must add it** (a random 32+ byte string). Logout clears the cookie.
- **API** (builder-1): `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Generic errors ("email or password is incorrect"), with no user enumeration. A basic per-instance attempt limit on login.
- **Galleries:** if a gallery is published while logged in, the server records its owner **separately** (`galleries/<id>.owner`, private). **No Gallery schema change.** The owner may edit without the key; the edit-key link keeps working for everyone (it's how existing galleries and the demo work).
- **UI** (designer-2): the landing page with register/login, consuming designer's shared tokens and primitives (ADR-013). After login → the editor (new blank gallery).

## Alternatives considered
- An auth provider (Clerk, Auth.js + OAuth): faster polish, but new accounts and keys, and more dependencies right before the freeze.
- No backend (a UI-only mock): looks done but isn't real; it fails "works for every user".

## Consequences
- New env var `AUTH_SECRET`: **set in Vercel by Quang 2026-10-10 ~13:42 EDT**. The reviewer's security focus: hashing, cookie flags, no enumeration, signature checks.
- Cards T-100 (backend, builder-1), T-101 (landing + auth UI, designer-2) and T-102 (owner-based edit, builder-1) after approval.
