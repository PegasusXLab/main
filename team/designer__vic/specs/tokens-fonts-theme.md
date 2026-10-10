---
spec: tokens-fonts-theme
brief: briefs/install-day.md
status: ready-for-cards
suggested_assignee: designer
files_in_scope:
  - src/app/globals.css
  - src/app/layout.tsx
  - src/lib/theme.ts
mockups:
  - team/designer__vic/mockups/d000/install-day-editor-1440.png
---

## What and why
Establishes the canonical Galleriverse design system tokens and typography mandated by **ADR-013**. Replaces raw hexes and mixed zinc styling across the app with a single coherent token foundation shared between `designer` (editor/canvas/viewer) and `designer-2` (landing/auth).

Replaces `#2563eb` (duplicated across 2D SVG and 3D preview) and temporary tape `#2F7FD1` with **Klein Blue `#002fa7`** as the single accent token across UI, 2D, and 3D.

## Tokens (Tailwind 4 `@theme` in `src/app/globals.css`)

### Color Roles
| Token Name | Hex Value | Role / Usage |
|---|---|---|
| `--color-plaster` | `#eff0ee` | App canvas background, default subtle ground |
| `--color-paper` | `#ffffff` | Panel surfaces, card containers, dialog backgrounds |
| `--color-graphite` | `#1e2022` | Primary text, dark shell/header background, dark viewer HUD pills |
| `--color-graphite-hover` | `#2a2d30` | Hover state for graphite elements |
| `--color-pencil` | `#7d8085` | Secondary/muted text, coordinate & dimension readouts, subtle icons |
| `--color-hairline` | `#d5d7d4` | Borders, panel dividers, 1m grid subdivision lines |
| `--color-accent` | `#002fa7` | **The ONE accent (Klein Blue).** Selection, active tools, 2D/3D selection outline, tape tag |
| `--color-accent-hover` | `#002484` | Accent interactive hover state |
| `--color-accent-subtle` | `#002fa714` | Accent highlight wash for selected row / room background |
| `--color-danger` | `#c7353f` | Delete, destructive actions, validation errors |
| `--color-danger-hover` | `#aa2b34` | Destructive interactive hover state |
| `--color-kraft` | `#c59a6a` | Unhung art placeholder templates, cardboard state |

### Radius & Geometry
| Token Name | Value | Role |
|---|---|---|
| `--radius-default` | `2px` | Standard button, input, badge radius per ADR-013 |
| `--radius-sm` | `2px` | Controls & handles |
| `--radius-md` | `4px` | Floating cards & dialogs |

### Typography & Fonts (`next/font/google`)
- **Display Font:** `Archivo` (variable width 62–125, weights 400–800) for product titles, top bar brand mark, room arrival titles.
- **UI & Body Font:** `Geist` (or Inter fallback) with `font-feature-settings: 'tnum'` (tabular figures) for all coordinates, dimensions, measurements, and sliders.
- Registered via CSS variables `--font-display` and `--font-sans` in `layout.tsx`.

### Motion Tokens
| Interaction | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|
| Hover / Focus transitions | `color`, `background-color`, `border-color`, `box-shadow` | 120ms (`--duration-fast`) | `ease-out` | 0ms / instantaneous |
| Panel / Modal open-close | `opacity`, `transform` | 180ms (`--duration-normal`) | `cubic-bezier(0.16, 1, 0.3, 1)` | instantaneous fade |
| 3D Selection / Tool highlight | outline / emissive color | 150ms | `ease-out` | instantaneous |

All motion must respect `@media (prefers-reduced-motion: reduce)`.

## 2D/3D Mirror (`src/lib/theme.ts`)
Creates a strongly-typed TypeScript module exporting tokens for Three.js renderers (`viewer3d`) and SVG elements (`editor2d`):
```ts
export const THEME = {
  colors: {
    plaster: '#eff0ee',
    paper: '#ffffff',
    graphite: '#1e2022',
    pencil: '#7d8085',
    hairline: '#d5d7d4',
    accent: '#002fa7', // Klein blue replaces #2563eb
    accentHover: '#002484',
    accentSubtle: '#002fa714',
    danger: '#c7353f',
    kraft: '#c59a6a',
  },
  radius: {
    default: '2px',
  },
  fonts: {
    display: 'var(--font-display)',
    sans: 'var(--font-sans)',
  },
} as const;

export type ThemeColors = typeof THEME.colors;
```

## Acceptance Criteria (Reviewer Gate)
- [ ] `@theme` in `src/app/globals.css` exposes all canonical tokens without breaking light/dark OS mode.
- [ ] `next/font/google` loads Archivo and Geist with display/sans CSS variables without layout shift or external network requests during rendering.
- [ ] `src/lib/theme.ts` exists and exports `THEME` object with matching hex values.
- [ ] Focus rings use `--color-accent` with clear contrast (`ring-2 ring-[var(--color-accent)] ring-offset-1`).
- [ ] Existing `vitest` unit tests and e2e smoke tests pass without regressions.
- [ ] `web-design-guidelines` passes with no blocking issues on changed files.

## Build Kit
- **Libraries:** `next/font/google` (built into Next.js, no new dependency).
- **Primitives:** None (foundation for primitives).
- **Skills to load:** `pegasus-ui`, `web-design-guidelines`.
- **References:** `decisions/ADR-013-designer-agents.md`, `team/designer__vic/briefs/install-day.md`.
