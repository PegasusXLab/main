"use client";

// Artwork frames from the SceneModel (plan.md §5.3, §7; architecture §3).
// Draws each frame as a textured plane at position / rotationY, with a shared border.
// Textures load lazily per frame with neutral placeholder until loaded and on error,
// and are disposed when removed or changed. Border raycasting is disabled.
// T-125 (look-foundation): a real moulding with depth, a white mat (passe-partout) and a soft
// shadow on the wall. The group origin sits 5 mm in front of the wall face (FRAME_INSET).
// T-145b: animated artwork (GIF / MP4, see MediaTexture.ts) plays on the art plane, and the "tv"
// frame style swaps the moulding and mat for a dark bezel with a soft screen glow.

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { SceneFrame } from "@/lib/compile/types";
import { THEME } from "@/lib/theme";
import { getSoftShadowTexture } from "./materials";
import { getGlowTexture } from "./DoorwayCue";
import { chooseActive, createMediaRegistry, createMediaSource, type MediaRegistry } from "./MediaTexture";

export const FRAME_BORDER_WIDTH = 0.03;
export const FRAME_BORDER_COLOR = THEME.colors.graphite;
export const PLACEHOLDER_COLOR = "#e2e2de";
export const FRAME_DEPTH = 0.035; // moulding depth, meters, from the wall face
const WALL_FACE_Z = -0.005; // the wall surface in frame-local space
const MOULDING_Z = WALL_FACE_Z + FRAME_DEPTH / 2;
export const MAT_Z = WALL_FACE_Z + FRAME_DEPTH - 0.006; // mat recessed 6 mm behind the moulding face
export const ART_Z = MAT_Z + 0.001;
const SHADOW_Z = WALL_FACE_Z + 0.0005;
const SHADOW_DROP = 0.035; // meters below the frame
const SHADOW_SPREAD = 1.12;
const SHADOW_OPACITY = 0.38;

/** "tv" frame style: bezel width and depth (meters), and the screen just in front of it. */
export const TV_BEZEL = 0.04;
export const TV_DEPTH = 0.03;
export const TV_SCREEN_Z = WALL_FACE_Z + TV_DEPTH + 0.001;
export const TV_BEZEL_COLOR = "#0d0d0f"; // near-black: reads dark under gallery spotlights
const TV_GLOW_COLOR = "#9fb8ff";
const TV_GLOW_OPACITY = 0.22;
const TV_GLOW_SPREAD = 1.7;
/** Screens are unlit and a touch brighter than white, like the TV device. */
const SCREEN_GAIN = new THREE.Color(1.35, 1.35, 1.35);
const MEDIA_CHECK_MS = 700;

/** Mat (passe-partout) width for an artwork: 8% of its short side, 3–8 cm. */
export function frameMatWidth(width: number, height: number): number {
  return Math.min(0.08, Math.max(0.03, 0.08 * Math.min(width, height)));
}

/** Outer size of the framed piece (image + mat + moulding, or image + bezel for "tv"), meters. */
export function framedSize(width: number, height: number, style?: "tv"): [number, number] {
  if (style === "tv") return [width + 2 * TV_BEZEL, height + 2 * TV_BEZEL];
  const m = frameMatWidth(width, height);
  return [
    width + 2 * (m + FRAME_BORDER_WIDTH),
    height + 2 * (m + FRAME_BORDER_WIDTH),
  ];
}

