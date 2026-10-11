"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

export const LOOK_MIN_PITCH = (-60 * Math.PI) / 180; // -60 deg
export const LOOK_MAX_PITCH = (60 * Math.PI) / 180; // +60 deg
export const DRAG_THRESHOLD_PX = 5;

/**
 * Clamps pitch to [minPitch, maxPitch] (default +/- 60 deg).
 */
export function clampPitch(
  pitch: number,
  minPitch = LOOK_MIN_PITCH,
  maxPitch = LOOK_MAX_PITCH,
): number {
  return Math.max(minPitch, Math.min(maxPitch, pitch));
}

/**
 * Normalizes yaw into [-PI, PI] range for consistent wrapping.
 */
export function wrapYaw(yaw: number): number {
  let y = yaw % (2 * Math.PI);
  if (y > Math.PI) y -= 2 * Math.PI;
  if (y < -Math.PI) y += 2 * Math.PI;
  return y;
}

/**
 * Tests whether movement distance exceeds drag threshold.
 */
export function isDragMovement(
  dx: number,
  dy: number,
  threshold = DRAG_THRESHOLD_PX,
): boolean {
  return Math.hypot(dx, dy) > threshold;
}

export interface LookControlsProps {
  enabled?: boolean;
  onLookDelta?: (dYaw: number, dPitch: number) => void;
  /** Sensitivity in radians per pixel */
  sensitivity?: number;
}

/**
 * LookControls attaches drag (mouse/touch) and arrow key listeners to control
 * camera look-around via incremental deltas.
 */
export function LookControls({
  enabled = true,
  onLookDelta,
  sensitivity = 0.003,
}: LookControlsProps) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const totalDragDist = useRef(0);

  const onLookDeltaRef = useRef(onLookDelta);
  useEffect(() => {
    onLookDeltaRef.current = onLookDelta;
  }, [onLookDelta]);

  // eslint-disable-next-line react-hooks/immutability -- setting touch-action on domElement is safe in useEffect
  useEffect(() => {
    if (!enabled) return;

    const dom = gl.domElement;
    // eslint-disable-next-line react-hooks/immutability -- touch-action on the R3F canvas (T-074 touch)
    dom.style.touchAction = "none";

    const applyDelta = (dx: number, dy: number) => {
      const dYaw = -dx * sensitivity;
      const dPitch = -dy * sensitivity;
      onLookDeltaRef.current?.(dYaw, dPitch);
      invalidate();
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Primary button or touch
      if (e.button !== 0 && e.pointerType === "mouse") return;
      isDragging.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      totalDragDist.current = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      // Using clientX - startX for robust touch/mouse delta handling
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      const dist = Math.hypot(
        e.clientX - startX.current,
        e.clientY - startY.current,
      );
      totalDragDist.current = Math.max(totalDragDist.current, dist);

      startX.current = e.clientX;
      startY.current = e.clientY;

      applyDelta(dx, dy);
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 0.05; // ~3 degrees per key stroke
      if (e.key === "ArrowLeft") {
        applyDelta(step / sensitivity, 0);
      } else if (e.key === "ArrowRight") {
        applyDelta(-step / sensitivity, 0);
      } else if (e.key === "ArrowUp") {
        applyDelta(0, step / sensitivity);
      } else if (e.key === "ArrowDown") {
        applyDelta(0, -step / sensitivity);
      }
    };

    dom.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      // Disabled mid-drag (an object drag took over): end the drag, or the camera would keep
      // following the pointer with no button down once look is enabled again.
      isDragging.current = false;
      dom.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, gl, invalidate, sensitivity]);

  return null;
}
