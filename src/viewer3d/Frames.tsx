"use client";

// Artwork frames from the SceneModel (plan.md §5.3, §7; architecture §3).
// Draws each frame as a textured plane at position / rotationY, with a shared border.
// Textures load lazily per frame with neutral placeholder until loaded and on error,
// and are disposed when removed or changed. Border raycasting is disabled.
// T-125 (look-foundation): a real moulding with depth, a white mat (passe-partout) and a soft
// shadow on the wall. The group origin sits 5 mm in front of the wall face (FRAME_INSET).

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { SceneFrame } from "@/lib/compile/types";
import { THEME } from "@/lib/theme";
import { getSoftShadowTexture } from "./materials";

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

/** Mat (passe-partout) width for an artwork: 8% of its short side, 3–8 cm. */
export function frameMatWidth(width: number, height: number): number {
  return Math.min(0.08, Math.max(0.03, 0.08 * Math.min(width, height)));
}

/** Outer size of the framed piece (image + mat + moulding), meters. */
export function framedSize(width: number, height: number): [number, number] {
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
  frames: SceneFrame[];
  onFrameClick?: (artworkId: string) => void;
  /** Artwork to outline in blue (editor only). */
  selectedArtworkId?: string;
  loader?: TextureLoaderLike;
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
  loader,
  selectedMaterial,
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
  loader?: TextureLoaderLike;
  /** When set, the frame is selected and gets a blue outer border with this material. */
  selectedMaterial?: THREE.Material;
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

  const texture =
    loaded && loaded.url === frame.imageUrl ? loaded.texture : null;

  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.55, // a print behind glass-free mount: soft sheen, no glare
      envMapIntensity: 0.35,
    });
  }, [texture]);

  useEffect(() => {
    return () => {
      material?.dispose();
    };
  }, [material]);

  const mat = frameMatWidth(frame.width, frame.height);
  const innerW = frame.width + 2 * mat;
  const innerH = frame.height + 2 * mat;
  const [outerW, outerH] = framedSize(frame.width, frame.height);
  const b = FRAME_BORDER_WIDTH;
  const onClick = createFrameClickHandler(frame.artworkId, onFrameClick);
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

      {/* Moulding: four bars with depth around the mat */}
      {bars.map((bar, i) => (
        <mesh
          key={i}
          geometry={mouldingGeometry}
          material={borderMaterial}
          position={bar.position}
          scale={bar.scale}
          raycast={noRaycast}
        />
      ))}

      {/* Mat (passe-partout); clicking it opens the artwork too */}
      <mesh
        geometry={planeGeometry}
        material={matMaterial}
        scale={[innerW, innerH, 1]}
        position={[0, 0, MAT_Z]}
        onClick={onClick}
      />

      {/* Textured plane for the artwork (or neutral placeholder) */}
      <mesh
        geometry={planeGeometry}
        material={material ?? placeholderMaterial}
        scale={[frame.width, frame.height, 1]}
        position={[0, 0, ART_Z]}
        onClick={onClick}
      />
    </group>
  );
}

export function Frames({
  frames,
  onFrameClick,
  loader,
  selectedArtworkId,
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
  ]);

  return (
    <group>
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
          loader={activeLoader}
          selectedMaterial={
            frame.artworkId === selectedArtworkId ? selectedMaterial : undefined
          }
        />
      ))}
    </group>
  );
}