export type TextureLoaderLike = {
  load: (
    url: string,
    onLoad: (texture: THREE.Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) => THREE.Texture | void;
};

export const SELECTED_FRAME_COLOR = THEME.colors.accent; // Klein blue selection accent (ADR-013)
export const SELECTED_BORDER_WIDTH = 0.04; // extra blue margin around the frame border (meters)

export interface FramesProps {
  /** Pointer over / off a frame (viewer: drives the "Inspect" cue). */
  onFrameHover?: (artworkId: string | null) => void;
  frames: SceneFrame[];
  onFrameClick?: (artworkId: string) => void;
  /** Artwork to outline in blue (editor only). */
  selectedArtworkId?: string;
  loader?: TextureLoaderLike;
  /** The visitor's room: only animated artwork there plays (nearest first, at most 3). */
  currentRoomId?: string;
}

export const noRaycast = () => null;

export function createFrameClickHandler(
  artworkId: string,
  onFrameClick?: (artworkId: string) => void,
) {
  if (!onFrameClick) return undefined;
  return (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onFrameClick(artworkId);
  };
}

export function ArtworkFrame({
  frame,
  planeGeometry,
  borderGeometry,
  borderMaterial,
  placeholderMaterial,
  mouldingGeometry,
  matMaterial,
  shadowMaterial,
  onFrameClick,
  onFrameHover,
  loader,
  selectedMaterial,
  mediaRegistry,
  tvGlowMaterial,
  tvBezelMaterial,
}: {
  frame: SceneFrame;
  planeGeometry: THREE.BufferGeometry;
  borderGeometry: THREE.BufferGeometry;
  borderMaterial: THREE.Material;
  placeholderMaterial: THREE.Material;
  mouldingGeometry: THREE.BufferGeometry;
  matMaterial: THREE.Material;
  shadowMaterial?: THREE.Material;
  onFrameClick?: (artworkId: string) => void;
  onFrameHover?: (artworkId: string | null) => void;
  loader?: TextureLoaderLike;
  /** When set, the frame is selected and gets a blue outer border with this material. */
  selectedMaterial?: THREE.Material;
  /** Where animated artwork registers its player (absent: the poster shows). */
  mediaRegistry?: MediaRegistry;
  /** Soft screen glow on the wall for the "tv" style. */
  tvGlowMaterial?: THREE.Material;
  /** Dark glossy bezel for the "tv" style (falls back to the moulding material). */
  tvBezelMaterial?: THREE.Material;
}) {
  const [loaded, setLoaded] = useState<{
    url: string;
    texture: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    if (!frame.imageUrl || !loader) return;

    let active = true;
    let currentTexture: THREE.Texture | null = null;

    try {
      loader.load(
        frame.imageUrl,
        (tex) => {
          if (!active) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          currentTexture = tex;
          setLoaded({ url: frame.imageUrl, texture: tex });
        },
        undefined,
        () => {
          if (!active) return;
          setLoaded(null);
        },
      );
    } catch {
      // Loader failed synchronously; state remains neutral placeholder (null)
    }

    return () => {
      active = false;
      if (currentTexture) {
        currentTexture.dispose();
      }
    };
  }, [frame.imageUrl, loader]);

  const posterTexture =
    loaded && loaded.url === frame.imageUrl ? loaded.texture : null;

  // Animated artwork: a paused player until the scheduler picks it; the poster shows until its
  // first frame. State changes once (first frame), never per frame.
  const mediaKind = frame.media?.kind;
  const mediaUrl = frame.media?.url;
  const [media, setMedia] = useState<{ url: string; texture: THREE.Texture } | null>(null);
  const [px, py, pz] = frame.position;
  const placeRef = useRef({ roomId: frame.roomId, position: [px, py, pz] as const });
  useEffect(() => {
    // Moving the artwork (editor drag) updates where the scheduler measures from; no reload.
    placeRef.current = { roomId: frame.roomId, position: [px, py, pz] };
    const entry = mediaRegistry?.entries.get(frame.artworkId);
    if (entry) mediaRegistry?.register(frame.artworkId, { ...entry, ...placeRef.current });
  }, [mediaRegistry, frame.artworkId, frame.roomId, px, py, pz]);
  useEffect(() => {
    if (!mediaKind || !mediaUrl || !mediaRegistry) return;
    let active = true;
    const source = createMediaSource(
      mediaKind,
      mediaUrl,
      (texture) => {
        if (active) setMedia({ url: mediaUrl, texture });
      },
      () => mediaRegistry.invalidate(),
    );
    if (!source) return;
    mediaRegistry.register(frame.artworkId, { source, ...placeRef.current });
    return () => {
      active = false;
      mediaRegistry.unregister(frame.artworkId);
      // Back to the poster first: the material must let go of the texture before it's freed.
      setMedia(null);
      source.dispose();
    };
  }, [mediaKind, mediaUrl, mediaRegistry, frame.artworkId]);

  const texture = (media && media.url === mediaUrl ? media.texture : null) ?? posterTexture;
  const tv = frame.frameStyle === "tv";

  const material = useMemo(() => {
    if (!texture) return null;
    if (tv) {
      return new THREE.MeshBasicMaterial({ map: texture, color: SCREEN_GAIN, toneMapped: false });
    }
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.55, // a print behind glass-free mount: soft sheen, no glare
      envMapIntensity: 0.35,
    });
  }, [texture, tv]);

  useEffect(() => {
    return () => {
      material?.dispose();
    };
  }, [material]);

  const mat = frameMatWidth(frame.width, frame.height);
  const innerW = frame.width + 2 * mat;
  const innerH = frame.height + 2 * mat;
  const [outerW, outerH] = framedSize(frame.width, frame.height, frame.frameStyle);
  const b = FRAME_BORDER_WIDTH;
  const onClick = createFrameClickHandler(frame.artworkId, onFrameClick);
  const hover = onFrameHover
    ? {
        onPointerOver: (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          onFrameHover(frame.artworkId);
        },
        onPointerOut: () => onFrameHover(null),
      }
    : {};
  const bars: {
    position: [number, number, number];
    scale: [number, number, number];
  }[] = [
    {
      position: [0, (innerH + b) / 2, MOULDING_Z],
      scale: [outerW, b, FRAME_DEPTH],
    },
    {
      position: [0, -(innerH + b) / 2, MOULDING_Z],
      scale: [outerW, b, FRAME_DEPTH],
    },
    {
      position: [-(innerW + b) / 2, 0, MOULDING_Z],
      scale: [b, innerH, FRAME_DEPTH],
    },
    {
      position: [(innerW + b) / 2, 0, MOULDING_Z],
      scale: [b, innerH, FRAME_DEPTH],
    },
  ];

  return (
    <group
      position={frame.position}
      rotation={[0, frame.rotationY, 0]}
      data-artwork-id={frame.artworkId}
    >
      {shadowMaterial ? (
        <mesh
          geometry={borderGeometry}
          material={shadowMaterial}
          scale={[outerW * SHADOW_SPREAD, outerH * SHADOW_SPREAD, 1]}
          position={[0, -SHADOW_DROP, SHADOW_Z]}
          raycast={noRaycast}
        />
      ) : null}

      {selectedMaterial ? (
        <mesh
          geometry={borderGeometry}
          material={selectedMaterial}
          scale={[
            outerW + SELECTED_BORDER_WIDTH * 2,
            outerH + SELECTED_BORDER_WIDTH * 2,
            1,
          ]}
          position={[0, 0, SHADOW_Z + 0.0005]}
          raycast={noRaycast}
        />
      ) : null}

      {tv ? (
        <>
          {/* Screen light on the wall behind the set */}
          {tvGlowMaterial ? (
            <mesh
              geometry={borderGeometry}
              material={tvGlowMaterial}
              scale={[outerW * TV_GLOW_SPREAD, outerH * TV_GLOW_SPREAD, 1]}
              position={[0, 0, SHADOW_Z + 0.001]}
              raycast={noRaycast}
            />
          ) : null}
          {/* Bezel: one dark slab behind the screen; clicking it opens the artwork too */}
          <mesh
            geometry={mouldingGeometry}
            material={tvBezelMaterial ?? borderMaterial}
            scale={[outerW, outerH, TV_DEPTH]}
            position={[0, 0, WALL_FACE_Z + TV_DEPTH / 2]}
            onClick={onClick}
            {...hover}
          />
          <mesh
            geometry={planeGeometry}
            material={material ?? placeholderMaterial}
            scale={[frame.width, frame.height, 1]}
            position={[0, 0, TV_SCREEN_Z]}
            onClick={onClick}
            {...hover}
          />
        </>
      ) : null}

      {/* Moulding: four bars with depth around the mat */}
      {tv ? null : bars.map((bar, i) => (
        <mesh
          key={i}
          geometry={mouldingGeometry}
          material={borderMaterial}
          position={bar.position}
          scale={bar.scale}
          raycast={noRaycast}
        />
      ))}

      {tv ? null : (
        <>
          {/* Mat (passe-partout); clicking it opens the artwork too */}
          <mesh
            geometry={planeGeometry}
            material={matMaterial}
            scale={[innerW, innerH, 1]}
            position={[0, 0, MAT_Z]}
            onClick={onClick}
            {...hover}
          />

          {/* Textured plane for the artwork (or neutral placeholder) */}
          <mesh
            geometry={planeGeometry}
            material={material ?? placeholderMaterial}
            scale={[frame.width, frame.height, 1]}
            position={[0, 0, ART_Z]}
            onClick={onClick}
            {...hover}
          />
        </>
      )}
    </group>
  );
}

