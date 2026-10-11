# Designer context packet

_Written 2026-10-10 by Vic's setup agent, from the Docs plan and a read of `main` at `f43e647`. It's a starting point for `impeccable init`: confirm it with Vic, don't treat it as settled._

## Product
- **Pegasus / "galliverse"** (https://galliverse.vercel.app): a 2D floor-plan editor that compiles into a 3D gallery anyone can visit, so creators can build an immersive space for their art without coding or 3D skills (`Docs/plan.md` §1). Built for Hacklanta 2026, Adobe Creative track.
- **Inspiration:** basement.studio's 3D site and repo `basementstudio/website-2k25`. The idea: *"instead we want to empower users to create their own spaces at ease"* (sketch `Docs/IMG_1508.jpg`). **That repo has no license, so take ideas only**: no code, shaders, models, textures or fonts (ADR-003, `plan/reference-basement.md`). basement keeps a single design skill, `frontend-design`, which we've installed too.
- **Users:** artists and creators building a portfolio space (they edit), and visitors walking through it (they view).

## Screens
| Route | What it is | Impeccable mode |
|---|---|---|
| `/` (`src/app/page.tsx`) | Start: new blank gallery, templates (Hall, Journey), open edit link | Persuade |
| `/edit/[id]` (`EditorShell.tsx`) | 56px top bar (title, 2D/3D toggle, Publish), 320px left panel (Gallery/Room/Object panels), and the 2D SVG canvas or 3D preview | Operate |
| `/g/[id]` | Full-screen 3D viewer: title and Mute, plaque on artwork click, Prev/Next rooms, drag to look 360° | Experience |

## Stack (approved; changes go through the senior)
- Next 16.4 (App Router, Turbopack, Cache Components), React 19.3, TS 5.9.
- **Tailwind 4.3 with CSS-first config in `src/app/globals.css`** (there's no tailwind.config).
- three 0.186, @react-three/fiber 9.8, drei 10.7, zustand 5, zod, howler.
- Dev tools: leva, r3f-perf, vitest, Playwright 1.64.
- **No UI kit, no animation library, no next/font.** Proposed: `motion` + `next/font` (SETUP.md §5).

## Current visual state (the incumbent: "function first, UI later" by design)
- Arial; `globals.css` only has Next's starter `--background`/`--foreground`. Components ignore them, so dark OS mode breaks: the page goes dark while the panels stay white.
- About 190 zinc classes, with the same input class string copy-pasted. Mixed text sizes (`text-xs/sm/[11px]/[10px]`).
- Native `<select>`, `type=color` and `type=range` controls. No icons or tooltips.
- The editor is light zinc, but the viewer is dark (`bg-black`, `bg-zinc-900`, `bg-black/60` pills). They don't feel like one product.
- Raw hex: about 22 in the 2D SVG (`RoomShape.tsx`, `ResizeHandles.tsx`, …) and about 31 in 3D preset data (`src/lib/schema/atmosphere.ts`, `defaults.ts`). The selection color `#2563eb` is duplicated across 2D and 3D (T-071).

## 3D and what users can customise
- **Navigation:**
  - Editor: orbit (`OrbitControls`).
  - Viewer: `CameraRig.tsx` glides about 1s to a room or 1.8m in front of a frame; `LookControls.tsx` gives 360° drag with ±60° pitch.
  - There's no WASD.
- **Atmosphere** (`Atmosphere.tsx`): 1s blends of lights, background and fog between rooms. Presets: gallery-white, neon-bunker, golden-hour, moonlit, plus custom (mood color, haze, brightness, light direction, grain). **The grain setting does nothing** because there's no postprocessing.
- **Per room, users set:** size, wall height, wall color (any hex), floor (wood/concrete/marble as flat colors), lighting (gallery/warm/moody), atmosphere and music. Art is image frames on N/E/S/W walls.
- **Not possible:** non-rectangular rooms, textures, frame styles, furniture. The schema `src/lib/schema/types.ts` is frozen, so any of these needs an ADR via the senior.
- Known issue: T-065, "Moonlit too dark" (draft).

## Constraints
- Keep every `id` and `data-testid` (vitest and Playwright e2e rely on them).
- File owners (`plan/architecture.md` §5): builder-2 has `src/editor2d`, `src/panels`, `src/upload`, `src/components` and the start and editor pages. builder-1 has `src/viewer3d` and the viewer page. Design cards must state their scope so they don't collide.
- Two-branch rule: code goes to `main` via PR; everything else goes to `Docs` by direct push.
