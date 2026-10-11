"use client";

// Doorway hover cue (viewer travel): when the pointer is over a doorway, a soft pool of light fades
// in across the threshold, two chevrons drift toward the next room, and a label names it. Fades
// out on leave. Opacity/drift run in useFrame (on-demand: it only draws while animating).

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { SceneDoorway } from "@/lib/compile/types";
import { doorwayDirection } from "./tourRoute";

/** Seconds for the cue to fade fully in or out. */
export const CUE_FADE_SECONDS = 0.22;
const GLOW_OPACITY = 0.5;
const CHEVRON_OPACITY = 0.85;
const GLOW_DEPTH = 2.2; // meters across the threshold

/** Soft elliptical falloff, white in the middle, transparent at the edges (shared, made once). */
let glowTexture: THREE.Texture | null = null;
export function getGlowTexture(): THREE.Texture | null {
  if (glowTexture || typeof document === "undefined") return glowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

/** A flat "V" pointing along +z, 0.36 m wide (floor chevron). */
function chevronGeometry(): THREE.ShapeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.18, -0.06);
  s.lineTo(0, 0.1);
  s.lineTo(0.18, -0.06);
  s.lineTo(0.18, -0.13);
  s.lineTo(0, 0.03);
  s.lineTo(-0.18, -0.13);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

export function DoorwayCue({
  doorway,
  fromRoomId,
  label,
  active,
  onFaded,
}: {
  doorway: SceneDoorway;
  /** Room the visitor walks out of (the cue points away from it). */
  fromRoomId: string;
  label?: string;
  active: boolean;
  /** Called once the cue has fully faded out after `active` turned false. */
  onFaded: () => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const [dx, dz] = doorwayDirection(doorway, fromRoomId);
  const heading = Math.atan2(dx, dz); // rotate +z (chevron tip) onto the walking direction
  const [cx, , cz] = doorway.center;

  const glowMap = useMemo(() => getGlowTexture(), []);
  const chevron = useMemo(() => chevronGeometry(), []);
  useEffect(() => () => chevron.dispose(), [chevron]);

  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const chevronMat = useRef<THREE.MeshBasicMaterial>(null);
  const chevronMat2 = useRef<THREE.MeshBasicMaterial>(null);
  const level = useRef(0);
  const time = useRef(0);
  const chevrons = useRef<THREE.Group>(null);
  const faded = useRef(false);
  const onFadedRef = useRef(onFaded);
  useEffect(() => {
    onFadedRef.current = onFaded;
  }, [onFaded]);

  // The label fades via a CSS transition, so flip it a frame after mount/changes.
  const [labelShown, setLabelShown] = useState(false);
  useEffect(() => {
    faded.current = false;
    invalidate();
    const id = requestAnimationFrame(() => setLabelShown(active));
    return () => cancelAnimationFrame(id);
  }, [active, invalidate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 15);
    const goal = active ? 1 : 0;
    const step = dt / CUE_FADE_SECONDS;
    level.current =
      goal > level.current
        ? Math.min(goal, level.current + step)
        : Math.max(goal, level.current - step);
    const eased = 1 - Math.pow(1 - level.current, 3); // ease-out
    if (glowMat.current) glowMat.current.opacity = GLOW_OPACITY * eased;
    if (chevronMat.current) chevronMat.current.opacity = CHEVRON_OPACITY * eased;
    if (chevronMat2.current) chevronMat2.current.opacity = CHEVRON_OPACITY * eased * 0.6;
    time.current += dt;
    if (chevrons.current) {
      // Gentle drift toward the next room, looping every 1.6 s.
      chevrons.current.position.z = 0.35 + ((time.current / 1.6) % 1) * 0.25;
    }
    if (level.current > 0 || active) invalidate();
    else if (!faded.current) {
      faded.current = true;
      onFadedRef.current();
    }
  });

  return (
    <group position={[cx, 0, cz]} rotation={[0, heading, 0]}>
      {/* Light pool across the threshold */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} raycast={() => null}>
        <planeGeometry args={[doorway.width * 1.6, GLOW_DEPTH]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glowMap}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Two chevrons on the far side, drifting forward */}
      <group ref={chevrons} position={[0, 0.016, 0.35]}>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI]} geometry={chevron} raycast={() => null}>
          <meshBasicMaterial
            ref={chevronMat}
            color="#ffffff"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, Math.PI]}
          position={[0, 0, 0.3]}
          geometry={chevron}
          raycast={() => null}
        >
          <meshBasicMaterial
            ref={chevronMat2}
            color="#ffffff"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {label ? (
        <Html
          position={[0, doorway.height + 0.22, 0]}
          center
          zIndexRange={[5, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            data-testid="doorway-cue-label"
            className="whitespace-nowrap rounded-full border border-white/15 bg-graphite/70 px-3 py-1 font-sans text-xs font-medium tracking-wide text-paper shadow-lg backdrop-blur-md transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none"
            style={{
              opacity: labelShown ? 1 : 0,
              transform: labelShown ? "translateY(0)" : "translateY(6px)",
            }}
          >
            Enter {label} <span aria-hidden="true">→</span>
          </div>
        </Html>
      ) : null}
    </group>
  );
}
