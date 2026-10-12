"use client";

// <Scene model={SceneModel} />: draws a compiled gallery (F5). It reads only the SceneModel prop,
// never the store's gallery (ADR-004). Renders on demand, with pixel density capped at 1 below
// 1024 px wide (plan.md §7, R1). One Suspense boundary per subsystem (R2).

import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { Canvas, type Dpr } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { SceneModel } from "@/lib/compile/types";
import { CameraRig } from "./CameraRig";
import { Ceilings } from "./Ceilings";
import { DoorwayCue } from "./DoorwayCue";
import { InspectCue, type InspectTarget } from "./InspectCue";
import { doorwayKey, otherRoom } from "./tourRoute";
import { detectQuality, isSoftwareGL } from "./materials";
import { PICTURE_LIGHT_POOL } from "./PictureLights";
import { Dust } from "./Dust";
import { Floors } from "./Floors";
import { Frames } from "./Frames";
import { Objects } from "./Objects";
import { lookExtras, resolveLook } from "@/lib/schema/atmosphere";
import { Atmosphere } from "./Atmosphere";
import { Walls } from "./Walls";
import {
  CONTEXT_RESTORE_TIMEOUT_MS,
  GL_OK,
  nextGLHealth,
  SceneFallback,
  ViewerErrorBoundary,
  type GLEvent,
} from "./ViewerErrorBoundary";

