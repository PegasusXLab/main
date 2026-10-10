import { describe, expect, it } from "vitest";
import sample3Room from "@/fixtures/sample-3room.json";
import { compile } from "@/lib/compile/compile";
import type { SceneFrame, SceneRoom } from "@/lib/compile/types";
import type { Gallery } from "@/lib/schema/types";
import {
  fovForAspect,
  MIN_HORIZONTAL_FOV,
  MAX_VERTICAL_FOV,
  ARTWORK_CAMERA_DISTANCE,
  computeArtworkCameraPose,
  computeRoomCameraPose,
  DEFAULT_CAMERA_FOV,
  easeInOutCubic,
  MAX_FRAME_DELTA,
  TRANSITION_DURATION,
} from "./CameraRig";

describe("CameraRig constants and curves", () => {
  it("enforces R4 transition duration of ~1s and ADR-002 distance of 1.8m", () => {
    expect(TRANSITION_DURATION).toBe(1.0);
    expect(ARTWORK_CAMERA_DISTANCE).toBe(1.8);
    expect(DEFAULT_CAMERA_FOV).toBe(50);
  });

  it("clamps frame delta per R6 (max 1/15 s)", () => {
    expect(MAX_FRAME_DELTA).toBeCloseTo(1 / 15, 6);
  });

  it("calculates easeInOutCubic curve values correctly with boundaries clamped", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);

    // Clamping
    expect(easeInOutCubic(-0.5)).toBe(0);
    expect(easeInOutCubic(1.5)).toBe(1);

    // Eased acceleration (cubic)
    expect(easeInOutCubic(0.25)).toBe(4 * 0.25 * 0.25 * 0.25); // 0.0625
    expect(easeInOutCubic(0.75)).toBe(1 - 4 * 0.25 * 0.25 * 0.25); // 0.9375
  });
});

describe("computeArtworkCameraPose", () => {
  const baseFrame: SceneFrame = {
    artworkId: "art-1",
    roomId: "room-1",
    position: [10, 1.6, 20],
    rotationY: 0,
    width: 1.2,
    height: 0.9,
    imageUrl: "https://example.com/art-med.webp",
  };

  it("positions camera 1.8 m in front of North wall frame looking at frame center", () => {
    // North wall: rotationY = 0 (faces +z)
    const pose = computeArtworkCameraPose({ ...baseFrame, rotationY: 0 });
    expect(pose.position[0]).toBeCloseTo(10, 5);
    expect(pose.position[1]).toBeCloseTo(1.6, 5);
    expect(pose.position[2]).toBeCloseTo(20 + 1.8, 5);

    expect(pose.target).toEqual([10, 1.6, 20]);
    expect(pose.fov).toBe(DEFAULT_CAMERA_FOV);
  });

  it("positions camera 1.8 m in front of South wall frame looking at frame center", () => {
    // South wall: rotationY = PI (faces -z)
    const pose = computeArtworkCameraPose({
      ...baseFrame,
      rotationY: Math.PI,
    });
    expect(pose.position[0]).toBeCloseTo(10, 5);
    expect(pose.position[1]).toBeCloseTo(1.6, 5);
    expect(pose.position[2]).toBeCloseTo(20 - 1.8, 5);

    expect(pose.target).toEqual([10, 1.6, 20]);
    expect(pose.fov).toBe(DEFAULT_CAMERA_FOV);
  });

  it("positions camera 1.8 m in front of West wall frame looking at frame center", () => {
    // West wall: rotationY = PI/2 (faces +x)
    const pose = computeArtworkCameraPose({
      ...baseFrame,
      rotationY: Math.PI / 2,
    });
    expect(pose.position[0]).toBeCloseTo(10 + 1.8, 5);
    expect(pose.position[1]).toBeCloseTo(1.6, 5);
    expect(pose.position[2]).toBeCloseTo(20, 5);

    expect(pose.target).toEqual([10, 1.6, 20]);
    expect(pose.fov).toBe(DEFAULT_CAMERA_FOV);
  });

  it("positions camera 1.8 m in front of East wall frame looking at frame center", () => {
    // East wall: rotationY = -PI/2 (faces -x)
    const pose = computeArtworkCameraPose({
      ...baseFrame,
      rotationY: -Math.PI / 2,
    });
    expect(pose.position[0]).toBeCloseTo(10 - 1.8, 5);
    expect(pose.position[1]).toBeCloseTo(1.6, 5);
    expect(pose.position[2]).toBeCloseTo(20, 5);

    expect(pose.target).toEqual([10, 1.6, 20]);
    expect(pose.fov).toBe(DEFAULT_CAMERA_FOV);
  });

  it("respects custom distance and custom fov", () => {
    const pose = computeArtworkCameraPose(baseFrame, 2.5, 65);
    expect(pose.position[2]).toBeCloseTo(20 + 2.5, 5);
    expect(pose.fov).toBe(65);
  });
});

describe("computeRoomCameraPose", () => {
  it("extracts room.view camera position and target from SceneRoom", () => {
    const room: SceneRoom = {
      roomId: "room-a",
      center: [5, 0, 5],
      lighting: "gallery",
      view: {
        position: [2, 1.6, 3],
        target: [6, 1.6, 7],
      },
    };

    const pose = computeRoomCameraPose(room);
    expect(pose.position).toEqual([2, 1.6, 3]);
    expect(pose.target).toEqual([6, 1.6, 7]);
    expect(pose.fov).toBe(DEFAULT_CAMERA_FOV);
  });
});

