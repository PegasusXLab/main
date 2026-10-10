import { nanoid } from "nanoid";
import type { Gallery } from "@/lib/schema/types";
import singleHallJson from "@/fixtures/templates/single-hall.json";
import threeRoomJourneyJson from "@/fixtures/templates/three-room-journey.json";

export interface TemplateDefinition {
  id: "single-hall" | "three-room-journey";
  name: string;
  template: Record<string, unknown>;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "single-hall",
    name: "Hall",
    template: singleHallJson,
  },
  {
    id: "three-room-journey",
    name: "Journey",
    template: threeRoomJourneyJson,
  },
];

/** Instantiates a template document with fresh room IDs and timestamps */
export function instantiateTemplate(raw: Record<string, unknown>): Gallery {
  const g = structuredClone(raw) as unknown as Gallery;
  const now = new Date().toISOString();
  const idMap = new Map<string, string>();

  g.id = nanoid();
  g.createdAt = now;
  g.updatedAt = now;
  g.artworks = [];

  for (const r of g.rooms) {
    const oldId = r.id;
    const newId = nanoid();
    idMap.set(oldId, newId);
    r.id = newId;
  }

  if (g.entranceRoomId && idMap.has(g.entranceRoomId)) {
    g.entranceRoomId = idMap.get(g.entranceRoomId)!;
  } else if (g.rooms[0]) {
    g.entranceRoomId = g.rooms[0].id;
  }

  return g;
}
