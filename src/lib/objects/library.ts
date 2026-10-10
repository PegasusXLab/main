// Built-in object library (T-133, ADR-015 v2): a small, curated set of real-world CC0 objects
// creators can drop into a room with no upload and no AI. Every entry ships in public/library/<id>/
// as one model.glb (textures embedded, resized by hand to stay small) and a 320 px poster.webp on
// the plaster ground. Sizes are real-world meters, so `defaultHeight` is the object's own height.
// Pure data: the schema validates `source.libraryId` against these ids (OBJECT_LIBRARY).

export type LibraryCategory =
  "seating" | "tables" | "plants" | "light" | "display" | "objects";

export interface LibraryEntry {
  id: string;
  name: string;
  category: LibraryCategory;
  modelUrl: string;
  posterUrl: string;
  /** The object's real height in meters (it is modeled to scale). */
  defaultHeight: number;
  /** Plinth to start with: furniture stands on the floor, small pieces get a plinth. */
  plinth: { shape: "none" | "cylinder" | "box"; height: number };
  credit: { author: string; source: string; license: "CC0" };
  /** Recorded at curation time (T-133 AC): file size in bytes and triangle count. */
  bytes: number;
  triangles: number;
}

const entry = (
  id: string,
  name: string,
  category: LibraryCategory,
  defaultHeight: number,
  plinth: LibraryEntry["plinth"],
  author: string,
  polyHavenId: string,
  bytes: number,
  triangles: number,
): LibraryEntry => ({
  id,
  name,
  category,
  modelUrl: `/library/${id}/model.glb`,
  posterUrl: `/library/${id}/poster.webp`,
  defaultHeight,
  plinth,
  credit: {
    author,
    source: `https://polyhaven.com/a/${polyHavenId}`,
    license: "CC0",
  },
  bytes,
  triangles,
});

const FLOOR = { shape: "none", height: 0 } as const;
const PLINTH = (height: number) => ({ shape: "box", height }) as const;

export const LIBRARY: readonly LibraryEntry[] = [
  entry(
    "armchair-classic",
    "Classic armchair",
    "seating",
    1.065,
    FLOOR,
    "Kirill Sannikov",
    "ArmChair_01",
    525_576,
    5626,
  ),
  entry(
    "ottoman-leather",
    "Leather ottoman",
    "seating",
    0.624,
    FLOOR,
    "Caspian Fortune",
    "Ottoman_01",
    412_176,
    4240,
  ),
  entry(
    "bench-painted",
    "Painted bench",
    "seating",
    0.889,
    FLOOR,
    "Kirill Sannikov",
    "painted_wooden_bench",
    329_900,
    630,
  ),
  entry(
    "stool-wood",
    "Wooden stool",
    "seating",
    0.631,
    FLOOR,
    "Kirill Sannikov",
    "chinese_stool",
    326_492,
    1090,
  ),
  entry(
    "table-coffee-round",
    "Round coffee table",
    "tables",
    0.491,
    FLOOR,
    "Ulan Cabanilla",
    "coffee_table_round_01",
    376_548,
    4044,
  ),
  entry(
    "plant-succulent",
    "Potted succulent",
    "plants",
    0.267,
    PLINTH(0.8),
    "James Ray Cock",
    "potted_plant_04",
    625_016,
    8929,
  ),
  entry(
    "vase-ceramic",
    "Ceramic vase",
    "objects",
    0.4,
    PLINTH(0.9),
    "James Ray Cock",
    "ceramic_vase_01",
    363_488,
    10296,
  ),
  entry(
    "vase-brass",
    "Brass vase",
    "objects",
    0.2,
    PLINTH(1.0),
    "Rico Cilliers",
    "brass_vase_03",
    363_340,
    2616,
  ),
  entry(
    "bust-marble",
    "Marble bust",
    "objects",
    0.515,
    PLINTH(1.0),
    "Rico Cilliers",
    "marble_bust_01",
    747_228,
    17456,
  ),
  entry(
    "statue-horse",
    "Horse statue",
    "objects",
    0.221,
    PLINTH(1.0),
    "Rico Cilliers",
    "horse_statue_01",
    1_136_124,
    22388,
  ),
  entry(
    "frame-standing",
    "Standing photo frame",
    "display",
    0.25,
    PLINTH(0.9),
    "James Ray Cock",
    "standing_picture_frame_01",
    549_332,
    1634,
  ),
  entry(
    "lamp-oil",
    "Vintage oil lamp",
    "light",
    0.802,
    FLOOR,
    "Monsta3D",
    "vintage_oil_lamp",
    666_724,
    7208,
  ),
];

export const LIBRARY_IDS: readonly string[] = LIBRARY.map((e) => e.id);

export function libraryEntry(id: string): LibraryEntry | undefined {
  return LIBRARY.find((e) => e.id === id);
}
