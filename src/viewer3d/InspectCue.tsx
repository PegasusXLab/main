"use client";

// "You can open this" cue (viewer): while the pointer is over an inspectable artwork or object, a
// soft aura blooms behind it, a fine outline traces it (frames) or a halo rings the floor around
// it (objects), and a small "Inspect" label floats above. Fades in and out; only drawn while
// animating (on-demand rendering).

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { SceneFrame, SceneObject } from "@/lib/compile/types";
import { FRAME_DEPTH } from "./Frames";
import { getGlowTexture } from "./DoorwayCue";

const FADE_SECONDS = 0.24;
const WALL_FACE_Z = -0.005; // frame-local wall surface (see Frames)

export type InspectTarget =
  | { kind: "frame"; frame: SceneFrame }
  | { kind: "object"; object: SceneObject };

export function InspectCue({ target, active, onFaded }: {
  target: InspectTarget;
  active: boolean;
  onFaded: () => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const glowMap = useMemo(() => getGlowTexture(), []);
  const aura = useRef<THREE.MeshBasicMaterial>(null);
  const line = useRef<THREE.LineBasicMaterial>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const breathe = useRef<THREE.Group>(null);
  const level = useRef(0);
  const time = useRef(0);
  const faded = useRef(false);
  const onFadedRef = useRef(onFaded);
  useEffect(() => {
    onFadedRef.current = onFaded;
  }, [onFaded]);

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
    const step = dt / FADE_SECONDS;
    level.current = goal > level.current ? Math.min(goal, level.current + step) : Math.max(goal, level.current - step);
    const e = 1 - Math.pow(1 - level.current, 3);
    time.current += dt;
    const pulse = 0.85 + 0.15 * Math.sin(time.current * 2.4);
    if (aura.current) aura.current.opacity = 0.55 * e * pulse;
    if (line.current) line.current.opacity = 0.9 * e;
    if (ring.current) ring.current.opacity = 0.7 * e * pulse;
    if (breathe.current) {
      const s = 1 + 0.02 * e + 0.006 * Math.sin(time.current * 2.4);
      breathe.current.scale.set(s, s, 1);
    }
    if (level.current > 0 || active) invalidate();
    else if (!faded.current) {
      faded.current = true;
      onFadedRef.current();
    }
  });

  const label = (
    <div
      data-testid="inspect-cue-label"
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-graphite/70 px-2.5 py-1 font-sans text-[11px] font-medium tracking-wide text-paper shadow-lg backdrop-blur-md transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none"
      style={{ opacity: labelShown ? 1 : 0, transform: labelShown ? "translateY(0)" : "translateY(6px)" }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#8fb0ff]" aria-hidden="true" />
      Inspect
    </div>
  );

  if (target.kind === "frame") {
    const f = target.frame;
    const w = f.width + 0.16;
    const h = f.height + 0.16;
    const outline = new Float32Array([
      -w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0,
    ]);
    return (
      <group position={f.position} rotation={[0, f.rotationY, 0]}>
        {/* Aura on the wall behind the frame */}
        <mesh position={[0, 0, WALL_FACE_Z + 0.001]} raycast={() => null}>
          <planeGeometry args={[w * 1.9, h * 1.9]} />
          <meshBasicMaterial
            ref={aura}
            map={glowMap}
            color="#fff4e0"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        {/* Fine outline just in front of the moulding */}
        <group ref={breathe} position={[0, 0, WALL_FACE_Z + FRAME_DEPTH + 0.004]}>
          <lineLoop raycast={() => null}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[outline, 3]} />
            </bufferGeometry>
            <lineBasicMaterial ref={line} color="#ffffff" transparent opacity={0} depthWrite={false} toneMapped={false} />
          </lineLoop>
        </group>
        <Html position={[0, h / 2 + 0.16, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          {label}
        </Html>
      </group>
    );
  }

  const o = target.object;
  const r = Math.max(0.35, o.plinth.size / 2 + 0.2, o.height * 0.3);
  return (
    <group position={[o.base[0], 0, o.base[2]]}>
      {/* Halo on the floor around the piece */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} raycast={() => null}>
        <planeGeometry args={[r * 3, r * 3]} />
        <meshBasicMaterial
          ref={aura}
          map={glowMap}
          color="#fff4e0"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <group ref={breathe} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <mesh raycast={() => null}>
          <ringGeometry args={[r, r + 0.025, 64]} />
          <meshBasicMaterial ref={ring} color="#ffffff" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <Html position={[0, o.base[1] + o.height + 0.25, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        {label}
      </Html>
    </group>
  );
}
