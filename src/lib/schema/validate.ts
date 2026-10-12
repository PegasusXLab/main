import { z } from "zod";
import { MIN_ROOM_SIZE, OBJECT_LIBRARY } from "./defaults";
import { isOnGrid, rectsOverlap, toGrid } from "./geom";
import type { Gallery, GalleryObject } from "./types";

export interface ValidateOptions {
  /** Library object ids that `source.libraryId` may use (defaults to OBJECT_LIBRARY). */
  library?: readonly string[];
}

/** Objects keep this far from the room's walls (meters). */
export const OBJECT_WALL_MARGIN = 0.3;
/** An object's footprint may use at most this share of the room's smaller side. */
export const OBJECT_MAX_FOOTPRINT_SHARE = 0.9;

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
  glow: unit.optional(),
  vignette: unit.optional(),
  spots: unit.optional(),
});

const voiceOverSchema = z
  .object({
    text: z.string(),
    audioUrl: z.string().optional(),
    voiceId: z.string().optional(),
    voiceName: z.string().optional(),
    source: z.enum(["elevenlabs", "recorded", "uploaded"]).optional(),
  })
  .optional();

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
    .object({
      trackId: z.string().optional(),
      url: z.string().optional(),
      /** Clip start, seconds from the top. Unset = from the beginning. */
      start: z.number().min(0).optional(),
      /** Clip length, seconds. Instagram-style choices: 30, 45 or 60. Unset = the whole song. */
      length: z.number().min(30).max(60).optional(),
      /** Display name of an uploaded / linked song ("Song - Artist"). */
      title: z.string().max(120).optional(),
    })
    .optional(),
  narration: voiceOverSchema,
  atmosphere: atmosphereSchema.optional(),
  mood: z.string().optional(),
  look: z.enum(["museum", "film", "retro", "noir", "dream"]).optional(),
  wallFinish: z.enum(["smooth", "plaster", "concrete", "brick"]).optional(),
  titleFont: z.string().max(64).optional(),
  titlePosition: z
    .enum(["top-left", "top-right", "center", "bottom-left", "bottom-right"])
    .optional(),
  // Kept permissive so galleries saved before uploads existed still load; the viewer only ever
  // loads fonts that pass isSafeFontUrl (src/lib/fontLimit.ts).
  customFontUrl: z.string().max(512).optional(),
  titleColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  titleStyle: z.enum(["depth", "flat"]).optional(),
});

const url = z.string().min(1);
/** Media the browser loads directly: our own files (/…) or https ("" = not chosen yet). */
const mediaUrl = z
  .string()
  .max(500)
  .refine((v) => v === "" || /^\/(?![/\\])/.test(v) || z.url({ protocol: /^https$/ }).safeParse(v).success, "use an https or same-site URL");
const trackSchema = z.object({
  title: z.string().max(120),
  artist: z.string().max(120).optional(),
  url: mediaUrl,
  coverUrl: mediaUrl.optional(),
});
const deviceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("tv"),
    video: z.object({ url: mediaUrl, posterUrl: mediaUrl.optional(), aspect: z.number().positive().max(4) }),
    screen: z.number().min(0.3).max(3),
  }),
  z.object({ kind: z.literal("turntable"), tracks: z.array(trackSchema).max(12), accent: z.string().max(16).optional() }),
  z.object({ kind: z.literal("guestbook"), prompt: z.string().max(120).optional() }),
]);
const imageSetSchema = z.object({
  small: url,
  medium: url,
  large: url.optional(),
});

const objectSourceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("cutout"),
    image: imageSetSchema,
    aspect: z.number().positive(),
    depth: z.number().min(0.01).max(0.3),
  }),
  z.object({
    kind: z.literal("model"),
    modelUrl: url,
    posterUrl: url.optional(),
    origin: z.enum(["upload", "generated"]),
    job: z
      .object({
        id,
        status: z.enum(["queued", "running", "ready", "failed"]),
        fallback: z.object({
          image: imageSetSchema,
          aspect: z.number().positive(),
        }),
      })
      .optional(),
  }),
  z.object({ kind: z.literal("library"), libraryId: id }),
]);

