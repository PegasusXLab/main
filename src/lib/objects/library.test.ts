import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newObject, OBJECT_LIBRARY } from "@/lib/schema/defaults";
import type { Gallery } from "@/lib/schema/types";
import { validate } from "@/lib/schema/validate";
import { LIBRARY, LIBRARY_IDS, libraryEntry } from "./library";

const PUBLIC = path.join(process.cwd(), "public");
const MAX_FILE = 1_500_000;
const MAX_TOTAL = 15_000_000;

describe("object library (T-133)", () => {
  it("has 16 unique, CC0, credited entries wired into OBJECT_LIBRARY", () => {
    expect(LIBRARY).toHaveLength(16);
    expect(new Set(LIBRARY_IDS).size).toBe(LIBRARY.length);
    expect(OBJECT_LIBRARY).toEqual(LIBRARY_IDS);
    for (const e of LIBRARY) {
      expect(e.credit.license).toBe("CC0");
      expect(e.credit.author.length).toBeGreaterThan(0);
      expect(e.credit.source).toMatch(/^https:\/\/polyhaven\.com\/a\//);
      expect(e.defaultHeight).toBeGreaterThan(0);
      expect(e.defaultHeight).toBeLessThanOrEqual(4);
      expect(libraryEntry(e.id)).toBe(e);
    }
  });

  it("ships every model and poster in public/library within the size budget", () => {
    let total = 0;
    for (const e of LIBRARY) {
      const model = path.join(PUBLIC, e.modelUrl);
      const poster = path.join(PUBLIC, e.posterUrl);
      expect(fs.existsSync(model), e.modelUrl).toBe(true);
      expect(fs.existsSync(poster), e.posterUrl).toBe(true);
      const size = fs.statSync(model).size;
      expect(size, e.id).toBe(e.bytes);
      expect(size, e.id).toBeLessThanOrEqual(MAX_FILE);
      // glTF binary magic "glTF", version 2
      const head = fs.readFileSync(model).subarray(0, 8);
      expect(head.toString("ascii", 0, 4)).toBe("glTF");
      expect(head.readUInt32LE(4)).toBe(2);
      total += size + fs.statSync(poster).size;
    }
    expect(total).toBeLessThanOrEqual(MAX_TOTAL);
  });

  it("validates a gallery that uses every library object", () => {
    const g = structuredClone(sample) as unknown as Gallery;
    const room = g.rooms[0];
    g.objects = LIBRARY.map((e, i) => ({
      ...newObject(room.id, { kind: "library", libraryId: e.id }, room),
      id: `lib-${i}`,
      height: e.defaultHeight,
      plinth: { ...e.plinth },
    }));
    const r = validate(g);
    expect(r.ok, JSON.stringify(r.ok ? [] : r.issues)).toBe(true);
  });
});
