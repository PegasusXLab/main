import type { SceneFloor, SceneModel } from "@/lib/compile/types";

export interface MinimapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  height: number;
}

export interface ScaledRect {
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes bounding box in world/plan coordinates across all floors.
 */
export function computeMinimapBounds(
  floors: SceneFloor[],
  padding = 1,
): MinimapBounds {
  if (floors.length === 0) {
    return { minX: 0, maxX: 10, minZ: 0, maxZ: 10, width: 10, height: 10 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const f of floors) {
    const halfW = f.size[0] / 2;
    const halfD = f.size[1] / 2;
    minX = Math.min(minX, f.center[0] - halfW);
    maxX = Math.max(maxX, f.center[0] + halfW);
    minZ = Math.min(minZ, f.center[2] - halfD);
    maxZ = Math.max(maxZ, f.center[2] + halfD);
  }

  minX -= padding;
  maxX += padding;
  minZ -= padding;
  maxZ += padding;

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxZ - minZ, 1),
  };
}

/**
 * Transforms world coordinates (x, z) of room floors into SVG viewBox coordinates (0..targetSize).
 */
export function scaleFloorToMinimap(
  floor: SceneFloor,
  bounds: MinimapBounds,
  canvasWidth: number,
  canvasHeight: number,
): ScaledRect {
  const scale = Math.min(
    canvasWidth / bounds.width,
    canvasHeight / bounds.height,
  );
  const offsetX = (canvasWidth - bounds.width * scale) / 2;
  const offsetY = (canvasHeight - bounds.height * scale) / 2;

  const worldLeft = floor.center[0] - floor.size[0] / 2;
  const worldTop = floor.center[2] - floor.size[1] / 2;

  const x = offsetX + (worldLeft - bounds.minX) * scale;
  const y = offsetY + (worldTop - bounds.minZ) * scale;
  const width = floor.size[0] * scale;
  const height = floor.size[1] * scale;

  return {
    roomId: floor.roomId,
    x,
    y,
    width,
    height,
  };
}
