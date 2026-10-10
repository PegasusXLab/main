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
  orbitTarget?: [number, number, number];
  onMovingChange?: (isMoving: boolean) => void;
}

function TravelCamera({
  targetPose,
  onMovingChange,
}: {
  targetPose: CameraPose;
  onMovingChange?: (isMoving: boolean) => void;
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

  return <LookControls enabled onLookDelta={handleLookDelta} />;
}

export function CameraRig({
  model,
  mode = "orbit",
  currentRoomId,
  focusArtworkId,
  orbitTarget = [0, 0, 0],
  onMovingChange,
}: CameraRigProps) {
  // Compute target pose from SceneModel only
  const targetPose = useMemo<CameraPose>(() => {
    // 1. Artwork focus takes priority if requested
    if (focusArtworkId) {
      const frame = model.frames.find((f) => f.artworkId === focusArtworkId);
      if (frame) {
        return computeArtworkCameraPose(frame);
      }
    }

    // 2. Room view target
    const targetRoom =
      model.rooms.find((r) => r.roomId === currentRoomId) ?? model.rooms[0];

    if (targetRoom) {
      return computeRoomCameraPose(targetRoom);
    }

    // Fallback if no rooms exist
    return {
      position: [orbitTarget[0], 5, orbitTarget[2] + 5],
      target: orbitTarget,
      fov: DEFAULT_CAMERA_FOV,
    };
  }, [model.frames, model.rooms, currentRoomId, focusArtworkId, orbitTarget]);

  if (mode === "travel") {
    return (
      <TravelCamera targetPose={targetPose} onMovingChange={onMovingChange} />
    );
  }

  // Default "orbit" mode for editor preview
  return (
    <OrbitControls
      makeDefault
      target={orbitTarget}
      enableDamping={false}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={2}
      maxDistance={80}
    />
  );
}
