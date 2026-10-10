"use client";

// <Scene model={SceneModel} />: draws a compiled gallery (F5). It reads only the SceneModel prop,
// never the store's gallery (ADR-004). Renders on demand, with pixel density capped at 1 below
// 1024 px wide (plan.md §7, R1). One Suspense boundary per subsystem (R2).

import { Suspense, useMemo, useSyncExternalStore } from "react";
import { Canvas, type Dpr } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { SceneModel } from "@/lib/compile/types";
import { CameraRig } from "./CameraRig";
import { Floors } from "./Floors";
import { Frames } from "./Frames";
import { Atmosphere } from "./Atmosphere";
import { Walls } from "./Walls";

export interface SceneProps {
  model: SceneModel;
  /** Navigation mode: "orbit" (editor preview) or "travel" (viewer tour). Defaults to "orbit". */
  mode?: "orbit" | "travel";
  /** Room whose lighting preset and camera spot is used; defaults to the first room. */
  currentRoomId?: string;
  /** Artwork currently focused in travel mode. */
  focusArtworkId?: string;
  /** Called when a frame is clicked. */
  onFrameClick?: (artworkId: string) => void;
  /** Called when a floor is clicked (Sprint 2: fly to that room). */
  onFloorClick?: (roomId: string) => void;
  /** Editor only: room to highlight in blue (T-071). */
  selectedRoomId?: string;
  /** Editor only: artwork to outline in blue (T-071). */
  selectedArtworkId?: string;
  /** Called when a doorway is clicked, with the two rooms it connects (viewer: travel through it). */
  onDoorwayClick?: (roomIds: [string, string]) => void;
  /** Called when travel camera movement starts or finishes (R11). */
  onMovingChange?: (isMoving: boolean) => void;
  /** Optional high-resolution (2048 px) image URLs keyed by artworkId (plan.md §7). */
  largeImages?: Record<string, string>;
  className?: string;
}

const SMALL_SCREEN = 1024;

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/** 1 below 1024 px wide, 1–2 above (R1). */
function useDpr(): Dpr {
  const small = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth < SMALL_SCREEN,
    () => true,
  );
  return small ? 1 : [1, 2];
}

/** Center and size of everything on the floor plan, for the default camera. */
function planBounds(model: SceneModel) {
  if (model.floors.length === 0)
    return { center: [0, 0, 0] as [number, number, number], span: 10 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const f of model.floors) {
    minX = Math.min(minX, f.center[0] - f.size[0] / 2);
    maxX = Math.max(maxX, f.center[0] + f.size[0] / 2);
    minZ = Math.min(minZ, f.center[2] - f.size[1] / 2);
    maxZ = Math.max(maxZ, f.center[2] + f.size[1] / 2);
  }
  return {
    center: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2] as [
      number,
      number,
      number,
    ],
    span: Math.max(maxX - minX, maxZ - minZ, 6),
  };
}

/**
 * Orbit camera for the editor preview: drag to orbit, scroll to zoom.
 * Kept separate so a CameraRig (click-to-travel, ADR-002) can replace it.
 */
export function OrbitCamera({ target }: { target: [number, number, number] }) {
  return (
    <OrbitControls
      makeDefault
      target={target}
      enableDamping={false} // damping needs a continuous frame loop; we render on demand
      maxPolarAngle={Math.PI / 2 - 0.05} // never go under the floor
      minDistance={2}
      maxDistance={80}
    />
  );
}

const DOORWAY_TARGET_DEPTH = 0.4; // meters across the opening, so it's easy to hit

/**
 * One invisible clickable box per doorway (R10), only when a handler is given. It renders nothing
 * visible and shares one material.
 */
function DoorwayTargets({
  doorways,
  onClick,
}: {
  doorways: SceneModel["doorways"];
  onClick: (roomIds: [string, string]) => void;
}) {
  return (
    <group>
      {doorways.map((d) => {
        const eastWest = d.side === "e" || d.side === "w";
        const size: [number, number, number] = eastWest
          ? [DOORWAY_TARGET_DEPTH, d.height, d.width]
          : [d.width, d.height, DOORWAY_TARGET_DEPTH];
        return (
          <mesh
            key={d.roomIds.join("|")}
            position={d.center}
            onClick={(e) => {
              e.stopPropagation();
              onClick(d.roomIds);
            }}
          >
            <boxGeometry args={size} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Scene({
  model,
  mode = "orbit",
  currentRoomId,
  focusArtworkId,
  onFrameClick,
  onFloorClick,
  onDoorwayClick,
  selectedRoomId,
  selectedArtworkId,
  onMovingChange,
  largeImages,
  className,
}: SceneProps) {
  const dpr = useDpr();
  const { center, span } = useMemo(() => planBounds(model), [model]);

  // Height of the selected room's walls, for the upper highlight outline (T-071).
  const selectedWallTop = useMemo(() => {
    if (!selectedRoomId) return undefined;
    const tops = model.walls
      .filter((w) => w.roomId === selectedRoomId)
      .map((w) => w.top);
    return tops.length ? Math.max(...tops) : undefined;
  }, [model.walls, selectedRoomId]);

  // When an artwork is focused, swap its frame to the 2048 px image if one exists (plan.md §7)
  const framesToRender = useMemo(() => {
    if (!focusArtworkId) return model.frames;
    return model.frames.map((frame) => {
      if (frame.artworkId !== focusArtworkId) return frame;
      const large =
        largeImages?.[frame.artworkId] ??
        (frame as { largeImageUrl?: string }).largeImageUrl;
      if (!large || large === frame.imageUrl) return frame;
      return { ...frame, imageUrl: large };
    });
  }, [model.frames, focusArtworkId, largeImages]);

  return (
    <Canvas
      className={className}
      frameloop="demand"
      dpr={dpr}
      gl={{ antialias: false }}
      camera={{
        fov: 50,
        near: 0.1,
        far: 500,
        position: [center[0], span * 0.9, center[2] + span * 0.9],
      }}
    >
      <Suspense fallback={null}>
        <Atmosphere
          model={model}
          currentRoomId={currentRoomId}
          target={center}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Floors
          floors={model.floors}
          onFloorClick={onFloorClick}
          selectedRoomId={selectedRoomId}
          selectedWallTop={selectedWallTop}
        />
        <Walls walls={model.walls} />
        {onDoorwayClick ? (
          <DoorwayTargets doorways={model.doorways} onClick={onDoorwayClick} />
        ) : null}
      </Suspense>
      <Suspense fallback={null}>
        <Frames
          frames={framesToRender}
          onFrameClick={onFrameClick}
          selectedArtworkId={selectedArtworkId}
        />
      </Suspense>
      <CameraRig
        model={model}
        mode={mode}
        currentRoomId={currentRoomId}
        focusArtworkId={focusArtworkId}
        orbitTarget={center}
        onMovingChange={onMovingChange}
      />
    </Canvas>
  );
}
