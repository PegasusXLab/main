import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import * as THREE from "three";
import sample from "@/fixtures/sample-3room.json";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import type { SceneFrame } from "@/lib/compile/types";
import { THEME } from "@/lib/theme";
import {
  Frames,
  noRaycast,
  createFrameClickHandler,
  FRAME_BORDER_WIDTH,
  FRAME_DEPTH,
  ART_Z,
  MAT_Z,
  frameMatWidth,
  framedSize,
  FRAME_BORDER_COLOR,
  SELECTED_FRAME_COLOR,
  PLACEHOLDER_COLOR,
  TV_BEZEL,
  TV_DEPTH,
  TV_SCREEN_Z,
  type TextureLoaderLike,
} from "./Frames";

// Animated artwork mounts a scheduler that reads the camera; render it outside a Canvas.
vi.mock("@react-three/fiber", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@react-three/fiber")>()),
  useThree: (select: (s: { camera: THREE.Camera; invalidate: () => void }) => unknown) =>
    select({ camera: new THREE.PerspectiveCamera(), invalidate: () => {} }),
}));

const fixture = () => structuredClone(sample) as Gallery;

describe("Frames component", () => {
  it("renders the two placeholder artworks in sample-3room.json on the correct walls", () => {
    const { scene } = compile(fixture());
    expect(scene.frames).toHaveLength(2);

    const [sunrise, portrait] = scene.frames;

    // art-sunrise on Entrance north wall
    expect(sunrise.artworkId).toBe("art-sunrise");
    expect(sunrise.position[0]).toBeCloseTo(3);
    expect(sunrise.position[1]).toBeCloseTo(1.6);
    expect(sunrise.position[2]).toBeCloseTo(0.08);
    expect(sunrise.rotationY).toBeCloseTo(0);
    expect(sunrise.width).toBeCloseTo(1.2);
    expect(sunrise.height).toBeCloseTo(0.9);
    expect(sunrise.imageUrl).toBe("/fixtures/placeholder.webp");

    // art-portrait on East Hall east wall
    expect(portrait.artworkId).toBe("art-portrait");
    expect(portrait.position[0]).toBeCloseTo(11.92);
    expect(portrait.position[1]).toBeCloseTo(1.5);
    expect(portrait.position[2]).toBeCloseTo(3);
    expect(portrait.rotationY).toBeCloseTo(-Math.PI / 2);
    expect(portrait.width).toBeCloseTo(1);
    expect(portrait.height).toBeCloseTo(0.75);
    expect(portrait.imageUrl).toBe("/fixtures/placeholder.webp");

    const html = renderToString(<Frames frames={scene.frames} />);
    expect(html).toContain('data-artwork-id="art-sunrise"');
    expect(html).toContain('data-artwork-id="art-portrait"');
  });

  it("draws each frame with an artwork mesh and a thin shared frame border", () => {
    const testFrame: SceneFrame = {
      artworkId: "art-1",
      roomId: "room-1",
      position: [2, 1.5, 0.08],
      rotationY: 0,
      width: 1.2,
      height: 0.8,
      imageUrl: "/img/medium.webp",
    };

    const tree = <Frames frames={[testFrame]} />;
    expect(React.isValidElement(tree)).toBe(true);

    const html = renderToString(tree);
    expect(html).toContain('data-artwork-id="art-1"');
    expect(html).toContain('position="2,1.5,0.08"');
  });

  it("calculates border dimensions based on FRAME_BORDER_WIDTH", () => {
    const width = 1.0;
    const height = 0.75;
    const expectedBorderWidth = width + FRAME_BORDER_WIDTH * 2;
    const expectedBorderHeight = height + FRAME_BORDER_WIDTH * 2;

    expect(expectedBorderWidth).toBeCloseTo(1.06);
    expect(expectedBorderHeight).toBeCloseTo(0.81);
    expect(FRAME_BORDER_WIDTH).toBe(0.03);
    expect(FRAME_BORDER_COLOR).toBe(THEME.colors.graphite);
    expect(FRAME_BORDER_COLOR).toBe("#1e2022");
    expect(SELECTED_FRAME_COLOR).toBe(THEME.colors.accent);
    expect(SELECTED_FRAME_COLOR).toBe("#002fa7");
    expect(PLACEHOLDER_COLOR).toBe("#e2e2de");
  });

  it("renders empty group when frames list is empty", () => {
    const html = renderToString(<Frames frames={[]} />);
    expect(html).toBe("<group></group>");
  });

  it("disables raycasting on the border mesh via noRaycast helper", () => {
    expect(noRaycast()).toBeNull();
  });

  it("creates frame click handler that calls onFrameClick and stops event propagation", () => {
    const onFrameClick = vi.fn();
    const handler = createFrameClickHandler("art-click-test", onFrameClick);
    expect(handler).toBeDefined();

    const stopPropagation = vi.fn();
    handler!({ stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onFrameClick).toHaveBeenCalledWith("art-click-test");

    // Returns undefined when onFrameClick is not provided
    expect(createFrameClickHandler("art-1", undefined)).toBeUndefined();
  });

  it("renders a moulding with depth, a mat and the artwork in front of it (T-125)", () => {
    const testFrame: SceneFrame = {
      artworkId: "art-1",
      roomId: "room-1",
      position: [1, 1, 1],
      rotationY: 0,
      width: 1.2,
      height: 0.9,
      imageUrl: "/img/medium.webp",
    };

    const html = renderToString(<Frames frames={[testFrame]} />);
    const mat = frameMatWidth(1.2, 0.9); // 0.072
    const [outerW] = framedSize(1.2, 0.9);
    expect(mat).toBeCloseTo(0.072);
    expect(outerW).toBeCloseTo(1.2 + 2 * (0.072 + FRAME_BORDER_WIDTH));
    expect(html).toContain(
      `scale="${outerW},${FRAME_BORDER_WIDTH},${FRAME_DEPTH}"`,
    ); // top bar
    expect(html).toContain('scale="1.2,0.9,1"'); // artwork scale
    expect(html).toContain(`position="0,0,${ART_Z}"`); // artwork sits in front of the mat
    expect(html).toContain(`position="0,0,${MAT_Z}"`);
    expect(ART_Z).toBeGreaterThan(MAT_Z);
  });

  it("handles texture loader callbacks and texture disposal", () => {
    const testFrame: SceneFrame = {
      artworkId: "art-tex",
      roomId: "r",
      position: [0, 1, 0],
      rotationY: 0,
      width: 1,
      height: 1,
      imageUrl: "/art.webp",
    };

    let capturedOnLoad: ((tex: THREE.Texture) => void) | undefined;
    let capturedOnError: (() => void) | undefined;

    const mockLoader: TextureLoaderLike = {
      load: vi.fn((_url, onLoad, _onProgress, onError) => {
        capturedOnLoad = onLoad;
        capturedOnError = onError;
      }),
    };

    const html = renderToString(
      <Frames frames={[testFrame]} loader={mockLoader} />,
    );
    expect(html).toContain('data-artwork-id="art-tex"');

    const mockTexture = new THREE.Texture();
    const disposeSpy = vi.spyOn(mockTexture, "dispose");

    mockLoader.load(
      testFrame.imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
      },
      undefined,
      vi.fn(),
    );

    expect(mockLoader.load).toHaveBeenCalledWith(
      "/art.webp",
      expect.any(Function),
      undefined,
      expect.any(Function),
    );

    if (capturedOnLoad) {
      capturedOnLoad(mockTexture);
      expect(mockTexture.colorSpace).toBe(THREE.SRGBColorSpace);
    }
    if (capturedOnError) {
      capturedOnError();
    }

    mockTexture.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps the mat between 3 and 8 cm (T-125)", () => {
    expect(frameMatWidth(0.2, 0.2)).toBeCloseTo(0.03);
    expect(frameMatWidth(3, 2)).toBeCloseTo(0.08);
  });
});

