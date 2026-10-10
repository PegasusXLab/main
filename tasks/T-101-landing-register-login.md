---
id: T-101
title: Landing page for new users + register + log in (Quang's reference design)
status: draft
lane: design
assignee: designer-2
reviewer: reviewer-3
branch:
pr:
sprint: 3
depends_on: [T-110, T-111, T-100]
review_rounds: 0
approved_by_human: true
design_spec: ../galleriverse-ui-design (Quang's local reference; start-screen.tsx, theme.css)
updated_by: senior
updated_at: 2026-10-10T17:25:57Z
---
## Goal
A first-time visitor lands on a page that explains Galleriverse and lets them register or log in, in Quang's reference style, without breaking the existing start flow.
## Acceptance criteria
- [ ] `/` shows the landing: brand, a one-line pitch, an artwork showcase, and a register / log in panel (toggle between the two), per the reference `start-screen.tsx` layout. The existing start actions (new blank gallery, templates, open an edit link) stay on the page and keep ALL their current `id` / `data-testid` values (e2e depends on them).
- [ ] `/register` and `/login` pages (deep-linkable) use the same form component. Client validation (email format, password 8+), a pending state, server errors shown inline (401 / 409 / 429 / 503 messages from T-100), and on success go to a new blank gallery in the editor.
- [ ] When logged in (`GET /api/auth/me`): the header shows the name/email and "Log out"; the register/login panel is replaced by "Create a gallery".
- [ ] Uses T-110 tokens (Klein blue `#002fa7` is the only accent, radius 2px) and T-111 primitives; no forked primitives and no new raw hex.
- [ ] Accessible: labels, focus ring, keyboard-only flow, `prefers-reduced-motion` stops the showcase animation; works at 390 px (phones may view the landing and log in; the editor remains desktop-first).
- [ ] Lint, unit tests and `npm run predemo` pass; `web-design-guidelines` shows no blocking issues.
## Files / modules in scope
- src/app/page.tsx (landing composition)
- src/app/login/page.tsx, src/app/register/page.tsx (new)
- src/components/auth/* (new: AuthForm, UserMenu, authClient)
- src/components/landing/* (new: hero, showcase)
- package.json / lockfile: add `lucide-react` only if used (approved by Quang)
## Out of scope
- src/components/ui/* and the tokens (designer, T-110/T-111). The auth API (T-100). The editor and viewer.
- Copying reference code wholesale: rebuild it on our primitives (the reference uses shadcn/@base-ui; ADR-013 says one primitive set).
## Build kit
- **Libraries:** `lucide-react` (approved). `motion` is approved but prefer CSS transitions.
- **Primitives:** Button, Input, Label, Dialog, Tooltip from `src/components/ui` (T-111).
- **Skills to load:** `pegasus-ui`, `web-design-guidelines` (install: `bash ../pegasus-docs/team/designer__vic/kit/install-skills.sh .`).
- **References:** Quang's `galleriverse-ui-design` (app/theme.css, components/galleriverse/start-screen.tsx), decisions/ADR-013, ADR-014.
## Notes
- Start on the layout now with the T-110 tokens; swap in T-111 primitives when they merge; wire to T-100 by its contract.
- Reviewer: reviewer-3 (Sergio's; designer-2 is Quang's).
- Freeze today 18:00 EDT: PR by ~16:30 EDT.
## History
- 2026-10-10T17:25:57Z senior: carded from ADR-014 + ADR-013 (approved by Quang)