describe("Integration with compile and sample-3room", () => {
  const { scene: compiled } = compile(sample3Room as unknown as Gallery);

  it("computes room camera poses for all compiled rooms", () => {
    expect(compiled.rooms.length).toBeGreaterThan(0);
    for (const room of compiled.rooms) {
      const pose = computeRoomCameraPose(room);
      expect(pose.position).toEqual(room.view.position);
      expect(pose.target).toEqual(room.view.target);
    }
  });

  it("computes artwork camera poses facing into rooms for sample artworks", () => {
    expect(compiled.frames.length).toBe(2);
    for (const frame of compiled.frames) {
      const pose = computeArtworkCameraPose(frame);
      expect(pose.target).toEqual(frame.position);
      expect(pose.position[1]).toBeCloseTo(frame.position[1], 5); // eye height matches frame center

      // Distance from camera to frame center is exactly ARTWORK_CAMERA_DISTANCE
      const dx = pose.position[0] - frame.position[0];
      const dy = pose.position[1] - frame.position[1];
      const dz = pose.position[2] - frame.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      expect(dist).toBeCloseTo(ARTWORK_CAMERA_DISTANCE, 4);
    }
  });
});

describe("2048 px high-res artwork focus swap logic", () => {
  const frames: SceneFrame[] = [
    {
      artworkId: "art-1",
      roomId: "room-1",
      position: [0, 1.5, 0],
      rotationY: 0,
      width: 1,
      height: 1,
      imageUrl: "https://example.com/art-1-medium.webp",
    },
    {
      artworkId: "art-2",
      roomId: "room-1",
      position: [3, 1.5, 0],
      rotationY: 0,
      width: 1,
      height: 1,
      imageUrl: "https://example.com/art-2-medium.webp",
    },
  ];

  function getFramesToRender(
    modelFrames: SceneFrame[],
    focusArtworkId?: string,
    largeImages?: Record<string, string>,
  ) {
    if (!focusArtworkId) return modelFrames;
    return modelFrames.map((frame) => {
      if (frame.artworkId !== focusArtworkId) return frame;
      const large =
        largeImages?.[frame.artworkId] ??
        (frame as { largeImageUrl?: string }).largeImageUrl;
      if (!large || large === frame.imageUrl) return frame;
      return { ...frame, imageUrl: large };
    });
  }

  it("retains medium images when no artwork is focused", () => {
    const rendered = getFramesToRender(frames, undefined, {
      "art-1": "https://example.com/art-1-large.webp",
    });
    expect(rendered[0].imageUrl).toBe("https://example.com/art-1-medium.webp");
    expect(rendered[1].imageUrl).toBe("https://example.com/art-2-medium.webp");
  });

  it("swaps to 2048 px image for the focused artwork only", () => {
    const rendered = getFramesToRender(frames, "art-1", {
      "art-1": "https://example.com/art-1-large.webp",
      "art-2": "https://example.com/art-2-large.webp",
    });
    expect(rendered[0].imageUrl).toBe("https://example.com/art-1-large.webp");
    expect(rendered[1].imageUrl).toBe("https://example.com/art-2-medium.webp");
  });

  it("supports largeImageUrl property on the frame object directly", () => {
    const framesWithLarge: SceneFrame[] = [
      {
        ...frames[0],
        largeImageUrl: "https://example.com/art-1-direct-large.webp",
      } as SceneFrame,
    ];
    const rendered = getFramesToRender(framesWithLarge, "art-1");
    expect(rendered[0].imageUrl).toBe(
      "https://example.com/art-1-direct-large.webp",
    );
  });
});

describe("fovForAspect (T-081: portrait phones)", () => {
  const horizontal = (vFov: number, aspect: number) =>
    (2 * Math.atan(Math.tan((vFov * Math.PI) / 360) * aspect) * 180) / Math.PI;

  it("leaves landscape / desktop framing unchanged", () => {
    expect(fovForAspect(50, 16 / 9)).toBe(50);
    expect(fovForAspect(50, 1)).toBe(50);
  });

  it("raises the vertical fov on portrait so the horizontal fov reaches ~70 degrees", () => {
    for (const aspect of [390 / 844, 412 / 915, 0.75]) {
      // iPhone 14, Pixel 7, iPad portrait
      const v = fovForAspect(50, aspect);
      expect(v).toBeGreaterThan(50);
      expect(horizontal(v, aspect)).toBeCloseTo(MIN_HORIZONTAL_FOV, 5);
    }
  });

  it("a 6 m wall fits across the screen from the Entrance viewpoint (5 m away) on an iPhone", () => {
    const aspect = 390 / 844;
    const halfWidthAt5m =
      5 *
      Math.tan((horizontal(fovForAspect(50, aspect), aspect) * Math.PI) / 360);
    expect(halfWidthAt5m * 2).toBeGreaterThan(6);
  });

  it("keeps the base fov when portrait is already wide enough", () => {
    expect(fovForAspect(100, 0.9)).toBe(100);
  });

  it("caps the vertical fov on extremely tall screens", () => {
    expect(fovForAspect(50, 0.2)).toBe(MAX_VERTICAL_FOV);
  });

  it("ignores a zero or invalid aspect", () => {
    expect(fovForAspect(50, 0)).toBe(50);
    expect(fovForAspect(50, Number.NaN)).toBe(50);
  });
});
