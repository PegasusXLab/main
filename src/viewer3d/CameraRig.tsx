"use client";

// CameraRig: handles "orbit" (editor preview) and "travel" (viewer) modes (plan.md §5.4, ADR-002, R4, R5, R6).
// Targets come strictly from SceneModel:
// - room: room.view (position, target)
// - artwork: ~1.8 m in front of the frame along its normal, at frame center height, looking at it.
// Transitions ease position, target, and fov together over ~1s using ease-in-out cubic,
// starting from the live pose so interruptions never jump. Frame delta is clamped (R6).
// On-demand rendering: requests redraws only while moving.

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { SceneFrame, SceneModel, SceneRoom } from "@/lib/compile/types";
import { clampPitch, LookControls, wrapYaw } from "./LookControls";

export const MAX_FRAME_DELTA = 1 / 15; // ~0.067 s (R6 clamp)
export const TRANSITION_DURATION = 1.0; // ~1 s transition (R4)
export const DEFAULT_CAMERA_FOV = 50;
export const ARTWORK_CAMERA_DISTANCE = 1.8; // 1.8 m in front of frame (ADR-002, T-034 AC 2)
/** Portrait screens keep at least this much horizontal view, so a 6 m wall fits (T-081). */
export const MIN_HORIZONTAL_FOV = 70;
/** Upper bound for the raised vertical fov on very tall screens. */
export const MAX_VERTICAL_FOV = 120;

const DEG = Math.PI / 180;

/**
 * Vertical fov (degrees) to use for a canvas aspect (width / height). Landscape (aspect >= 1)
 * keeps `baseFov` unchanged. Portrait raises the vertical fov until the horizontal fov reaches
 * `minHorizontal`, capped at `maxVertical`.
 */
export function fovForAspect(
  baseFov: number,
  aspect: number,
  minHorizontal = MIN_HORIZONTAL_FOV,
  maxVertical = MAX_VERTICAL_FOV,
): number {
  if (!(aspect > 0) || aspect >= 1) return baseFov;
  const horizontal =
    (2 * Math.atan(Math.tan((baseFov * DEG) / 2) * aspect)) / DEG;
  if (horizontal >= minHorizontal) return baseFov;
  const needed =
    (2 * Math.atan(Math.tan((minHorizontal * DEG) / 2) / aspect)) / DEG;
  return Math.min(Math.max(needed, baseFov), maxVertical);
}

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/** Ease-in-out cubic curve (R4) */
export function easeInOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Computes a camera pose facing an artwork frame from ~1.8 m in front,
 * at the frame's center height, looking directly at the frame center.
 */
export function computeArtworkCameraPose(
  frame: SceneFrame,
  distance = ARTWORK_CAMERA_DISTANCE,
  fov = DEFAULT_CAMERA_FOV,
): CameraPose {
  const [fx, fy, fz] = frame.position;
  // rotationY = 0 faces +z; PI faces -z; PI/2 faces +x; -PI/2 faces -x
  const rawDx = Math.sin(frame.rotationY);
  const rawDz = Math.cos(frame.rotationY);
  const dx = Math.abs(rawDx) < 1e-10 ? 0 : rawDx;
  const dz = Math.abs(rawDz) < 1e-10 ? 0 : rawDz;
  return {
    position: [fx + distance * dx, fy, fz + distance * dz],
    target: [fx, fy, fz],
    fov,
  };
}

/**
 * Computes camera pose for a room view from compile data (SceneRoom.view).
 */
export function computeRoomCameraPose(
  room: SceneRoom,
  fov = DEFAULT_CAMERA_FOV,
): CameraPose {
  return {
    position: [
      room.view.position[0],
      room.view.position[1],
      room.view.position[2],
    ],
    target: [room.view.target[0], room.view.target[1], room.view.target[2]],
    fov,
  };
}

export interface CameraRigProps {
  model: SceneModel;
  mode?: "orbit" | "travel";
  currentRoomId?: string;
  focusArtworkId?: string;
  /** Object inspect takes priority after artwork focus (T-131). */
  focusObjectId?: string;
  orbitTarget?: [number, number, number];
  onMovingChange?: (isMoving: boolean) => void;
  /** Freezes look/orbit input, e.g. while an object is being dragged. */
  disabledControls?: boolean;
}

