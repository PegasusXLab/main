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
import type { SceneFrame, SceneModel, SceneRoom, Vec3 } from "@/lib/compile/types";
import {
  clampPitch,
  LookControls,
  shortestAngleDist,
  wrapYaw,
} from "./LookControls";
import {
  angleDelta,
  arrivalPose,
  directionOf,
  doorwayKey,
  doorwayRoute,
  lerpAngle,
  otherRoom,
  pitchOf,
  roomAt,
  routeWaypoints,
  smoothstep,
  walkDuration,
  yawOf,
} from "./tourRoute";
import { slide, walkMap } from "./walkable";

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
  /** Pause look/orbit input, e.g. while an object is dragged across the floor. */
  disabledControls?: boolean;
  /**
   * Travel only: shift the framing (fractions of the canvas) so the subject sits beside an
   * overlay, e.g. { x: 0.18 } moves it left while the inspection panel covers the right.
   */
  viewShift?: { x: number; y: number };
  /** Travel only: the visitor walked (W/A/S/D) into another room (ADR-018). Fires on change only. */
  onStandingRoomChange?: (roomId: string) => void;
  /** Travel only: the visitor started walking with the keys (e.g. to close an open plaque). */
  onFreeMoveStart?: () => void;
}

/** Free movement (ADR-018): walking pace with W/A/S/D (m/s)... */
export const FREE_WALK_SPEED = 1.6;
/** ...and how quickly it starts and stops (seconds, exponential time constant). */
export const FREE_WALK_EASE = 0.12;
/** Keys that walk (physical positions, so ZQSD on AZERTY keyboards works too). */
const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);

/** True while typing somewhere, so W/A/S/D go to the field, not the camera. */
function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

/** Angular exponential spring damping rate (rad/s) for silky look-around smoothing */
export const LOOK_DAMPING = 16.0;
/** Friction decay rate for inertia momentum coasting after pointer release */
export const LOOK_INERTIA_FRICTION = 7.0;
/** Maximum angular velocity (rad/s) to avoid disorientation on high-DPI swipes */
export const MAX_LOOK_VELOCITY = 6.0;

/** Mouse sway: the view drifts this far (radians) toward the pointer when not dragging. */
export const SWAY_YAW = 0.045;
export const SWAY_PITCH = 0.028;
/** How quickly the sway follows the pointer (1/s); low = floaty. */
export const SWAY_DAMPING = 2.6;
/** Combined pitch (heading + look + sway) never tips past this (radians, ~77°). */
const MAX_VIEW_PITCH = 1.35;
/** Waypoints closer than this to the previous one are dropped (no kinks at the start). */
const MIN_WAYPOINT_GAP = 0.3;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The visitor's camera (travel mode). It stands at a position and faces a heading (yaw/pitch);
 * drag-look and mouse sway are offsets on top of the heading, so looking up/down never rolls.
 * Changing room walks a smooth curve through every doorway on the way, facing where it walks,
 * and arrives a step into the new room facing straight in. Artwork/object focus glides there.
 */
