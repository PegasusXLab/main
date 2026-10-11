# ADR-016: Piece model (content + mount + interaction) as a derived view

Status: proposed (senior, 2026-10-10 ~23:45 EDT). Needs Quang's approval.

## Context
Creators add very different things: images, GIF/MP4, cutouts, uploaded GLBs, library models, and later
photo albums, records, books, links, guestbooks. Today every kind is a special case split across two
stored collections: `gallery.artworks` (wall, `type: "image"` + optional `media` + `frameStyle`) and
`gallery.objects` (floor, ADR-015, `source.kind` cutout/model/library + `plinth`). The editor has a
separate flow per collection, and the renderers branch on raw fields (`frameStyle`, `source.kind`,
`plinth.shape`). We want one mental model ("add a piece → pick content → we suggest a mount") so
customization stays simple and doesn't drift into Sims/Roblox furniture building.

It is Saturday 23:45 EDT; submission is Sunday 09:00, freeze 06:00, and main crashed in production at
22:00. No stored schema change is allowed tonight (src/lib/schema/ and the gallery JSON are frozen).

## Decision
1. A **piece** is `content + mount + interaction`, computed by a **pure function** from what is
   already stored. Nothing new is persisted.
   - `toPiece(artwork: Artwork): Piece` and `toPiece(object: GalleryObject): Piece`
     (one overloaded export, or `pieceFromArtwork` / `pieceFromObject`; both covered by tests).
   - `piecesForRoom(gallery, roomId): Piece[]` returns wall + floor pieces together.
2. A **registry** (`src/lib/pieces/registry.ts`) lists one `PieceDef` per content kind: label, allowed
   mounts (first = suggested), interaction, placement, and `available` vs `coming-soon`.
   The add flow, the renderers and docs read the registry instead of branching on raw fields.
3. Unknown or broken pieces never take a room down: unknown content renders as a plain plaque, and
   every rendered piece sits inside its own React error boundary.
4. Mounts are a **small curated set** fitted automatically to content. Users never assemble mounts.

### Frozen interface (src/lib/pieces/types.ts)
```ts
/** What the piece is. Only the first six exist tonight; the rest are "coming soon" in the registry. */
export type PieceContent =
  | "image" | "gif" | "video" | "cutout" | "model" | "library"
  | "photo-album" | "record" | "book" | "link" | "guestbook" | "story";

/** How it sits in the room. */
export type PieceMount = "wall-frame" | "wall-tv" | "floor-plinth" | "floor-standing";

/** What a visitor's click does. Tonight every existing piece is "plaque". */
export type PieceInteraction = "plaque" | "play" | "flip" | "open-link" | "leave-note";

export interface Piece {
  id: string;            // the artwork/object id, unchanged
  roomId: string;
  origin: "artwork" | "object"; // which stored collection it came from
  content: PieceContent;
  mount: PieceMount;
  interaction: PieceInteraction;
  title: string;
  artist: string;
  story: string;
}

export interface PieceDef {
  content: PieceContent;
  label: string;                 // "Video", "Photo cutout", "3D model"…
  placement: "wall" | "floor";
  mounts: readonly PieceMount[]; // allowed; mounts[0] is the suggested one
  interaction: PieceInteraction;
  status: "available" | "coming-soon";
}
```

### Mapping tonight (existing data → piece)
| Stored | content | mount |
|---|---|---|
| artwork, no `media` | image | `frameStyle === "tv"` ? wall-tv : wall-frame |
| artwork, `media.kind: "gif"` | gif | same rule |
| artwork, `media.kind: "video"` | video | same rule (suggested: wall-tv) |
| object `source.kind: "cutout"` | cutout | `plinth.shape === "none"` ? floor-standing : floor-plinth |
| object `source.kind: "model"` | model | same rule |
| object `source.kind: "library"` | library | same rule |

## Alternatives considered
- **Store a `piece` field now (schema v2).** Cleanest long term, but a schema change + validation +
  migration 7 hours before submission, the night main crashed. Rejected for tonight.
- **No model, keep adding per-type flows.** Every new kind would add a panel and a renderer branch;
  that is exactly how the UI becomes saturated. Rejected.
- **Artwork-only view.** Rejected (Quang, 23:35): floor objects are half the personal content.

## Consequences
- Zero migration risk tonight; the registry is the only place new kinds get added.
- Renderers still read stored fields under the hood; the registry is a lookup layer, not a rewrite.
- Future kinds (photo album, record player, book, link card, guestbook, story) appear in the add flow
  as disabled "Coming soon" entries, which doubles as the roadmap in the demo.
- **Post-Hacklanta schema v2 sketch** (needs its own ADR + Quang approval):
  - Merge `artworks` and `objects` into `pieces: StoredPiece[]` with
    `{ id, roomId, content, mount, interaction, placement: WallPlacement | FloorPlacement, media, meta }`.
  - `version: 2`; `migrateV1toV2(g)` = `piecesForRoom` over every room, persisted. Readers accept v1 and
    v2 for one release; writers write v2 only. `validate.ts` gets a discriminated union on `content`.
  - New content kinds then only need a registry entry + a mount component + a validator branch.