/** Plays the animated artwork nearest the camera in the current room, pauses the rest. */
function MediaScheduler({ registry, currentRoomId }: { registry: MediaRegistry; currentRoomId?: string }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    registry.setInvalidate(invalidate);
    return () => registry.setInvalidate(() => {});
  }, [registry, invalidate]);
  useEffect(() => {
    const at = new THREE.Vector3();
    const check = () => {
      const candidates = [...registry.entries].map(([id, e]) => ({
        id,
        roomId: e.roomId,
        distance: camera.position.distanceTo(at.set(e.position[0], e.position[1], e.position[2])),
      }));
      registry.apply(chooseActive(candidates, currentRoomId));
    };
    check();
    const timer = window.setInterval(check, MEDIA_CHECK_MS);
    return () => window.clearInterval(timer);
  }, [registry, camera, currentRoomId]);
  return null;
}

export function Frames({
  frames,
  onFrameClick,
  onFrameHover,
  loader,
  selectedArtworkId,
  currentRoomId,
}: FramesProps) {
  const activeLoader = useMemo(() => {
    if (loader) return loader;
    if (typeof document !== "undefined") {
      return new THREE.TextureLoader();
    }
    return undefined;
  }, [loader]);

  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const borderGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const borderMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: FRAME_BORDER_COLOR,
        roughness: 0.4,
      }),
    [],
  );
  const mouldingGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const matMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: THEME.colors.paper,
        roughness: 0.95,
        envMapIntensity: 0.5,
      }),
    [],
  );
  const shadowMaterial = useMemo(() => {
    const alphaMap = getSoftShadowTexture();
    if (!alphaMap) return undefined;
    return new THREE.MeshBasicMaterial({
      color: "#000000",
      alphaMap,
      transparent: true,
      opacity: SHADOW_OPACITY,
      depthWrite: false,
    });
  }, []);
  const selectedMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: SELECTED_FRAME_COLOR }),
    [],
  );
  const hasMedia = frames.some((f) => f.media);
  const mediaRegistry = useMemo(() => (hasMedia ? createMediaRegistry() : undefined), [hasMedia]);
  const tvBezelMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: TV_BEZEL_COLOR, metalness: 0.2, roughness: 0.35, envMapIntensity: 0.15 }),
    [],
  );
  const tvGlowMaterial = useMemo(() => {
    const map = getGlowTexture();
    if (!map) return undefined;
    return new THREE.MeshBasicMaterial({
      map,
      color: TV_GLOW_COLOR,
      transparent: true,
      opacity: TV_GLOW_OPACITY,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
  }, []);
  const placeholderMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PLACEHOLDER_COLOR,
        roughness: 0.9,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      planeGeometry.dispose();
      borderGeometry.dispose();
      borderMaterial.dispose();
      mouldingGeometry.dispose();
      matMaterial.dispose();
      shadowMaterial?.dispose();
      placeholderMaterial.dispose();
      selectedMaterial.dispose();
      tvGlowMaterial?.dispose();
      tvBezelMaterial.dispose();
    };
  }, [
    planeGeometry,
    borderGeometry,
    borderMaterial,
    placeholderMaterial,
    selectedMaterial,
    mouldingGeometry,
    matMaterial,
    shadowMaterial,
    tvGlowMaterial,
    tvBezelMaterial,
  ]);

  return (
    <group>
      {mediaRegistry ? <MediaScheduler registry={mediaRegistry} currentRoomId={currentRoomId} /> : null}
      {frames.map((frame) => (
        <ArtworkFrame
          key={frame.artworkId}
          frame={frame}
          planeGeometry={planeGeometry}
          borderGeometry={borderGeometry}
          borderMaterial={borderMaterial}
          placeholderMaterial={placeholderMaterial}
          mouldingGeometry={mouldingGeometry}
          matMaterial={matMaterial}
          shadowMaterial={shadowMaterial}
          onFrameClick={onFrameClick}
          onFrameHover={onFrameHover}
          loader={activeLoader}
          mediaRegistry={mediaRegistry}
          tvGlowMaterial={tvGlowMaterial}
          tvBezelMaterial={tvBezelMaterial}
          selectedMaterial={
            frame.artworkId === selectedArtworkId ? selectedMaterial : undefined
          }
        />
      ))}
    </group>
  );
}
