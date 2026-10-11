---
spec: editor-primitives
brief: briefs/install-day.md
status: ready-for-cards
suggested_assignee: designer
files_in_scope:
  - src/components/ui/Button.tsx
  - src/components/ui/Input.tsx
  - src/components/ui/Label.tsx
  - src/components/ui/Select.tsx
  - src/components/ui/Slider.tsx
  - src/components/ui/Toggle.tsx
  - src/components/ui/Dialog.tsx
  - src/components/ui/Tooltip.tsx
  - src/components/ui/index.ts
mockups:
  - team/designer__vic/mockups/d000/install-day-editor-1440.png
---

## What and why
Provides the shared UI primitive set in `src/components/ui/*` built strictly on Galleriverse design tokens (`@theme` from `tokens-fonts-theme.md`).
Matches the reference shadcn primitive interface requested in **ADR-013** so both `designer` (editor panels & HUD) and `designer-2` (landing page & auth dialogs) share identical primitives without code duplication or external shadcn bloat.

## Primitive Specifications

### 1. Button (`Button.tsx`)
- **Variants:**
  - `primary`: Background `--color-accent` (Klein blue), text `--color-paper`, hover `--color-accent-hover`.
  - `secondary`: Background `--color-plaster`, text `--color-graphite`, border 1px `--color-hairline`, hover `bg-[#e6e8e5]`.
  - `outline`: Transparent background, 1px border `--color-hairline`, text `--color-graphite`, hover `bg-plaster`.
  - `ghost`: Transparent, text `--color-graphite`, hover `bg-plaster`.
  - `destructive`: Background `--color-danger`, text `--color-paper`, hover `--color-danger-hover`.
- **Sizes:** `sm` (h-7, text-xs, px-2.5), `default` (h-8, text-sm, px-3), `icon` (h-8, w-8).
- **Radius:** `rounded-[2px]`.
- **States:** default, hover, active (`scale-[0.98]`), focus-visible (`ring-2 ring-[var(--color-accent)] ring-offset-1`), disabled (`opacity-50 cursor-not-allowed`).

### 2. Input (`Input.tsx`)
- Single line text/number input.
- Height: `h-8`, font `text-sm`, tabular figures (`tabular-nums font-mono` for numbers/dimensions).
- Border: `1px solid var(--color-hairline)`, background `var(--color-paper)`, text `var(--color-graphite)`.
- Focus-visible: `border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] outline-none`.
- Radius: `rounded-[2px]`.
- Placeholder: `text-[var(--color-pencil)]`.

### 3. Label (`Label.tsx`)
- Text `text-xs font-medium text-[var(--color-pencil)] tracking-wider uppercase`.
- Cursor pointer when linked to form input.

### 4. Select (`Select.tsx`)
- Dropdown select primitive.
- Clean styling with chevron indicator, border `var(--color-hairline)`, focus ring `var(--color-accent)`.
- Radius: `rounded-[2px]`.

### 5. Slider (`Slider.tsx`)
- Range control for room dimensions, wall height, lighting brightness.
- Track: height 4px, background `var(--color-hairline)`.
- Range fill: background `var(--color-accent)`.
- Thumb: width 14px, height 14px, radius `rounded-[2px]`, background `var(--color-paper)`, border 2px `var(--color-accent)`.

### 6. Toggle (`Toggle.tsx`)
- Binary state switch / 2D-3D mode toggle button.
- Active state highlighted with Klein blue or dark graphite background, inactive subtle plaster background.

### 7. Dialog (`Dialog.tsx`)
- Modal dialog primitive (accessible modal backdrop + content card).
- Backdrop: `bg-graphite/40 backdrop-blur-[2px]`.
- Content: background `var(--color-paper)`, border 1px `var(--color-hairline)`, radius `rounded-[4px]`, shadow `shadow-lg`.
- Escape key listener and click outside to dismiss.

### 8. Tooltip (`Tooltip.tsx`)
- Micro-interaction helper for icon buttons and shortcuts.
- Background `var(--color-graphite)`, text `var(--color-paper)`, text `text-xs`, radius `rounded-[2px]`, padding `px-2 py-1`.

## Motion Tokens Used
| Component | Interaction | Property | Duration | Easing |
|---|---|---|---|---|
| All buttons/inputs | Hover/Focus | background, border | 120ms | ease-out |
| Dialog | Open/Close | opacity, scale | 160ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Tooltip | Appear | opacity, translateY | 100ms | ease-out |

## Acceptance Criteria
- [ ] All 8 primitives exported from `src/components/ui/index.ts`.
- [ ] No raw hex values in primitive code; all classes use Tailwind `@theme` utilities (`bg-accent`, `border-hairline`, `text-graphite`, `rounded-[2px]`).
- [ ] Focus rings and keyboard tab navigation conform to WCAG AA accessibility standards.
- [ ] Full support for `disabled` state with `pointer-events-none` and reduced opacity.
- [ ] Existing `data-testid` props accepted and passed through to DOM elements.
- [ ] Unit tests for each primitive covering render, click/change events, and keyboard interactions.

## Build Kit
- **Libraries:** Pure React 19 + Tailwind 4 (`@tailwindcss/turbopack`), no external UI library dependencies.
- **Primitives:** Created in this card (`src/components/ui/*`).
- **Skills to load:** `pegasus-ui`, `emil-design-eng`, `web-design-guidelines`.
- **References:** `team/designer__vic/specs/tokens-fonts-theme.md`, `decisions/ADR-013-designer-agents.md`.
