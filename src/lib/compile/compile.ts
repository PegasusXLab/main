// compile(gallery) → { scene, issues }: the one call the renderer depends on (plan.md §5, ADR-004).
// Pure TypeScript: no three.js, React or store imports anywhere under src/lib/compile/.
// P0 recompiles the whole gallery on every change (architecture §3). A per-room memo, if added
// later, must key on the room plus every room sharing an edge with it (overview S4).

import type { Gallery, Room } from "@/lib/schema/types";
import { doorways, type DoorwayCut } from "./doorways";
import { findSharedEdges } from "./edges";
import { frames } from "./frames";
import type {
  CompileIssue,
  SceneDoorway,
  SceneModel,
  SceneRoom,
  Vec3,
} from "./types";
import { walls } from "./walls";

export const EYE_HEIGHT = 1.6; // meters (ADR-007)
/** How far the camera stands in from the south wall: 1 m, or a quarter of the depth in small rooms. */
const VIEW_STANDOFF = 1;

function floorCenter(r: Room): Vec3 {
  return [r.x + r.w / 2, 0, r.y + r.d / 2];
}

/** Camera spot: eye height, near the middle of the south wall, looking at the room center (north). */
function roomView(r: Room): SceneRoom["view"] {
  const [cx, , cz] = floorCenter(r);
  const standoff = Math.min(VIEW_STANDOFF, r.d / 4);
  return {
    position: [cx, EYE_HEIGHT, r.y + r.d - standoff],
    target: [cx, EYE_HEIGHT, cz],
  };
}

function toSceneDoorway(cut: DoorwayCut): SceneDoorway {
  const mid = (cut.from + cut.to) / 2;
  const y = cut.height / 2;
  const eastWest = cut.sideA === "e" || cut.sideA === "w";
  return {
    roomIds: [cut.a, cut.b],
    center: eastWest ? [cut.line, y, mid] : [mid, y, cut.line],
    width: cut.width,
    height: cut.height,
    side: cut.sideA,
  };
}

export function compile(gallery: Gallery): {
  scene: SceneModel;
  issues: CompileIssue[];
} {
  const { rooms, artworks } = gallery;
  const cuts = doorways(findSharedEdges(rooms), rooms);
  const placed = frames(artworks, rooms, cuts);

  const scene: SceneModel = {
    floors: rooms.map((r) => ({
      roomId: r.id,
      center: floorCenter(r),
      size: [r.w, r.d],
      floor: r.floor,
    })),
    walls: rooms.flatMap((r) => walls(r, cuts)),
    doorways: cuts.map(toSceneDoorway),
    frames: placed.frames,
    rooms: rooms.map((r) => ({
      roomId: r.id,
      center: floorCenter(r),
      lighting: r.lighting,
      view: roomView(r),
    })),
  };
  return { scene, issues: placed.issues };
}
