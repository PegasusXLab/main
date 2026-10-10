import { z } from "zod";
import { MIN_ROOM_SIZE } from "./defaults";
import { isOnGrid, rectsOverlap, toGrid } from "./geom";
import type { Gallery } from "./types";

export interface ValidationIssue {
  path: string; // e.g. "rooms.2.w"; "" for the whole document
  message: string;
}

export type ValidationResult =
  | { ok: true; gallery: Gallery; issues: [] }
  | { ok: false; issues: ValidationIssue[] };

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "must be a hex color like #f2efe9");
const id = z.string().min(1);
const gridCoord = z.number().refine(isOnGrid, "must be on the 0.5 m grid");
const roomSize = gridCoord.refine(
  (m) => toGrid(m) >= toGrid(MIN_ROOM_SIZE),
  `must be at least ${MIN_ROOM_SIZE} m`,
);
const unit = z.number().min(0).max(1);
const wall = z.enum(["n", "e", "s", "w"]);

const atmosphereSchema = z.object({
  preset: z.enum([
    "gallery-white",
    "neon-bunker",
    "golden-hour",
    "moonlit",
    "custom",
  ]),
  moodColor: hex,
  haze: unit,
  brightness: unit,
  lightDirection: z.number().min(0).max(360),
  grain: unit,
});

const roomSchema = z.object({
  id,
  name: z.string(),
  description: z.string(),
  x: gridCoord,
  y: gridCoord,
  w: roomSize,
  d: roomSize,
  wallHeight: z.number().positive(),
  wallColor: hex,
  floor: z.enum(["wood", "concrete", "marble"]),
  lighting: z.enum(["gallery", "warm", "moody"]),
  closedWalls: z.array(wall).optional(),
  music: z
    .object({ trackId: z.string().optional(), url: z.string().optional() })
    .optional(),
  narration: z
    .object({ text: z.string(), audioUrl: z.string().optional() })
    .optional(),
  atmosphere: atmosphereSchema.optional(),
  mood: z.string().optional(),
});

const artworkSchema = z.object({
  id,
  roomId: id,
  type: z.literal("image"),
  placement: z.object({
    wall,
    offset: z.number().min(0),
    height: z.number().positive(),
  }),
  width: z.number().positive(),
  aspect: z.number().positive(),
  image: z.object({
    small: z.string().min(1),
    medium: z.string().min(1),
    large: z.string().min(1).optional(),
  }),
  title: z.string(),
  artist: z.string(),
  story: z.string(),
  voiceOver: z
    .object({ text: z.string(), audioUrl: z.string().optional() })
    .optional(),
});

export const gallerySchema = z.object({
  id,
  version: z.literal(1),
  title: z.string(),
  entranceRoomId: id,
  rooms: z.array(roomSchema).min(1, "a gallery needs at least one room"),
  artworks: z.array(artworkSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// Compile-time guard: the zod schema and the hand-written types (plan.md §6) must stay identical.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
const schemaMatchesTypes: Equal<z.infer<typeof gallerySchema>, Gallery> = true;
void schemaMatchesTypes;

/** Rules that span several fields: references, unique ids, overlapping rooms. */
function crossChecks(g: Gallery): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const roomIds = new Set<string>();
  g.rooms.forEach((room, i) => {
    if (roomIds.has(room.id))
      issues.push({
        path: `rooms.${i}.id`,
        message: `duplicate room id "${room.id}"`,
      });
    roomIds.add(room.id);
  });

  if (!roomIds.has(g.entranceRoomId)) {
    issues.push({
      path: "entranceRoomId",
      message: `no room with id "${g.entranceRoomId}"`,
    });
  }

  const artworkIds = new Set<string>();
  g.artworks.forEach((art, i) => {
    if (artworkIds.has(art.id))
      issues.push({
        path: `artworks.${i}.id`,
        message: `duplicate artwork id "${art.id}"`,
      });
    artworkIds.add(art.id);
    if (!roomIds.has(art.roomId)) {
      issues.push({
        path: `artworks.${i}.roomId`,
        message: `no room with id "${art.roomId}"`,
      });
    }
  });

  for (let i = 0; i < g.rooms.length; i++) {
    for (let j = i + 1; j < g.rooms.length; j++) {
      if (rectsOverlap(g.rooms[i], g.rooms[j])) {
        issues.push({
          path: `rooms.${j}`,
          message: `overlaps room "${g.rooms[i].id}"`,
        });
      }
    }
  }
  return issues;
}

/** Checks a gallery document. Never throws on user data; problems come back as a list of issues. */
export function validate(doc: unknown): ValidationResult {
  try {
    const parsed = gallerySchema.safeParse(doc);
    if (!parsed.success) {
      return {
        ok: false,
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
    }
    const issues = crossChecks(parsed.data);
    return issues.length
      ? { ok: false, issues }
      : { ok: true, gallery: parsed.data, issues: [] };
  } catch (err) {
    return {
      ok: false,
      issues: [
        { path: "", message: `could not read document: ${String(err)}` },
      ],
    };
  }
}
