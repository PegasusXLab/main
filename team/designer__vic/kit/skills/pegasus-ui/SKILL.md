---
name: pegasus-ui
description: Pegasus design system for builders - tokens, shared primitives, motion rules, 3D look rules and the approved UI stack. Load before building or changing any UI in Pegasus (start page, editor chrome, panels, 2D canvas, 3D viewer HUD, viewer3d look/feel), and whenever a task card lists it in its Build kit.
---

# Pegasus UI kit (maintained by `designer`; living document)

> **Version:** v0 (pre-direction). Tokens and fonts are TBD until the designer's first brief is approved. Until then: build to the spec's token names, and if a token doesn't exist yet, add it to `src/app/globals.css` `@theme` in the same PR, with the name the spec uses.
> Source of truth: `../pegasus-docs/team/designer__vic/`, which holds `DESIGN.md` (after `impeccable document`), `specs/` and `LOOP.md`. If this file and a spec disagree, the spec wins, so ask the designer.

## 1. Before you start a UI card
1. Read the card's **Build kit** and its linked `specs/<slug>.md` (states, tokens, motion, mockups, acceptance criteria).
2. Load the skills it lists. Defaults: `emil-design-eng` for anything that moves, and `web-design-guidelines <changed files>` before opening the PR.
3. Spec unclear? Send a `question` to the designer's inbox. Never guess at a visual.

## 2. Tokens (Tailwind 4, CSS-first)
- All design values live in `src/app/globals.css` under `@theme`: color roles (`--color-surface`, `--color-ink`, `--color-accent`, …), the type scale, radius, spacing, and motion (`--duration-*`, `--ease-*`).
- Use the generated utilities (`bg-surface`, `text-ink`, `rounded-panel`, …). **No raw hex, no `zinc-*`, no `text-[11px]`** in new code. If a value is missing, it's a token conversation, not a one-off.
- Light and dark come from the token values, not `dark:` overrides scattered through components.
- 3D and the 2D SVG read colors from one shared module (e.g. `src/lib/theme.ts`, mirroring the CSS tokens). The accent/selection color must be the same in 2D, 3D and UI. Today `#2563eb` is duplicated, and it gets replaced.

## 3. Primitives
Build or reuse `src/components/ui/*` (Button, Field, Select, Slider, PanelSection, …) instead of repeating class strings. Each one covers default, hover, focus-visible, active, disabled and loading. If it's missing, the card that first needs it creates it (as named in its Build kit).

## 4. Motion
- **Library:** `motion` for DOM and HUD, **only once Quang approves it** (check `plan/stack.md`). Until then, use CSS transitions with the motion tokens. In R3F, keep hand-written easing in `useFrame` (as CameraRig does).
- UI feedback is ≤ 200–300ms. Enters use ease-out, never ease-in. Don't animate things the user does at high frequency (typing, dragging). Use springs for gestures and layout. Respect `prefers-reduced-motion`.
- Animate `transform` and `opacity` only.

## 5. 3D look rules (viewer3d)
- Users style their own spaces, so **defaults and presets** carry the design: `ATMOSPHERE_PRESETS` and `LIGHTING_PRESETS` in `src/lib/schema/`. Change preset values through specs; don't add schema fields (it's frozen, so an ADR goes via the senior).
- Camera moves ease out over about 0.8–1.2s and never cut. Overlays (plaque, HUD) use the same tokens as the site.

## 6. Non-negotiables
- Keep every `id` and `data-testid`; vitest and Playwright e2e must pass.
- Stay inside the card's `files_in_scope`. Don't touch another builder's files.
- basement.studio is inspiration only (ADR-003): never copy its code, shaders, models, textures or fonts.
- New libraries need Quang's approval through the senior. Component registries (Magic UI, Smooth UI, Kokonut, Unlumen) are for copying a single component in, rebuilt on our tokens.
- Before the PR: screenshots at 1440 and 390 attached to the handoff, and `web-design-guidelines` run with no blocking findings.