function TravelCamera({
  targetPose,
  onMovingChange,
  disabledControls = false,
}: {
  targetPose: CameraPose;
  onMovingChange?: (isMoving: boolean) => void;
  disabledControls?: boolean;
}) {
  const getThree = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  // Track live current poses
  const currentPos = useRef(new THREE.Vector3());
  const currentTarget = useRef(new THREE.Vector3());
  const currentFov = useRef(DEFAULT_CAMERA_FOV);

  // Transition animation state
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const startFov = useRef(DEFAULT_CAMERA_FOV);

  const destPos = useRef(new THREE.Vector3(...targetPose.position));
  const destTarget = useRef(new THREE.Vector3(...targetPose.target));
  const destFov = useRef(targetPose.fov);

  const elapsed = useRef(0);
  const isMoving = useRef(false);
  const initialized = useRef(false);
  const lastNotifiedMoving = useRef<boolean | null>(null);

  const onMovingChangeRef = useRef(onMovingChange);
  useEffect(() => {
    onMovingChangeRef.current = onMovingChange;
  }, [onMovingChange]);

  const setMoving = useCallback((moving: boolean) => {
    if (lastNotifiedMoving.current !== moving) {
      lastNotifiedMoving.current = moving;
      onMovingChangeRef.current?.(moving);
    }
    isMoving.current = moving;
  }, []);

  const yawOffset = useRef(0);
  const pitchOffset = useRef(0);

  // Incremental look offset updater
  const handleLookDelta = useCallback(
    (dYaw: number, dPitch: number) => {
      yawOffset.current = wrapYaw(yawOffset.current + dYaw);
      pitchOffset.current = clampPitch(pitchOffset.current + dPitch);

      if (!isMoving.current) {
        // Apply look offset to live camera immediately
        const cam = getThree().camera as THREE.PerspectiveCamera;
        const forward = new THREE.Vector3()
          .subVectors(destTarget.current, destPos.current)
          .normalize();

        const currentDist = destPos.current.distanceTo(destTarget.current) || 1;

        // Apply pitch (around horizontal right axis) and yaw (around Y axis)
        const euler = new THREE.Euler(
          pitchOffset.current,
          yawOffset.current,
          0,
          "YXZ",
        );
        const rotatedDir = forward.clone().applyEuler(euler);

        const lookTarget = currentPos.current
          .clone()
          .addScaledVector(rotatedDir, currentDist);
        cam.lookAt(lookTarget);
      }
    },
    [getThree],
  );

  // Handle target changes: start from the LIVE pose so interruptions never jump
  useEffect(() => {
    // Reset look offset on target room / artwork change
    yawOffset.current = 0;
    pitchOffset.current = 0;

    const cam = getThree().camera as THREE.PerspectiveCamera;
    const newDestPos = new THREE.Vector3(...targetPose.position);
    const newDestTarget = new THREE.Vector3(...targetPose.target);
    const newDestFov = targetPose.fov;

    if (!initialized.current) {
      initialized.current = true;
      cam.position.copy(newDestPos);
      cam.lookAt(newDestTarget);
      cam.fov = newDestFov;
      cam.updateProjectionMatrix();

      currentPos.current.copy(newDestPos);
      currentTarget.current.copy(newDestTarget);
      currentFov.current = newDestFov;

      destPos.current.copy(newDestPos);
      destTarget.current.copy(newDestTarget);
      destFov.current = newDestFov;

      setMoving(false);
      invalidate();
      return;
    }

    // Check if target actually changed
    const posChanged = currentPos.current.distanceTo(newDestPos) > 1e-4;
    const targetChanged =
      currentTarget.current.distanceTo(newDestTarget) > 1e-4;
    const fovChanged = Math.abs(currentFov.current - newDestFov) > 1e-2;

    if (!posChanged && !targetChanged && !fovChanged) {
      return;
    }

    // Start transition from current LIVE pose
    startPos.current.copy(currentPos.current);
    startTarget.current.copy(currentTarget.current);
    startFov.current = currentFov.current;

    destPos.current.copy(newDestPos);
    destTarget.current.copy(newDestTarget);
    destFov.current = newDestFov;

    elapsed.current = 0;
    setMoving(true);
    invalidate();
  }, [targetPose, getThree, invalidate, setMoving]);

  useFrame((state, delta) => {
    if (!isMoving.current) return;

    // Clamped frame delta per R6 (max 1/15s)
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    elapsed.current += dt;

    const progress = Math.min(elapsed.current / TRANSITION_DURATION, 1);
    const alpha = easeInOutCubic(progress);

    currentPos.current.lerpVectors(startPos.current, destPos.current, alpha);
    currentTarget.current.lerpVectors(
      startTarget.current,
      destTarget.current,
      alpha,
    );
    currentFov.current =
      startFov.current + (destFov.current - startFov.current) * alpha;

    const cam = state.camera as THREE.PerspectiveCamera;
    cam.position.copy(currentPos.current);

    if (yawOffset.current !== 0 || pitchOffset.current !== 0) {
      const forward = new THREE.Vector3()
        .subVectors(currentTarget.current, currentPos.current)
        .normalize();
      const currentDist =
        currentPos.current.distanceTo(currentTarget.current) || 1;
      const euler = new THREE.Euler(
        pitchOffset.current,
        yawOffset.current,
        0,
        "YXZ",
      );
      const rotatedDir = forward.clone().applyEuler(euler);
      const lookTarget = currentPos.current
        .clone()
        .addScaledVector(rotatedDir, currentDist);
      cam.lookAt(lookTarget);
    } else {
      cam.lookAt(currentTarget.current);
    }

    cam.fov = currentFov.current;
    cam.updateProjectionMatrix();

    if (progress >= 1) {
      setMoving(false);
    } else {
      state.invalidate(); // on-demand rendering: request next redraw while moving
    }
  });

  return (
    <LookControls enabled={!disabledControls} onLookDelta={handleLookDelta} />
  );
}

