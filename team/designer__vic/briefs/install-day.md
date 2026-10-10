---
brief: install-day
author: designer
status: adjusted   # draft | sent | approved | adjusted | needs-quang  (senior 2026-10-10, see the senior's answer in inbox)
playbook: site + space (one shared system)
surfaces: [/ start, /edit editor chrome + panels, 2D canvas, /g viewer HUD + plaque, viewer3d accent/inspect]
created_at: 2026-10-10T16:56:00Z
---
## Problem
- **Two products, not one.** The editor is light zinc and the viewer is black/zinc-900 pills. Dark OS mode turns the page dark while the panels stay white (`globals.css` only has Next's starter vars).
- **No system.** About 190 zinc classes with the same input string copy-pasted, text sizes `xs/sm/[11px]/[10px]`, Arial, native `<select>`/`type=color`/`type=range`, and no icons.
- **The accent is a stray hex.** `#2563eb` is duplicated across the 2D SVG and 3D (T-071), and about 22 raw hexes sit in `src/editor2d`.
- **Customization reads as a form.** A room's mood is three native selects and a hex input. Vic's bar is basement.studio: ambient, personal, interactive.

## Direction: "Install Day" (Vic picked it 2026-10-10 from 2 rounds, 8 directions)
**Thesis:** the editor is *install day*: you tape up where the work goes. The gallery is *opening night*: the tape comes off and only the work and the light remain.

**Palette (token roles):**
| Token | Hex | Job |
|---|---|---|
| `--color-graphite` | `#1F2226` | Shell: top bar, side panel, HUD pills (at 72% in the viewer) |
| `--color-drywall` | `#EDEEEA` | Plan canvas ground, primary-on-dark buttons, plaque card |
| `--color-tape` | `#2F7FD1` | **The one accent.** Placement + selection only, in the UI, the 2D SVG **and** 3D (replaces `#2563eb`) |
| `--color-kraft` | `#C59A6A` | Templates: art placed without an image yet, empty states |
| `--color-pencil` | `#6B7077` | Dimensions, grid labels, secondary text on drywall |
Plus derived steps (`graphite-2 #2A2E33`, `graphite-line #3A3F45`, `pencil-faint #D3D5D0`) and state colours (error/warn) only where they carry meaning.

**Raises carried from the declined directions (these are rules, not decoration):**
1. Tape blue means placement/selection and **nothing else** (no tape-blue CTAs or links).
2. The shell holds two values, graphite and drywall. Every other colour on screen belongs to the creator's rooms (wall colour swatch on each room, room list tabs).
3. Viewer inspect (R12): focusing an artwork dims the rest of the room, so the piece leads.
4. Art markers on the plan are drawn to true scale (a 2 m canvas reads twice a 1 m print).

**Type:** display **Archivo** (variable `wdth` 62–125; expanded heavy for the wordmark and panel titles, and the viewer's room title like wall vinyl). UI/body **Geist** with tabular figures for every measurement. Both are OFL Google Fonts via `next/font/google`; nothing from basement.

**Signature move:** the **tape tag**. The selected artwork wears a tape-blue tag with its centre-line height and wall offset (`C/L 1.45 m · 2.40 m from W`), and a dashed level line runs along the wall while dragging. It is a real measurement and the only "texture" in the system. Art without an image is a kraft template, so the plan shows what's hung and what's still to hang.

**Motion stance:** quiet in the editor (120–180 ms ease-out on state changes, the tag follows the drag 1:1). Cinematic in the viewer (keep CameraRig's ~1 s ease-in-out; HUD fades with the camera; inspect dim 400 ms). `prefers-reduced-motion` turns every move into a cut.

**Viewer ("opening night"):** HUD pills in translucent graphite with drywall text. The room name is set briefly in Archivo-expanded on arrival, then fades. The plaque is a drywall wall label (artist, *title*, year · medium · size, story). The tape accent appears only on focus.

Mockup (1440): `mockups/d000/install-day-editor-1440.png` (source `install-day-editor.html`). The alternatives Vic saw are in the same folder.

## Scope
**In:** tokens + fonts + a `theme.ts` mirror for SVG/3D; shared primitives; editor chrome and panel visuals; 2D canvas colours and the tape tag; visual pickers (space kits, wall swatches, floor/lighting previews); viewer HUD and plaque; one accent across 2D/3D/UI; start page restyle.
**Out (needs the senior's/Quang's call, see the questions below):** new object types (3D objects, audio, video), per-room fonts/textures/narration (schema is frozen), WASD, postprocessing.

## Stack asks
| Library / skill | Why | Size or risk | Needs Quang? |
|---|---|---|---|
| `motion` (motion.dev) | HUD/panel transitions, tag follow, layout animations; respects reduced motion | ~30 kB gz for the parts used; DOM only (R3F easing stays hand-written) | **Yes** |
| `next/font/google` (Archivo, Geist) | Self-hosted fonts, no layout shift | Built into Next, no new dependency | No (FYI) |
| `lucide-react` | Icons for tool and HUD buttons (undo/redo, mute, prev/next, 2D/3D) | Tree-shaken, ~1 kB per icon | **Yes** |

## Proposed specs (build order)
1. `specs/tokens-fonts-theme.md`: `@theme` tokens (colour roles, type scale, radius, spacing, motion), fonts, and `src/lib/theme.ts` for the SVG/3D mirror; replaces `#2563eb`. Owner: designer.
2. `specs/editor-primitives.md`: Button, Field, Select, Slider, Segmented, PanelSection; swaps the zinc strings in EditorShell/panels. Owner: designer (primitives) + builder-2 (adoption).
3. `specs/canvas-tape-tag.md`: 2D colours from the theme, the tape tag + level line, kraft templates, true-scale markers. Owner: builder-2.
4. `specs/space-kits-pickers.md`: kits on the existing `ATMOSPHERE_PRESETS`/`LIGHTING_PRESETS`, a swatch/preview picker instead of native selects. No schema change. Owners: builder-2 (picker), builder-1 (preset values).
5. `specs/viewer-opening-night.md`: HUD, plaque as a wall label, the room-title arrival, inspect dim. Owner: builder-1.
6. `specs/start-page.md`: Persuade pass on `/`. Owner: builder-2.

## Open questions for senior
1. **Timeline.** `plan/overview.md` says code freeze 17:09 EDT today. Vic says we have until Sunday morning. Which is right? If the freeze holds, I'll cut to specs 1–2 (plus 3 if there's time) and propose the rest as post-freeze.
2. **Any medium / 3D objects (Vic's big ask, ideate with me).** Creators want statues, objects and sound as well as pictures, while customization stays light. My ranked options:
   - **A. Cutout sculpture (recommended first).** Upload a PNG with transparency. We extrude its alpha silhouette into a thick shape (three `ExtrudeGeometry` from a traced outline), put the image on the front face and set it on a plinth. Client-only, no server or AI, and it reads as an object in 3D. Optional browser background removal would be a stack ask.
   - **B. Bring your own model.** `.glb` upload, for example from phone scan apps (Polycam, Scaniverse, Luma) that artists already use for real sculptures. drei `useGLTF` is already in the stack. It needs size limits and a normalize-to-plinth step.
   - **C. Wrap an image on a form.** A small library of procedural forms (plinth-box, cylinder, lathe "vase", sphere) with the creator's image as the material. Cheap, consistent, but less personal.
   - **D. Image-to-3D AI** (Meshy/Tripo API, or self-hosted TRELLIS/Hunyuan3D on the pending Vultr GPU). The most magical, but async, paid or GPU-bound, and slow for a demo. Stretch only.
   - **Other mediums:** audio object (a listening bench that plays a track or narration on approach), video frame (`VideoTexture`), text panel (wall vinyl).
   All of these need an ADR: `Artwork.type` beyond `"image"` plus floor placement (`x,y` in the room) for free-standing objects. Do you want an ADR draft from me, and which options fit the time?
3. **Per-room fonts, textures and narration** (Vic wants them): narration exists in the schema (P1). Fonts and textures don't. Should I spec them as curated sets (a few wall textures, 3 title fonts) behind one ADR together with Q2?
4. Approve `motion` and `lucide-react` with Quang.
5. Ownership: OK for the designer to own `src/app/globals.css`, `src/lib/theme.ts` and a new `src/components/ui/*` (primitives), with builder-2 adopting them in panels?