function TravelCamera({
  model,
  targetPose,
  destRoomId,
  focused,
  onMovingChange,
  disabledControls = false,
  viewShift,
  onStandingRoomChange,
  onFreeMoveStart,
}: {
  viewShift?: { x: number; y: number };
  onStandingRoomChange?: (roomId: string) => void;
  onFreeMoveStart?: () => void;
  model: SceneModel;
  targetPose: CameraPose;
  /** Room the destination is in (the current room, or the focused artwork's/object's room). */
  destRoomId?: string;
  /** True while an artwork/object is focused (the destination is its inspect spot). */
  focused: boolean;
  onMovingChange?: (isMoving: boolean) => void;
  disabledControls?: boolean;
}) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  // Standing pose: position + heading.
  const pos = useRef(new THREE.Vector3(...targetPose.position));
  const yaw = useRef(0);
  const pitch = useRef(0);
  const fov = useRef(targetPose.fov);

  // Current walk / glide.
  const curve = useRef<THREE.Curve<THREE.Vector3> | null>(null);
  const duration = useRef(TRANSITION_DURATION);
  const walking = useRef(false);
  const startYaw = useRef(0);
  const startPitch = useRef(0);
  const startFov = useRef(targetPose.fov);
  const endYaw = useRef(0);
  const endPitch = useRef(0);
  const endFov = useRef(targetPose.fov);
  const elapsed = useRef(0);
  const isMoving = useRef(false);
  const initialized = useRef(false);
  const lastNotifiedMoving = useRef<boolean | null>(null);

  // Which room the camera stands in, and the doorway each room was last entered through.
  const standingRoom = useRef<string | undefined>(destRoomId);
  const enteredVia = useRef(new Map<string, string>());

  const onMovingChangeRef = useRef(onMovingChange);
  const onStandingRoomChangeRef = useRef(onStandingRoomChange);
  const onFreeMoveStartRef = useRef(onFreeMoveStart);
  useEffect(() => {
    onMovingChangeRef.current = onMovingChange;
    onStandingRoomChangeRef.current = onStandingRoomChange;
    onFreeMoveStartRef.current = onFreeMoveStart;
  }, [onMovingChange, onStandingRoomChange, onFreeMoveStart]);

  // Free movement (ADR-018). Once the visitor walks with the keys, the camera stays where they
  // put it: a room change they walked into doesn't send them to the room's arrival spot, and
  // closing a plaque returns them to where they stood before opening it.
  const walkable = useMemo(() => walkMap(model), [model]);
  const keys = useRef(new Set<string>());
  const freeVel = useRef(new THREE.Vector2());
  const freeRoam = useRef(false);
  const wasPressing = useRef(false);
  const beforeFocus = useRef<{ position: Vec3; target: Vec3 } | null>(null);

  const setMoving = useCallback((moving: boolean) => {
    if (lastNotifiedMoving.current !== moving) {
      lastNotifiedMoving.current = moving;
      onMovingChangeRef.current?.(moving);
    }
    isMoving.current = moving;
  }, []);

  // Drag-look offsets (with inertia), relative to the heading.
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);
  const currentYaw = useRef(0);
  const currentPitch = useRef(0);
  const velocityYaw = useRef(0);
  const velocityPitch = useRef(0);
  const isDragging = useRef(false);
  const lastDeltaTime = useRef(0);

  // Mouse sway offsets.
  const swayTargetYaw = useRef(0);
  const swayTargetPitch = useRef(0);
  const swayYaw = useRef(0);
  const swayPitch = useRef(0);
  // Framing shift (inspection panel), eased.
  const shiftX = useRef(0);
  const shiftY = useRef(0);

  // Incremental look offset updater with velocity tracking
  const handleLookDelta = useCallback(
    (dYaw: number, dPitch: number) => {
      const now = performance.now();
      const dt =
        lastDeltaTime.current > 0
          ? Math.max((now - lastDeltaTime.current) / 1000, 0.005)
          : 0.016;
      lastDeltaTime.current = now;

      targetYaw.current = wrapYaw(targetYaw.current + dYaw);
      targetPitch.current = clampPitch(targetPitch.current + dPitch);

      // Smooth instantaneous velocity tracking (exponential moving average)
      const instVelYaw = dYaw / dt;
      const instVelPitch = dPitch / dt;
      const blend = 0.5;
      velocityYaw.current = Math.max(
        -MAX_LOOK_VELOCITY,
        Math.min(
          MAX_LOOK_VELOCITY,
          velocityYaw.current * (1 - blend) + instVelYaw * blend,
        ),
      );
      velocityPitch.current = Math.max(
        -MAX_LOOK_VELOCITY,
        Math.min(
          MAX_LOOK_VELOCITY,
          velocityPitch.current * (1 - blend) + instVelPitch * blend,
        ),
      );

      invalidate();
    },
    [invalidate],
  );

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    lastDeltaTime.current = performance.now();
    velocityYaw.current = 0;
    velocityPitch.current = 0;
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    invalidate();
  }, [invalidate]);

  // An object drag paused look input: drop any look velocity so the view doesn't coast.
  useEffect(() => {
    if (!disabledControls) return;
    velocityYaw.current = 0;
    velocityPitch.current = 0;
  }, [disabledControls]);

  // Mouse sway: the view leans a few degrees toward the pointer while it hovers (mouse only).
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const dom = gl.domElement;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.buttons !== 0) return;
      const rect = dom.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      swayTargetYaw.current = -nx * SWAY_YAW;
      swayTargetPitch.current = -ny * SWAY_PITCH;
      invalidate();
    };
    const onLeave = () => {
      swayTargetYaw.current = 0;
      swayTargetPitch.current = 0;
      invalidate();
    };
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerleave", onLeave);
    return () => {
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerleave", onLeave);
    };
  }, [gl, invalidate]);

  // W/A/S/D: held keys, ignored while typing or with a modifier; cleared when the page loses focus.
  useEffect(() => {
    const held = keys.current;
    const onDown = (e: KeyboardEvent) => {
      if (!MOVE_KEYS.has(e.code) || isTextInput(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      held.add(e.code);
      invalidate();
    };
    const onUp = (e: KeyboardEvent) => {
      held.delete(e.code);
    };
    const clear = () => held.clear();
    const onVisibility = () => {
      if (document.hidden) held.clear(); // a key released in another tab never reaches us
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVisibility);
      held.clear();
    };
  }, [invalidate]);

  // New destination: plan the walk from the LIVE pose so interruptions never jump.
  useEffect(() => {
    const { floors, doorways } = model;

    // Where to end up. Entering a room through a doorway stops a step past it, facing in, and
    // that's where the visitor returns after closing a plaque in that room.
    let final: { position: Vec3; target: Vec3 } = targetPose;
    const fromRoom =
      roomAt(floors, pos.current.x, pos.current.z) ?? standingRoom.current ?? destRoomId;
    const route =
      initialized.current && fromRoom && destRoomId
        ? doorwayRoute(doorways, fromRoom, destRoomId)
        : [];
    if (destRoomId && !focused) {
      if (route && route.length) {
        const last = route[route.length - 1];
        enteredVia.current.set(destRoomId, doorwayKey(last));
        final = arrivalPose(last, otherRoom(last, destRoomId), floors);
      } else if (route) {
        const key = enteredVia.current.get(destRoomId);
        const door = key ? doorways.find((d) => doorwayKey(d) === key) : undefined;
        if (door) final = arrivalPose(door, otherRoom(door, destRoomId), floors);
      } else {
        enteredVia.current.delete(destRoomId);
      }
    }
    if (destRoomId) standingRoom.current = destRoomId;

    if (initialized.current && freeRoam.current) {
      const liveRoom = roomAt(floors, pos.current.x, pos.current.z);
      if (focused && !beforeFocus.current) {
        // Opening a plaque: remember where the visitor stood, to come back after.
        const [dx, dy, dz] = directionOf(yaw.current + currentYaw.current, pitch.current + currentPitch.current);
        const p = pos.current;
        beforeFocus.current = { position: [p.x, p.y, p.z], target: [p.x + dx, p.y + dy, p.z + dz] };
      } else if (!focused && destRoomId && destRoomId === liveRoom) {
        // They walked into this room themselves, or closed a plaque: stay, or step back.
        if (!beforeFocus.current) {
          fov.current = targetPose.fov; // still follow a resize
          invalidate();
          return;
        }
        final = beforeFocus.current;
        beforeFocus.current = null;
      } else if (!focused) {
        // Tour nav / minimap to another room: back to guided travel.
        freeRoam.current = false;
        beforeFocus.current = null;
      }
    }

    const finalPos = new THREE.Vector3(...final.position);
    const fYaw = yawOf(final.target[0] - final.position[0], final.target[2] - final.position[2]);
    const fPitch = pitchOf(final.position, final.target);

    if (!initialized.current) {
      initialized.current = true;
      pos.current.copy(finalPos);
      yaw.current = fYaw;
      pitch.current = fPitch;
      fov.current = targetPose.fov;
      setMoving(false);
      invalidate();
      return;
    }

    const posChanged = pos.current.distanceTo(finalPos) > 1e-3;
    const headingChanged =
      Math.abs(angleDelta(yaw.current + currentYaw.current, fYaw)) > 1e-3 ||
      Math.abs(pitch.current + currentPitch.current - fPitch) > 1e-3;
    const fovChanged = Math.abs(fov.current - targetPose.fov) > 1e-2;
    if (!posChanged && !headingChanged && !fovChanged) return;

    // Path: live position → line up / step through each doorway → destination.
    const points = [pos.current.clone()];
    for (const p of routeWaypoints(route ?? [], fromRoom ?? "")) {
      const v = new THREE.Vector3(...p);
      if (v.distanceTo(points[points.length - 1]) > MIN_WAYPOINT_GAP) points.push(v);
    }
    if (finalPos.distanceTo(points[points.length - 1]) > MIN_WAYPOINT_GAP || points.length === 1)
      points.push(finalPos);
    else points[points.length - 1] = finalPos;
    curve.current =
      points.length > 2
        ? new THREE.CatmullRomCurve3(points, false, "centripetal")
        : new THREE.LineCurve3(points[0], points[points.length - 1]);

    walking.current = Boolean(route && route.length);
    const length = curve.current.getLength();
    duration.current = walking.current ? walkDuration(length) : TRANSITION_DURATION;
    if (prefersReducedMotion()) duration.current = Math.min(duration.current, 0.45);

    // Fold the drag-look into the heading so starting a walk never snaps the view.
    startYaw.current = wrapYaw(yaw.current + currentYaw.current);
    startPitch.current = pitch.current + currentPitch.current;
    targetYaw.current = 0;
    targetPitch.current = 0;
    currentYaw.current = 0;
    currentPitch.current = 0;
    velocityYaw.current = 0;
    velocityPitch.current = 0;
    yaw.current = startYaw.current;
    pitch.current = startPitch.current;

    startFov.current = fov.current;
    endYaw.current = fYaw;
    endPitch.current = fPitch;
    endFov.current = targetPose.fov;
    elapsed.current = 0;
    setMoving(true);
    invalidate();
  }, [model, targetPose, destRoomId, focused, invalidate, setMoving]);

  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    // Clamped frame delta per R6 (max 1/15s)
    const dt = Math.min(delta, MAX_FRAME_DELTA);

    // 1. Inertia momentum coasting when pointer is released
    if (!isDragging.current) {
      if (Math.abs(velocityYaw.current) > 1e-4) {
        targetYaw.current = wrapYaw(
          targetYaw.current + velocityYaw.current * dt,
        );
        velocityYaw.current *= Math.exp(-LOOK_INERTIA_FRICTION * dt);
        if (Math.abs(velocityYaw.current) < 1e-4) velocityYaw.current = 0;
      }
      if (Math.abs(velocityPitch.current) > 1e-4) {
        targetPitch.current = clampPitch(
          targetPitch.current + velocityPitch.current * dt,
        );
        velocityPitch.current *= Math.exp(-LOOK_INERTIA_FRICTION * dt);
        if (Math.abs(velocityPitch.current) < 1e-4) velocityPitch.current = 0;
      }
    }

    // 2. Exponential spring damping towards target angles
    const damp = 1 - Math.exp(-LOOK_DAMPING * dt);
    const diffYaw = shortestAngleDist(currentYaw.current, targetYaw.current);
    const diffPitch = targetPitch.current - currentPitch.current;
    currentYaw.current = wrapYaw(currentYaw.current + diffYaw * damp);
    currentPitch.current = clampPitch(currentPitch.current + diffPitch * damp);

    // 3. Mouse sway follows the pointer slowly.
    const swayDamp = 1 - Math.exp(-SWAY_DAMPING * dt);
    const dSwayYaw = swayTargetYaw.current - swayYaw.current;
    const dSwayPitch = swayTargetPitch.current - swayPitch.current;
    swayYaw.current += dSwayYaw * swayDamp;
    swayPitch.current += dSwayPitch * swayDamp;

    // 4. Walk / glide along the planned curve.
    if (isMoving.current && curve.current) {
      elapsed.current += dt;
      const progress = Math.min(elapsed.current / duration.current, 1);
      const a = easeInOutCubic(progress);
      curve.current.getPointAt(a, pos.current);
      if (walking.current) {
        // Face where you walk; turn toward the arrival heading over the last stretch.
        curve.current.getTangentAt(Math.min(a, 0.999), tangent);
        const walkYaw = yawOf(tangent.x, tangent.z);
        const w1 = smoothstep(0, 0.22, a);
        const w2 = smoothstep(0.72, 1, a);
        yaw.current = lerpAngle(lerpAngle(startYaw.current, walkYaw, w1), endYaw.current, w2);
        const walkPitch = startPitch.current * (1 - w1);
        pitch.current = walkPitch + (endPitch.current - walkPitch) * w2;
      } else {
        yaw.current = lerpAngle(startYaw.current, endYaw.current, a);
        pitch.current = startPitch.current + (endPitch.current - startPitch.current) * a;
      }
      fov.current = startFov.current + (endFov.current - startFov.current) * a;
      if (progress >= 1) {
        yaw.current = endYaw.current;
        pitch.current = endPitch.current;
        setMoving(false);
      }
    }

    // 4b. Free movement (W/A/S/D, ADR-018): ease toward walking pace along the view, sliding along
    // walls and around furniture; leave a room only through a doorway.
    const held = keys.current;
    const ix = (held.has("KeyD") ? 1 : 0) - (held.has("KeyA") ? 1 : 0);
    const iz = (held.has("KeyW") ? 1 : 0) - (held.has("KeyS") ? 1 : 0);
    const pressing = !disabledControls && (ix !== 0 || iz !== 0);
    if (pressing && !wasPressing.current) {
      if (isMoving.current) {
        // Take over from a scripted walk or glide right where it is.
        curve.current = null;
        setMoving(false);
      }
      freeRoam.current = true;
      // Walking away from an open plaque closes it and walks on from here (no glide back).
      beforeFocus.current = null;
      onFreeMoveStartRef.current?.();
    }
    wasPressing.current = pressing;
    let wantX = 0;
    let wantZ = 0;
    if (pressing && !isMoving.current) {
      const heading = yaw.current + currentYaw.current;
      const s = Math.sin(heading);
      const c = Math.cos(heading);
      // forward = (-sin, -cos), right = (cos, -sin) for this yaw convention (yawOf).
      wantX = -s * iz + c * ix;
      wantZ = -c * iz - s * ix;
      const n = Math.hypot(wantX, wantZ);
      wantX = (wantX / n) * FREE_WALK_SPEED;
      wantZ = (wantZ / n) * FREE_WALK_SPEED;
    }
    const vel = freeVel.current;
    const ease = 1 - Math.exp(-dt / FREE_WALK_EASE);
    vel.x += (wantX - vel.x) * ease;
    vel.y += (wantZ - vel.y) * ease;
    const freeMoving = Math.abs(vel.x) + Math.abs(vel.y) > 1e-3;
    if (freeMoving) {
      const [nx, nz] = slide(walkable, pos.current.x, pos.current.z, pos.current.x + vel.x * dt, pos.current.z + vel.y * dt);
      // Don't let speed build up against whatever blocked an axis.
      if (nx === pos.current.x) vel.x = 0;
      if (nz === pos.current.z) vel.y = 0;
      pos.current.x = nx;
      pos.current.z = nz;
      const room = roomAt(model.floors, nx, nz);
      if (room && room !== standingRoom.current) {
        standingRoom.current = room;
        onStandingRoomChangeRef.current?.(room);
      }
    } else {
      vel.set(0, 0);
    }

    // 5. Camera pose: heading + drag-look + sway, built from angles (no roll).
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.position.copy(pos.current);
    const viewPitch = Math.max(
      -MAX_VIEW_PITCH,
      Math.min(MAX_VIEW_PITCH, pitch.current + currentPitch.current + swayPitch.current),
    );
    const [dx, dy, dz] = directionOf(
      yaw.current + currentYaw.current + swayYaw.current,
      viewPitch,
    );
    lookAt.set(pos.current.x + dx, pos.current.y + dy, pos.current.z + dz);
    cam.lookAt(lookAt);
    if (cam.fov !== fov.current) {
      cam.fov = fov.current;
      cam.updateProjectionMatrix();
    }

    // 5b. Framing shift: ease toward the target and apply as a view offset (no scene change).
    const shiftDamp = 1 - Math.exp(-6 * dt);
    const tx = viewShift?.x ?? 0;
    const ty = viewShift?.y ?? 0;
    const dShiftX = tx - shiftX.current;
    const dShiftY = ty - shiftY.current;
    shiftX.current += dShiftX * shiftDamp;
    shiftY.current += dShiftY * shiftDamp;
    const w = state.size.width;
    const h = state.size.height;
    if (Math.abs(shiftX.current) > 1e-4 || Math.abs(shiftY.current) > 1e-4) {
      cam.setViewOffset(w, h, shiftX.current * w, shiftY.current * h, w, h);
    } else if (cam.view?.enabled) {
      cam.clearViewOffset();
    }

    // 6. On-demand rendering: keep drawing while anything is still settling.
    const isLooking =
      Math.abs(diffYaw) > 1e-4 ||
      Math.abs(diffPitch) > 1e-4 ||
      Math.abs(velocityYaw.current) > 1e-4 ||
      Math.abs(velocityPitch.current) > 1e-4;
    const isSwaying = Math.abs(dSwayYaw) > 1e-4 || Math.abs(dSwayPitch) > 1e-4;
    const isShifting = Math.abs(dShiftX) > 1e-4 || Math.abs(dShiftY) > 1e-4;
    if (isMoving.current || isLooking || isSwaying || isShifting || isDragging.current || pressing || freeMoving) {
      state.invalidate();
    }
  });

  return (
    <LookControls
      enabled={!disabledControls}
      onLookDelta={handleLookDelta}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    />
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
  /** Canvas width / height. Narrow panes (split view, previews) back off so the plan fits. */
  aspect = 16 / 9,
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
  const backOff = aspect > 0 && aspect < 1.4 ? 1.4 / aspect : 1;
  return [
    target[0],
    span * TOP_DOWN_HEIGHT * backOff,
    target[2] + span * TOP_DOWN_TILT * backOff,
  ];
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
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.height > 0 ? size.width / size.height : 16 / 9;
    camera.position.set(...topDownStartPosition(model.floors, target, aspect));
    camera.lookAt(...target);
    invalidate();
    // Only on mount: after that the user orbits freely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/**
 * Editor orbit: when the plan's center moves (a room is added, moved or resized), carry the
 * camera along by the same amount, so the view pans with the plan instead of swinging toward the
 * new center. Keeps the visitor's angle and zoom.
 */
function FollowTarget({ target }: { target: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const [x, y, z] = target;
  const prev = useRef<[number, number, number]>([x, y, z]);
  useEffect(() => {
    const [px, py, pz] = prev.current;
    prev.current = [x, y, z];
    if (px === x && py === y && pz === z) return;
    camera.position.set(camera.position.x + x - px, camera.position.y + y - py, camera.position.z + z - pz);
    invalidate();
  }, [camera, invalidate, x, y, z]);
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
  viewShift,
  onStandingRoomChange,
  onFreeMoveStart,
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
    const focusRoomId = focusArtworkId
      ? model.frames.find((f) => f.artworkId === focusArtworkId)?.roomId
      : focusObjectId
        ? model.objects.find((o) => o.objectId === focusObjectId)?.roomId
        : undefined;
    const roomId =
      focusRoomId ??
      (model.rooms.some((r) => r.roomId === currentRoomId)
        ? currentRoomId
        : model.rooms[0]?.roomId);
    return (
      <TravelCamera
        model={model}
        targetPose={targetPose}
        destRoomId={roomId}
        focused={Boolean(focusRoomId)}
        onMovingChange={onMovingChange}
        disabledControls={disabledControls}
        viewShift={viewShift}
        onStandingRoomChange={onStandingRoomChange}
        onFreeMoveStart={onFreeMoveStart}
      />
    );
  }

  // Default "orbit" mode for editor preview (Top-down, T-124): starts from above.
  return (
    <>
      <TopDownStart model={model} target={orbitTarget} />
      <FollowTarget target={orbitTarget} />
      <OrbitControls
        makeDefault
        target={orbitTarget}
        enabled={!disabledControls}
        enableDamping={false}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2}
        maxDistance={80}
      />
    </>
  );
}
