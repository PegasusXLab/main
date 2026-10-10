---
spec: editor-view-modes
brief: briefs/install-day.md
status: ready-for-cards   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-1 (card A: TourView + top camera), builder-2 (card B: editor wiring); or ONE card for builder-1 if the freeze is too close for two
files_in_scope:
  - "A: src/viewer3d/TourView.tsx (new), src/viewer3d/TourView.test.tsx (new), src/app/g/[id]/page.tsx, src/viewer3d/CameraRig.tsx, src/viewer3d/Scene.tsx"
  - "B: src/components/EditorShell.tsx, src/app/edit/[id]/page.tsx, src/store/gallery.ts (View type only), their tests"
mockups: []
---
## What and why
Requested by Vic, 2026-10-10. Today a creator who wants to see **what a visitor will see** has to publish, save, then refresh `/g/<id>`. The editor needs three views:

**`2D` | `3D POV` | `Top-down`**

- **2D**: the plan canvas, unchanged.
- **3D POV**: *exactly the visitor's experience*, rendered from the **live, unsaved** gallery in the store: the travel camera, drag to look 360°, Previous/Next room, click a doorway or floor to travel, click art to face it and open the plaque, the room-arrival title, the minimap and room music with Mute. The editor's live compile (`compile(gallery)` already in `edit/[id]/page.tsx`) feeds it, so every panel edit shows immediately. **No publish, no refresh.**
- **Top-down**: a dollhouse overview from straight above (today's "3D" orbit, re-aimed). Use it to check layout, light and colour across all rooms at once.

Product principle: *one product, two sides*. The creator previews what the visitor feels, using the **same component**, so the preview can never drift from the real viewer.

## Behavior and states
**View switcher (top bar, replaces the 2D/3D toggle):** a segmented control with three segments, labels `2D` · `3D POV` · `Top-down`, using the existing `Toggle` primitive in a group (as today). `aria-label="Editor view"`, each segment `aria-pressed`. Keyboard shortcuts `1` / `2` / `3` when focus isn't in a text field. Selected segment: `bg-paper text-graphite`; others: `text-pencil`, hover `text-graphite`; focus-visible ring `--color-accent`.

**3D POV:**
- Starts in the **selected room** (a room selection, or the room of a selected artwork). With nothing selected, it starts at `gallery.entranceRoomId`.
- **Selection ↔ tour sync:**
  - selecting a room in the panel travels there;
  - selecting an artwork in the panel faces it;
  - clicking a frame in POV selects that artwork in the panel **and** opens its plaque;
  - traveling to a room in POV selects that room in the panel.
- **Live edits:** changing wall colour, lighting, atmosphere, music or artwork fields updates the scene in place. The camera does **not** reset on edits, only on selection changes.
- **HUD:** the viewer HUD (T-121 patterns, kit §6), with one change: the gallery-title pill becomes a small `Preview · what visitors see` pill. Its job is to make the mode unmistakable; there is no extra framing.
- Room music: it follows the room as in the viewer. It starts only after a user gesture (as in the viewer), and Mute is visible.
- **Empty gallery** (no rooms): show the centred message "Add a room in 2D to preview it." with a `Button variant="outline"` "Go to 2D".
- Deleted room/artwork while in POV: if the current room disappears, fall back to the entrance (or the first room) without an error.

**Top-down:**
- The camera starts straight above the plan centre, high enough to fit the plan's span with ~10% margin (use the existing `planBounds`).
- Drag rotates around the vertical axis. Tilt is limited from 0 (straight down) to ~55°, scroll zooms, and right-drag/two-finger drag pans.
- Clicking a floor selects the room and clicking a frame selects the artwork, as today's orbit preview does. The selection highlight is the accent.
- It does **not** fly the camera on selection (a top view stays put); it only highlights.

**Switching views:** the current selection persists across all three. A store-persisted `view: "3d"` from an old autosave maps to `"top"`.

**Mobile (390):** the switcher stays in the top bar. Segments shorten to `2D` · `POV` · `Top` below `sm`, and the POV HUD is the viewer's phone layout (T-081/T-083 already handle it).

## Tokens used
`--color-graphite`, `--color-paper`, `--color-pencil`, `--color-hairline`, `--color-accent` (focus and selection only), `--radius-default` (2px), `--duration-fast`, `--font-display` (room-arrival title, Preview pill). No raw hex. 3D selection colour comes from `THEME.colors.accent`.

## Motion
| Interaction | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|
| Switch view (any) | canvas swap | instant; HUD fades in | `--duration-fast` ease-out | no fade |
| Enter POV | camera starts at the room's view spot | cut (no fly-in from the top view) | — | cut |
| Select room/art while in POV | camera travel | existing CameraRig ~1.0 s ease-in-out | (R4) | cut (existing) |
| Room arrival title | opacity | 180 ms in / 1.5 s hold / 400 ms out | ease-out | none (existing) |
| Top-down zoom/rotate | OrbitControls | damping off (as today) | — | — |

## Acceptance criteria (reviewer checks these)
- [ ] The editor top bar shows `2D` · `3D POV` · `Top-down`. Keys 1/2/3 switch views; nothing switches while typing in an input.
- [ ] **POV shows unsaved edits:** in POV, change a room's wall colour or atmosphere in the panel and the scene updates without publishing or reloading.
- [ ] POV behaves like `/g/<id>`: Previous/Next, doorway and floor travel, drag to look, frame click → plaque, arrival title, minimap and Mute all work.
- [ ] Selection syncs both ways between the panel and POV (room → travel, artwork → face + plaque, POV travel → panel selects the room).
- [ ] Top-down starts straight down over the whole plan; rotate, zoom and pan work; clicks select. Tilt never goes past ~55°.
- [ ] `/g/[id]` looks and behaves exactly as before (it now renders `TourView`). The existing viewer e2e tests pass unchanged.
- [ ] The empty gallery in POV shows the "Add a room in 2D" state.
- [ ] Existing `id`/`data-testid` are kept. The old `view: "3d"` autosave maps to Top-down. No three.js loads on the initial 2D view (existing AC).
- [ ] Keyboard and focus-visible work on the switcher; contrast is AA.

## Build kit (the senior copies this into the card)
- **Libraries:** none new.
- **Primitives:** `src/components/ui/Toggle.tsx`, `Button.tsx` (exist, T-111).
- **Patterns:** kit `pegasus-ui` §6 (viewer HUD), §5 (3D look rules).
- **Skills to load:** `pegasus-ui`; `web-design-guidelines` on the changed files before the PR.
- **References:**
  - `src/app/g/[id]/page.tsx` (the tour state and HUD to extract into `TourView`)
  - `src/app/edit/[id]/page.tsx` (live `compile`, selection, the current 3D branch)
  - `src/viewer3d/CameraRig.tsx` (the `orbit`/`travel` mode switch, R5: add `top` here)

## Implementation notes (for the senior's card split)
- **Card A (builder-1):** extract the viewer body (Scene in travel mode + header + minimap + arrival title + plaque + nav, and the tour state `roomId`/`focusId`/drag guard) into `src/viewer3d/TourView.tsx`. Props: `gallery`, `scene`, `largeImages?`, `roomId?` + `onRoomChange?` (controlled when given), `focusArtworkId?` + `onFocusArtwork?`, `badge?: ReactNode` (replaces the title pill). `/g/[id]` becomes data loading + `<TourView/>`. Add CameraRig mode `"top"` (the R5 switch) and expose it through `Scene`'s `mode`.
- **Card B (builder-2, after A merges):** `View = "2d" | "pov" | "top"` (map legacy `"3d"` → `"top"`), the three-segment switcher + shortcuts in `EditorShell`, the editor page renders `<TourView>` (controlled by the selection) for POV and `<Scene mode="top">` for Top-down.
- **If the freeze leaves time for only one card:** give both to builder-1 as one card (it touches the editor page; builder-2 has no open card on it now that T-120 is merged). POV is the must-have. Top-down can ship as today's orbit relabelled "Top-down", with the camera start position changed.
