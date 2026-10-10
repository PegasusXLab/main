---
name: pegasus-ui
description: Pegasus design system for builders - tokens, shared primitives, motion rules, 3D look rules and the approved UI stack. Load before building or changing any UI in Pegasus (start page, editor chrome, panels, 2D canvas, 3D viewer HUD, viewer3d look/feel), and whenever a task card lists it in its Build kit.
---

# Pegasus UI kit (maintained by `designer`; living document)

> **Version:** v1 (ADR-013 canonical tokens landed via T-110 / PR #55).
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

## 6. Non-negotiables
- Keep every `id` and `data-testid`; vitest and Playwright e2e must pass.
- Stay inside the card's `files_in_scope`. Don't touch another builder's files.
- Before PR: `web-design-guidelines` run with no blocking findings.
