"use client";

// Artwork frames from the SceneModel (plan.md §5.3, §7; architecture §3).
// Draws each frame as a textured plane at position / rotationY, with a shared border.
// Textures load lazily per frame with neutral placeholder until loaded and on error,
// and are disposed when removed or changed. Border raycasting is disabled.

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { SceneFrame } from "@/lib/compile/types";

export const FRAME_BORDER_WIDTH = 0.03;
export const FRAME_BORDER_COLOR = "#1f1f1f";
export const PLACEHOLDER_COLOR = "#e2e2de";

export type TextureLoaderLike = {
  load: (
    url: string,
    onLoad: (texture: THREE.Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) => THREE.Texture | void;
};

export interface FramesProps {
  frames: SceneFrame[];
  onFrameClick?: (artworkId: string) => void;
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
  onFrameClick,
  loader,
}: {
  frame: SceneFrame;
  planeGeometry: THREE.BufferGeometry;
  borderGeometry: THREE.BufferGeometry;
  borderMaterial: THREE.Material;
  placeholderMaterial: THREE.Material;
  onFrameClick?: (artworkId: string) => void;
  loader?: TextureLoaderLike;
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
      roughness: 0.2,
    });
  }, [texture]);

  useEffect(() => {
    return () => {
      material?.dispose();
    };
  }, [material]);

  const borderWidth = frame.width + FRAME_BORDER_WIDTH * 2;
  const borderHeight = frame.height + FRAME_BORDER_WIDTH * 2;

  return (
    <group
      position={frame.position}
      rotation={[0, frame.rotationY, 0]}
      data-artwork-id={frame.artworkId}
    >
      {/* Thin shared frame border behind the artwork plane */}
      <mesh
        geometry={borderGeometry}
        material={borderMaterial}
        scale={[borderWidth, borderHeight, 1]}
        position={[0, 0, -0.001]}
        raycast={noRaycast}
      />

      {/* Textured plane for the artwork (or neutral placeholder) */}
      <mesh
        geometry={planeGeometry}
        material={material ?? placeholderMaterial}
        scale={[frame.width, frame.height, 1]}
        position={[0, 0, 0.001]}
        onClick={createFrameClickHandler(frame.artworkId, onFrameClick)}
      />
    </group>
  );
}

export function Frames({ frames, onFrameClick, loader }: FramesProps) {
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
        roughness: 0.7,
      }),
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
      placeholderMaterial.dispose();
    };
  }, [planeGeometry, borderGeometry, borderMaterial, placeholderMaterial]);

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
          onFrameClick={onFrameClick}
          loader={activeLoader}
        />
      ))}
    </group>
  );
}
