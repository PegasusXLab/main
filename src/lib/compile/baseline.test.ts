import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import singleHall from "@/fixtures/templates/single-hall.json";
import journey from "@/fixtures/templates/three-room-journey.json";
import { validate } from "@/lib/schema/validate";
import { compile } from "./compile";

// ADR-015 v2 is additive: galleries without objects must validate and compile exactly as they did
// before objects existed. The snapshots were recorded on main before the objects stage was added.
const FIXTURES = { sample, singleHall, journey };

describe("galleries without objects compile unchanged", () => {
  for (const [name, doc] of Object.entries(FIXTURES)) {
    it(name, () => {
      const result = validate(doc);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const { scene, issues } = compile(result.gallery);
      const { objects, ...unchanged } = scene as typeof scene & {
        objects?: unknown[];
      };
      expect(objects ?? []).toEqual([]);
      expect({ scene: unchanged, issues }).toMatchSnapshot();
    });
  }
});