/** Camera height above the plan for the Top-down start, relative to the plan's largest side. */
export const TOP_DOWN_HEIGHT = 1.1;
/** Small tilt toward the viewer so walls read as walls, not lines. */
export const TOP_DOWN_TILT = 0.3;

/** Where the Top-down camera starts: over the plan's center, slightly to the south (pure). */
export function topDownStartPosition(
  floors: SceneModel["floors"],
  target: [number, number, number],
): [number, number, number] {
  let span = 6;
  if (floors.length) {
    const xs = floors.flatMap((f) => [
      f.center[0] - f.size[0] / 2,
      f.center[0] + f.size[0] / 2,
    ]);
    const zs = floors.flatMap((f) => [
      f.center[2] - f.size[1] / 2,
      f.center[2] + f.size[1] / 2,
    ]);
    span = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...zs) - Math.min(...zs),
      6,
    );
  }
  return [target[0], span * TOP_DOWN_HEIGHT, target[2] + span * TOP_DOWN_TILT];
}

/** Moves the camera to the Top-down start once when the orbit view mounts. */
function TopDownStart({
  model,
  target,
}: {
  model: SceneModel;
  target: [number, number, number];
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.position.set(...topDownStartPosition(model.floors, target));
    camera.lookAt(...target);
    invalidate();
    // Only on mount: after that the user orbits freely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function CameraRig({
  model,
  mode = "orbit",
  currentRoomId,
  focusArtworkId,
  focusObjectId,
  orbitTarget = [0, 0, 0],
  onMovingChange,
  disabledControls = false,
}: CameraRigProps) {
  // Portrait phones need a wider view (T-081); recomputed when the canvas rotates or resizes.
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const fov = fovForAspect(DEFAULT_CAMERA_FOV, height > 0 ? width / height : 1);

  // Compute target pose from SceneModel only
  const targetPose = useMemo<CameraPose>(() => {
    // 1. Artwork focus takes priority if requested
    if (focusArtworkId) {
      const frame = model.frames.find((f) => f.artworkId === focusArtworkId);
      if (frame) {
        return computeArtworkCameraPose(frame, ARTWORK_CAMERA_DISTANCE, fov);
      }
    }

    // 2. Object inspect: the compile already computed the spot (T-131).
    if (focusObjectId) {
      const obj = model.objects.find((o) => o.objectId === focusObjectId);
      if (obj) {
        return {
          position: [...obj.view.position] as [number, number, number],
          target: [...obj.view.target] as [number, number, number],
          fov,
        };
      }
    }

    // 2. Room view target
    const targetRoom =
      model.rooms.find((r) => r.roomId === currentRoomId) ?? model.rooms[0];

    if (targetRoom) {
      return computeRoomCameraPose(targetRoom, fov);
    }

    // Fallback if no rooms exist
    return {
      position: [orbitTarget[0], 5, orbitTarget[2] + 5],
      target: orbitTarget,
      fov,
    };
  }, [
    model.frames,
    model.objects,
    model.rooms,
    currentRoomId,
    focusArtworkId,
    focusObjectId,
    orbitTarget,
    fov,
  ]);

  if (mode === "travel") {
    return (
      <TravelCamera
        targetPose={targetPose}
        onMovingChange={onMovingChange}
        disabledControls={disabledControls}
      />
    );
  }

  // Default "orbit" mode for editor preview (Top-down, T-124): starts from above.
  return (
    <>
      <TopDownStart model={model} target={orbitTarget} />
      <OrbitControls
        makeDefault
        target={orbitTarget}
        enableDamping={false}
        enabled={!disabledControls}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2}
        maxDistance={80}
      />
    </>
  );
}