const objectSchema = z.object({
  id,
  roomId: id,
  position: z.object({ x: z.number(), y: z.number() }),
  rotation: z.number().min(0).lt(360),
  height: z.number().positive().max(4),
  plinth: z.object({
    shape: z.enum(["none", "cylinder", "box"]),
    height: z.number().min(0).max(1.5),
  }),
  source: objectSourceSchema,
  title: z.string(),
  artist: z.string(),
  story: z.string(),
  voiceOver: voiceOverSchema,
  inspectable: z.boolean().optional(),
  facts: z
    .array(z.object({ label: z.string().max(40), value: z.string().max(160) }))
    .max(8)
    .optional(),
  link: z.url({ protocol: /^https$/ }).max(500).optional(),
  action: z.enum(["learn", "buy", "stream", "presave", "watch", "book", "tip"]).optional(),
  price: z.string().max(24).optional(),
  device: deviceSchema.optional(),
});

const artworkSchema = z.object({
  id,
  roomId: id,
  type: z.literal("image"),
  media: z
    .object({
      kind: z.enum(["gif", "video"]),
      url: z
        .string()
        .refine(
          (value) =>
            /^\/api\/files\/media\/[^\s?#]+$/.test(value) ||
            z.url({ protocol: /^https$/ }).safeParse(value).success,
          "must be a media file URL or HTTPS URL",
        ),
      posterUrl: url.optional(),
      aspect: z.number().min(0.2).max(5),
    })
    .optional(),
  frameStyle: z.enum(["frame", "tv"]).optional(),
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
  voiceOver: voiceOverSchema,
  inspectable: z.boolean().optional(),
  facts: z
    .array(z.object({ label: z.string().max(40), value: z.string().max(160) }))
    .max(8)
    .optional(),
  link: z.url({ protocol: /^https$/ }).max(500).optional(),
  action: z.enum(["learn", "buy", "stream", "presave", "watch", "book", "tip"]).optional(),
  price: z.string().max(24).optional(),
  track: trackSchema.optional(),
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
  objects: z.array(objectSchema).optional(),
  look: z.enum(["museum", "film", "retro", "noir", "dream"]).optional(),
  creator: z
    .object({
      name: z.string().max(80),
      bio: z.string().max(600).optional(),
      links: z
        .array(z.object({ url: z.url({ protocol: /^https$/ }).max(500), label: z.string().max(40).optional() }))
        .max(8)
        .optional(),
    })
    .optional(),
});

// Compile-time guard: the zod schema and the hand-written types (plan.md §6) must stay identical.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
const schemaMatchesTypes: Equal<z.infer<typeof gallerySchema>, Gallery> = true;
void schemaMatchesTypes;

/** Width of what an object shows when its aspect is known (cutouts and generating models). */
function objectWidth(obj: GalleryObject): number | null {
  const s = obj.source;
  if (s.kind === "cutout") return obj.height / s.aspect;
  if (s.kind === "model" && s.job) return obj.height / s.job.fallback.aspect;
  return null;
}

function objectChecks(
  g: Gallery,
  library: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rooms = new Map(g.rooms.map((r) => [r.id, r]));
  const ids = new Set(g.artworks.map((a) => a.id));

  (g.objects ?? []).forEach((obj, i) => {
    const at = `objects.${i}`;
    if (ids.has(obj.id)) {
      issues.push({
        path: `${at}.id`,
        message: `duplicate id "${obj.id}" (ids are unique across artworks and objects)`,
      });
    }
    ids.add(obj.id);

    const room = rooms.get(obj.roomId);
    if (!room) {
      issues.push({
        path: `${at}.roomId`,
        message: `no room with id "${obj.roomId}"`,
      });
    } else {
      const m = OBJECT_WALL_MARGIN;
      const { x, y } = obj.position;
      if (x < m || x > room.w - m || y < m || y > room.d - m) {
        issues.push({
          path: `${at}.position`,
          message: `must be inside the room, at least ${m} m from its walls`,
        });
      }
      const width = objectWidth(obj);
      const limit = OBJECT_MAX_FOOTPRINT_SHARE * Math.min(room.w, room.d);
      if (width !== null && width > limit) {
        issues.push({
          path: `${at}.height`,
          message: `too wide for the room (${width.toFixed(2)} m; at most ${limit.toFixed(2)} m)`,
        });
      }
    }

    if (
      obj.source.kind === "library" &&
      !library.includes(obj.source.libraryId)
    ) {
      issues.push({
        path: `${at}.source.libraryId`,
        message: `no library object "${obj.source.libraryId}"`,
      });
    }
  });
  return issues;
}

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
export function validate(
  doc: unknown,
  options: ValidateOptions = {},
): ValidationResult {
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
    const issues = [
      ...crossChecks(parsed.data),
      ...objectChecks(parsed.data, options.library ?? OBJECT_LIBRARY),
    ];
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
