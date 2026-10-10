---
name: pegasus-ui
description: Pegasus design system for builders - tokens, shared primitives, motion rules, 3D look rules and the approved UI stack. Load before building or changing any UI in Pegasus (start page, editor chrome, panels, 2D canvas, 3D viewer HUD, viewer3d look/feel), and whenever a task card lists it in its Build kit.
---

# Pegasus UI kit (maintained by `designer`; living document)

> **Version:** v3 (v2: ADR-013 tokens via T-110 and primitives via T-111 / PR #58; v3: viewer HUD, plaque and room-arrival patterns via T-121 / PR #67).
> Source of truth: `../pegasus-docs/team/designer__vic/`, which holds `DESIGN.md`, `specs/` and `LOOP.md`. If this file and a spec disagree, the spec wins, so ask the designer.

## 1. Before you start a UI card
1. Read the card's **Build kit** and its linked `specs/<slug>.md` (states, tokens, motion, mockups, acceptance criteria).
2. Load the skills it lists. Defaults: `emil-design-eng` for anything that moves, and `web-design-guidelines <changed files>` before opening the PR.
3. Spec unclear? Send a `question` to the designer's inbox. Never guess at a visual.

## 2. Tokens (Tailwind 4, CSS-first & TypeScript Mirror)
All design tokens are defined in `src/app/globals.css` `@theme` and mirrored in `src/lib/theme.ts`:
- **Palette (ADR-013):**
  - `--color-plaster`: `#eff0ee` (ground, canvas background)
  - `--color-paper`: `#ffffff` (card surfaces, panel backdrops)
  - `--color-graphite`: `#1e2022` / `--color-graphite-hover`: `#2a2d30` (text, dark headers & pills)
  - `--color-pencil`: `#7d8085` (secondary text, labels, coordinates)
  - `--color-hairline`: `#d5d7d4` (borders, panel dividers, 1m grid lines)
  - `--color-accent`: `#002fa7` / `--color-accent-hover`: `#002484` / `--color-accent-subtle`: `rgba(0,47,167,0.08)` (**The ONE accent Klein blue**)
  - `--color-danger`: `#c7353f` / `--color-danger-hover`: `#aa2b34`
  - `--color-kraft`: `#c59a6a` (unhung art templates)
- **Radius:** Standard `rounded-[2px]` (`--radius-default` / `--radius-sm`: `2px`, `--radius-md`: `4px`).
- **Fonts:** Display `Archivo` (`--font-display`), UI/body `Geist` (`--font-sans` with tabular figures).
- **3D & 2D SVG canvas:** Always import from `src/lib/theme.ts`:
  ```ts
  import { THEME } from "@/lib/theme";
  // THEME.colors.accent -> '#002fa7'
  ```
- **Rules:** No raw hex, no `zinc-*`, no `text-[11px]` in new code. Use semantic tokens.

## 3. Primitives
Build or reuse `src/components/ui/*` (Button, Input, Label, Select, Slider, Toggle, Dialog, Tooltip) instead of repeating class strings. Each one covers default, hover, focus-visible, active, disabled and loading.

## 4. Motion
- UI feedback is ≤ 120–180ms (`--duration-fast`, `--duration-normal`). Enters use ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`).
- R3F viewer animations keep hand-written easing in `useFrame` (CameraRig).
- Respect `prefers-reduced-motion` (defined globally in `globals.css`).

## 5. 3D look rules (viewer3d)
- Users style their own spaces, so **defaults and presets** carry the design: `ATMOSPHERE_PRESETS` and `LIGHTING_PRESETS` in `src/lib/schema/`.
- Camera moves ease out over about 0.8–1.2s and never cut. Overlays (plaque, HUD) use the same tokens as the site. Selection highlights in 3D use `THEME.colors.accent` (`#002fa7`).

## 6. Viewer HUD patterns ("opening night", T-121)
Reuse these from `src/app/g/[id]/page.tsx` and `src/viewer3d/Plaque.tsx`; don't invent new overlay styles.
- **HUD pill / button:** `rounded-[2px] border border-white/15 bg-graphite/80 text-paper text-xs font-medium shadow-lg backdrop-blur-md`, hover `bg-graphite`, `focus-visible:ring-2 ring-accent`, `active:scale-[0.98]`. The room-name pill uses `font-display uppercase tracking-wider`. (The class string repeats today; a `HudButton` primitive is the next extraction. Don't copy it a third time; ask the designer.)
- **Top scrim:** `bg-gradient-to-b from-black/70 via-black/30 to-transparent`, `pointer-events-none`, with only the controls `pointer-events-auto`.
- **Room-arrival title:** centred `font-display uppercase tracking-widest text-2xl sm:text-3xl text-paper/90` with a soft dark drop shadow. Fade in 180ms, hold 1.5s, fade out 400ms. It's `aria-hidden` (the room pill is the `aria-live` source) and has no transition under `motion-reduce`.
- **Plaque = wall label:** `bg-paper/95 border-hairline rounded-[2px] p-5 max-w-md`. Title `text-base font-semibold`, artist `text-xs uppercase tracking-wider text-pencil`, story `text-xs leading-relaxed`, close with `Button variant="outline" size="sm"`.
- **Accent in the viewer** appears only on focus and selection (the focus ring, the 3D selection), never as decoration.

## 7. Non-negotiables
- Keep every `id` and `data-testid`; vitest and Playwright e2e must pass.
- Stay inside the card's `files_in_scope`. Don't touch another builder's files.
- Before PR: `web-design-guidelines` run with no blocking findings.
