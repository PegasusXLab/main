# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two audiences, **equal weight** (confirmed by Vic, 2026-10-10):

- **Creators**: artists, photographers, musicians, students and small studios with no coding or 3D skills. They build a personal space on a laptop or tablet: draw rooms in a 2D plan, hang or place their work, and set how each room feels. Their job: "make a place that feels like me and my work, without learning 3D."
- **Visitors**: anyone who opens a shared link, with no account. Their job: walk through someone's space, take in the work and the mood, and read or hear the story behind each piece.

## Product Purpose
Galleriverse turns a simple 2D floor plan into an immersive, walkable 3D space. The editor is the product; the 3D gallery is what it produces. Success means a creator ships a space that feels personal, ambient and interactive (the bar is basement.studio's site), and a visitor remembers it as a *place*, not a grid of thumbnails.

## Positioning
Immersive portfolio sites like basement.studio need web-dev and 3D expertise. Galleriverse gives creators that kind of space by compiling a 2D plan into 3D: they never touch a 3D tool. Each room is styled on its own, so a space can be a journey of moods.

## Operating Context
- Creators work in the editor (`/edit/[id]`): rooms as rectangles on a 1 m grid, art as markers on walls, a side panel for properties, and a live 3D preview toggle. They publish to get a view link and a secret edit link.
- Visitors use the viewer (`/g/[id]`): full-screen 3D, click to travel between rooms, click art to read its plaque, drag to look around, music per room.
- Start page (`/`): new blank gallery, templates, open an edit link.
- Hackathon context: Hacklanta 2026, Adobe Creative track. Judged as a live demo. The working timeline runs to Sunday morning (Vic, 2026-10-10).

## Capabilities and Constraints
**Built today:** rectangular rooms with computed doorways; per-room name, size, wall height, wall color, floor (wood/concrete/marble), lighting (gallery/warm/moody), atmosphere presets (gallery-white, neon-bunker, golden-hour, moonlit, custom), music; image artwork on N/E/S/W walls with title, artist and story; publish/edit links; undo/redo; minimap; 360° look-around.

**Wanted per room (Vic):** layout, color, sizes, fonts, textures, ambience, lighting, music and narration, all customizable by the creator. Showcase work in many mediums: paintings and photos, statues and objects, music, anything that sets a vibe, like a museum.

**Open product decisions (to ideate with the senior):**
- **3D objects are the hard part.** How does an image become a 3D object (statue, sculpture, product)? Options to weigh: an image-to-3D service or AI model, a curated asset library, or lightweight tricks that keep things simple. Customization must stay deep but feel lightweight. Don't saturate the UI.
- Fonts, textures and narration per room aren't in the schema yet. The schema (`src/lib/schema/types.ts`) is frozen, so additions need an ADR through the senior.
- Vultr cloud GPU is pending; no GPU work is planned yet.

**Constraints:** no accounts and no personal data; keep every `id` and `data-testid`; rooms stay rectangles; new dependencies need Quang's approval.

## Brand Commitments
- Name: **Galleriverse** (internal folder and code identifiers stay "Pegasus").
- Reference bar: basement.studio's 2025 site, for how cool, ambient, personal and interactive the rooms should feel. **It is inspiration only:** the repo has no license, so never copy its code, shaders, models, textures or fonts (ADR-003).
- No logo, voice guide or fixed palette exists yet.

## Evidence on Hand
- Live app: https://galleriverse.vercel.app/ (team-only main deploy).
- Templates: Single hall, 3-room journey (`src/fixtures/templates`).
- Built-in music tracks (`src/audio/tracks.ts`).
- No user testimonials, usage numbers or real creator galleries exist yet. Don't fabricate them.

## Product Principles
1. **The space is the work.** In the viewer, the art and the mood lead and the interface recedes.
2. **Deep customization, light touch.** Every room can be fully personal, but each choice is one visual pick (a kit, a swatch, a preview), not a form.
3. **Simple in 2D, rich in 3D.** Creators only ever work in a plan; richness comes from the compile, not from asking more of the creator.
4. **One product, two sides.** Editor and viewer share one identity, so a creator previewing feels what a visitor will feel.
5. **Any medium.** Images today, objects, sound and story next. The system must not assume everything is a framed picture.