describe("animated artwork and the TV style (T-145b)", () => {
  const base: SceneFrame = {
    artworkId: "art-tv",
    roomId: "room-1",
    position: [1, 1.5, 0.08],
    rotationY: 0,
    width: 1.6,
    height: 0.9,
    imageUrl: "/img/poster.webp",
  };

  it('"tv" draws a dark bezel and a screen instead of the moulding and mat', () => {
    const html = renderToString(<Frames frames={[{ ...base, frameStyle: "tv" }]} />);
    const [outerW, outerH] = framedSize(1.6, 0.9, "tv");
    expect(outerW).toBeCloseTo(1.6 + 2 * TV_BEZEL);
    expect(outerH).toBeCloseTo(0.9 + 2 * TV_BEZEL);
    expect(html).toContain(`scale="${outerW},${outerH},${TV_DEPTH}"`); // bezel
    expect(html).toContain(`position="0,0,${TV_SCREEN_Z}"`); // screen in front of it
    expect(html).toContain('scale="1.6,0.9,1"');
    expect(html).not.toContain(`position="0,0,${MAT_Z}"`); // no mat
    expect(html).not.toContain(`,${FRAME_BORDER_WIDTH},${FRAME_DEPTH}"`); // no moulding bars
    expect(TV_SCREEN_Z).toBeGreaterThan(TV_DEPTH - 0.005);
  });

  it("an animated artwork renders its poster frame until the media plays", () => {
    const frame: SceneFrame = { ...base, media: { kind: "video", url: "/v.mp4", aspect: 0.5625 } };
    const html = renderToString(<Frames frames={[frame]} currentRoomId="room-1" />);
    expect(html).toContain('data-artwork-id="art-tv"');
    expect(html).toContain(`position="0,0,${ART_Z}"`); // regular frame: art plane in front of the mat
  });
});