export interface SceneProps {
  model: SceneModel;
  /** Navigation mode: "orbit" (editor preview) or "travel" (viewer tour). Defaults to "orbit". */
  mode?: "orbit" | "travel";
  /** Room whose lighting preset and camera spot is used; defaults to the first room. */
  currentRoomId?: string;
  /** Artwork currently focused in travel mode. */
  focusArtworkId?: string;
  /** Object currently focused in travel mode (CameraRig eases to its inspect spot). */
  focusObjectId?: string;
  /** Called when a frame is clicked. */
  onFrameClick?: (artworkId: string) => void;
  /** Called when an object (mesh or plinth) is clicked. */
  onObjectClick?: (objectId: string) => void;
  /** Called when an object is dragged along the room floor. */
  onObjectDrag?: (
    objectId: string,
    newPosition: { x: number; y: number },
  ) => void;
  /** Called when a floor is clicked (Sprint 2: fly to that room). */
  onFloorClick?: (roomId: string) => void;
  /** Editor only: room to highlight in blue (T-071). */
  selectedRoomId?: string;
  /** Editor only: artwork to outline in blue (T-071). */
  selectedArtworkId?: string;
  /** Editor only: object to outline with the accent ring (T-131). */
  selectedObjectId?: string;
  /** Called when a doorway is clicked, with the two rooms it connects (viewer: travel through it). */
  onDoorwayClick?: (roomIds: [string, string]) => void;
  /** Called when travel camera movement starts or finishes (R11). */
  onMovingChange?: (isMoving: boolean) => void;
  /** Optional high-resolution (2048 px) image URLs keyed by artworkId (plan.md §7). */
  largeImages?: Record<string, string>;
  /** Viewer: artworks / objects visitors can open; hovering one shows the "Inspect" cue. */
  inspectableIds?: ReadonlySet<string>;
  /** Viewer: shift the travel framing (canvas fractions) to make room for an overlay panel. */
  viewShift?: { x: number; y: number };
  /** Viewer: room names by id, for the doorway hover label ("Enter East Hall"). */
  roomNames?: Record<string, string>;
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
 * One invisible clickable box per doorway (R10), only when a handler is given. Hovering one shows
 * the doorway cue (light pool, chevrons, "Enter <room>") and a pointer cursor.
 */
function DoorwayTargets({
  doorways,
  currentRoomId,
  roomNames,
  onClick,
}: {
  doorways: SceneModel["doorways"];
  currentRoomId?: string;
  roomNames?: Record<string, string>;
  onClick: (roomIds: [string, string]) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Cues that are still fading out after the pointer left.
  const [fading, setFading] = useState<string[]>([]);

  const setCursor = (pointer: boolean) => {
    if (typeof document !== "undefined")
      document.body.style.cursor = pointer ? "pointer" : "";
  };
  // Never leave a pointer cursor behind.
  useEffect(() => () => setCursor(false), []);

  const leave = (key: string) => {
    setHovered((h) => (h === key ? null : h));
    setFading((f) => (f.includes(key) ? f : [...f, key]));
    setCursor(false);
  };

  return (
    <group>
      {doorways.map((d) => {
        const key = doorwayKey(d);
        const eastWest = d.side === "e" || d.side === "w";
        const size: [number, number, number] = eastWest
          ? [DOORWAY_TARGET_DEPTH, d.height, d.width]
          : [d.width, d.height, DOORWAY_TARGET_DEPTH];
        const from =
          currentRoomId && d.roomIds.includes(currentRoomId)
            ? currentRoomId
            : d.roomIds[0];
        const showCue = hovered === key || fading.includes(key);
        return (
          <group key={key}>
            <mesh
              position={d.center}
              onClick={(e) => {
                e.stopPropagation();
                onClick(d.roomIds);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(key);
                setFading((f) => f.filter((k) => k !== key));
                setCursor(true);
              }}
              onPointerOut={() => leave(key)}
            >
              <boxGeometry args={size} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {showCue ? (
              <DoorwayCue
                doorway={d}
                fromRoomId={from}
                label={roomNames?.[otherRoom(d, from)]}
                active={hovered === key}
                onFaded={() => setFading((f) => f.filter((k) => k !== key))}
              />
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

/**
 * The 3D view behind a crash guard (T-157): a render error or a WebGL context that never comes
 * back shows a Retry card instead of a blank room; a lost context that is restored remounts the
 * canvas once.
 */
export function Scene(props: SceneProps) {
  const [health, dispatch] = useReducer(nextGLHealth, GL_OK);

  // Lost context: give the browser a moment to restore it, then give up and show the fallback.
  useEffect(() => {
    if (health.phase !== "lost") return;
    const t = setTimeout(
      () => dispatch({ type: "timeout", generation: health.generation }),
      CONTEXT_RESTORE_TIMEOUT_MS,
    );
    return () => clearTimeout(t);
  }, [health.phase, health.generation]);

  return (
    <ViewerErrorBoundary
      label="3d-canvas"
      fallback={(reset) => (
        <SceneFallback
          className={props.className}
          onRetry={() => {
            dispatch({ type: "retry" });
            reset();
          }}
        />
      )}
    >
      {health.phase === "failed" ? (
        <SceneFallback
          className={props.className}
          onRetry={() => dispatch({ type: "retry" })}
        />
      ) : (
        <SceneCanvas
          key={health.generation}
          {...props}
          generation={health.generation}
          onGLEvent={dispatch}
        />
      )}
    </ViewerErrorBoundary>
  );
}

function SceneCanvas({
  model,
  mode = "orbit",
  currentRoomId,
  focusArtworkId,
  focusObjectId,
  onFrameClick,
  onObjectClick,
  onObjectDrag,
  onFloorClick,
  onDoorwayClick,
  selectedRoomId,
  selectedArtworkId,
  selectedObjectId,
  onMovingChange,
  largeImages,
  roomNames,
  className,
  viewShift,
  inspectableIds,
  generation,
  onGLEvent,
}: SceneProps & { generation: number; onGLEvent: (e: GLEvent) => void }) {
  const [isDraggingObject, setIsDraggingObject] = useState(false);

  // "Inspect" cue: one at a time; the short grace period stops flicker when the pointer crosses
  // from the mat onto the artwork (out, then over again).
  const [cue, setCue] = useState<{ key: string; target: InspectTarget; active: boolean } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverItem = useCallback(
    (kind: "frame" | "object", id: string | null) => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      if (id && inspectableIds?.has(id)) {
        const target: InspectTarget | null =
          kind === "frame"
            ? (() => {
                const frame = model.frames.find((f) => f.artworkId === id);
                return frame ? { kind: "frame" as const, frame } : null;
              })()
            : (() => {
                const object = model.objects.find((o) => o.objectId === id);
                return object ? { kind: "object" as const, object } : null;
              })();
        if (!target) return;
        if (typeof document !== "undefined") document.body.style.cursor = "pointer";
        setCue({ key: `${kind}:${id}`, target, active: true });
        return;
      }
      leaveTimer.current = setTimeout(() => {
        if (typeof document !== "undefined") document.body.style.cursor = "";
        setCue((c) => (c ? { ...c, active: false } : c));
      }, 60);
    },
    [inspectableIds, model.frames, model.objects],
  );
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      if (typeof document !== "undefined") document.body.style.cursor = "";
    },
    [],
  );
  const onFrameHover = useMemo(
    () => (inspectableIds ? (id: string | null) => hoverItem("frame", id) : undefined),
    [inspectableIds, hoverItem],
  );
  const onObjectHover = useMemo(
    () => (inspectableIds ? (id: string | null) => hoverItem("object", id) : undefined),
    [inspectableIds, hoverItem],
  );
  const dpr = useDpr();
  // Quality tier is decided once per canvas (T-125): the light pool size must never change.
  const [quality] = useState(detectQuality);
  // Software rasterizers (CI/headless SwiftShader) skip the post chain: it costs seconds
  // a frame there. Real GPUs, including phones, keep it.
  const [softwareGL, setSoftwareGL] = useState(false);
  // The post chain waits until onCreated has checked the GL (T-157): mounting it on the very first
  // render put the EffectComposer on software GL for its first, multi-second frames.
  const [glChecked, setGlChecked] = useState(false);
  const { center, span } = useMemo(() => planBounds(model), [model]);

  // Height of the selected room's walls, for the upper highlight outline (T-071).
  const selectedWallTop = useMemo(() => {
    if (!selectedRoomId) return undefined;
    const tops = model.walls
      .filter((w) => w.roomId === selectedRoomId)
      .map((w) => w.top);
    return tops.length ? Math.max(...tops) : undefined;
  }, [model.walls, selectedRoomId]);

  // Dust motes for the current room (look L2): bounds from its floor, height from
  // its walls, look from its preset. Derived data only, like everything in Scene.
  const dust = useMemo(() => {
    const room =
      model.rooms.find((r) => r.roomId === currentRoomId) ?? model.rooms[0];
    if (!room) return null;
    const floor = model.floors.find((f) => f.roomId === room.roomId);
    if (!floor) return null;
    const tops = model.walls
      .filter((w) => w.roomId === room.roomId)
      .map((w) => w.top);
    const extras = lookExtras(resolveLook(room));
    return {
      roomId: room.roomId,
      center: floor.center,
      size: floor.size,
      wallTop: tops.length ? Math.max(...tops) : 3,
      count: extras.dust.count,
      opacity: extras.dust.opacity,
      sizePx: extras.dust.size,
      color: extras.dust.color,
    };
  }, [model, currentRoomId]);
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
      onCreated={({ gl }) => {
        // Khronos PBR Neutral keeps creators' exact wall colors (no hue shift) while rolling off
        // highlights (T-125, look-foundation).
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        if (isSoftwareGL(gl)) setSoftwareGL(true);
        setGlChecked(true);
        // Context loss (T-157): keep the canvas restorable, and let Scene decide whether to
        // remount it or show the fallback.
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onGLEvent({ type: "lost", generation });
        });
        gl.domElement.addEventListener("webglcontextrestored", () => {
          onGLEvent({ type: "restored", generation });
        });
      }}
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
          pictureLightPool={PICTURE_LIGHT_POOL[quality]}
          effects={quality === "high" && glChecked && !softwareGL}
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
        <Ceilings model={model} />
        {onDoorwayClick ? (
          <DoorwayTargets
            doorways={model.doorways}
            currentRoomId={currentRoomId}
            roomNames={roomNames}
            onClick={onDoorwayClick}
          />
        ) : null}
      </Suspense>
      <Suspense fallback={null}>
        <Frames
          frames={framesToRender}
          currentRoomId={currentRoomId}
          onFrameClick={onFrameClick}
          onFrameHover={onFrameHover}
          selectedArtworkId={selectedArtworkId}
        />
      </Suspense>
      {cue && !focusArtworkId && !focusObjectId ? (
        <InspectCue
          key={cue.key}
          target={cue.target}
          active={cue.active}
          onFaded={() => setCue((c) => (c && !c.active ? null : c))}
        />
      ) : null}
      {dust ? (
        <Dust
          roomId={dust.roomId}
          center={dust.center}
          size={dust.size}
          wallTop={dust.wallTop}
          count={quality === "low" ? Math.ceil(dust.count / 2) : dust.count}
          opacity={dust.opacity}
          sizePx={dust.sizePx}
          color={dust.color}
        />
      ) : null}
      {model.objects.length > 0 ? (
        <Suspense fallback={null}>
          <Objects
            objects={model.objects}
            rooms={model.rooms}
            floors={model.floors}
            onObjectClick={onObjectClick}
            onObjectDrag={onObjectDrag}
            onDragStart={() => setIsDraggingObject(true)}
            onDragEnd={() => setIsDraggingObject(false)}
            selectedObjectId={selectedObjectId}
            editor={mode === "orbit"}
            onObjectHover={onObjectHover}
          />
        </Suspense>
      ) : null}
      <CameraRig
        model={model}
        mode={mode}
        currentRoomId={currentRoomId}
        focusArtworkId={focusArtworkId}
        focusObjectId={focusObjectId}
        orbitTarget={center}
        onMovingChange={onMovingChange}
        disabledControls={isDraggingObject}
        viewShift={viewShift}
      />
    </Canvas>
  );
}
