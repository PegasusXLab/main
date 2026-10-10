"use client";

// Plinth (T-131, object-render spec): the stand an object sits on. Box or cylinder, paper-tinted
// matte on light looks, graphite on dark ones (so it doesn't glow in moonlit rooms). A 1 cm
// darker reveal at the base (the baseboard trick) plus the shared soft contact-shadow quad.

import { useMemo } from "react";
import { THEME } from "@/lib/theme";
import { getSoftShadowTexture } from "./materials";
import { noRaycast } from "./Frames";

export type PlinthShape = "none" | "cylinder" | "box";
export type PlinthTone = "light" | "dark";

export interface PlinthProps {
  shape: PlinthShape;
  /** Plinth height, meters. */
  height: number;
  /** Square footprint side, meters. */
  size: number;
  tone?: PlinthTone;
  onClick?: (e: { stopPropagation: () => void }) => void;
}

export function Plinth({ shape, height, size, tone = "light", onClick }: PlinthProps) {
  const shadowTexture = useMemo(() => getSoftShadowTexture(), []);
  if (shape === "none" || height <= 0) return null;

  const bodyColor = tone === "dark" ? THEME.colors.graphite : THEME.colors.paper;
  const body =
    shape === "cylinder" ? (
      <cylinderGeometry args={[size / 2, size / 2, height, 48]} />
    ) : (
      <boxGeometry args={[size, height, size]} />
    );
  const revealSize = shape === "cylinder" ? size * 0.98 : size * 1.005;

  return (
    <group>
      {/* Contact shadow: shared radial quad, 1.4x the footprint. */}
      {shadowTexture ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005, 0]}
          raycast={noRaycast}
        >
          <planeGeometry args={[size * 1.4, size * 1.4]} />
          <meshBasicMaterial
            color="#000000"
            alphaMap={shadowTexture}
            transparent
            opacity={0.45}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      {/* 1 cm darker reveal at the base. */}
      <mesh position={[0, 0.005, 0]} onClick={onClick} raycast={undefined}>
        {shape === "cylinder" ? (
          <cylinderGeometry args={[revealSize / 2, revealSize / 2, 0.01, 48]} />
        ) : (
          <boxGeometry args={[revealSize, 0.01, revealSize]} />
        )}
        <meshStandardMaterial color={THEME.colors.graphite} roughness={0.9} />
      </mesh>
      {/* Body. */}
      <mesh position={[0, height / 2 + 0.01, 0]} onClick={onClick}>
        {body}
        <meshStandardMaterial
          color={bodyColor}
          roughness={tone === "dark" ? 0.6 : 0.9}
          envMapIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
