"use client";

// <Atmosphere model currentRoomId />: lights, fog and background for the current room (F11).
// On a room change it blends from what's on screen to the new room's look over ~1 s (R7), easing
// in-out, with the frame step clamped (R6). It invalidates only while blending, so the canvas keeps
// rendering on demand (plan.md §7). No post-processing.
// T-125: the look also drives image-based light strength and the picture lights (lookExtras).

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { SceneModel } from "@/lib/compile/types";
import {
  blendLook,
  easeInOutCubic,
  lookExtras,
  resolveLightLevel,
  resolveLook,
  resolveLookOverrides,
  type AtmosphereLook,
} from "@/lib/schema/atmosphere";
import { Lighting, SceneEnvironment } from "./Lighting";
import { PictureLights, PICTURE_LIGHT_POOL } from "./PictureLights";

export const ATMOSPHERE_BLEND_SECONDS = 1;
const MAX_FRAME_DELTA = 1 / 15; // R6

export function Atmosphere({
  model,
  currentRoomId,
  target,
  pictureLightPool = PICTURE_LIGHT_POOL.high,
  /** Post chain (bloom + vignette + neutral tone map). Off on the low tier. */
  effects = true,
}: {
  model: SceneModel;
  currentRoomId?: string;
  target?: [number, number, number];
  /** Spot lights kept for artwork (fixed per canvas; 0 turns picture lights off). */
  pictureLightPool?: number;
  effects?: boolean;
}) {
  const room =
    model.rooms.find((r) => r.roomId === currentRoomId) ?? model.rooms[0];
  const goal = useMemo<AtmosphereLook>(
    () => resolveLook(room ?? { lighting: "gallery" }),
    [room],
  );

  const [look, setLook] = useState<AtmosphereLook>(goal);
  const blend = useRef<{
    from: AtmosphereLook;
    to: AtmosphereLook;
    t: number;
  } | null>(null);
  const shown = useRef(goal); // what's on screen; updated only where `look` changes
  const prevRoomId = useRef(currentRoomId);
  const invalidate = useThree((s) => s.invalidate);

  // A new goal starts a blend across rooms; within the same room (creator editing sliders), update immediately!
  useEffect(() => {
    if (shown.current === goal) return;
    const isRoomTransition = prevRoomId.current !== currentRoomId;
    prevRoomId.current = currentRoomId;
    if (isRoomTransition) {
      blend.current = { from: shown.current, to: goal, t: 0 };
    } else {
      blend.current = null;
      shown.current = goal;
      setLook(goal);
    }
    invalidate();
  }, [goal, currentRoomId, invalidate]);

  useFrame((_, delta) => {
    const b = blend.current;
    if (!b) return;
    b.t = Math.min(
      1,
      b.t + Math.min(delta, MAX_FRAME_DELTA) / ATMOSPHERE_BLEND_SECONDS,
    );
    const next = b.t >= 1 ? b.to : blendLook(b.from, b.to, easeInOutCubic(b.t));
    shown.current = next;
    setLook(next);
    if (b.t >= 1) blend.current = null;
    else invalidate();
  });

  const extras = useMemo(() => lookExtras(look), [look]);
  // Creator overrides (custom preset): explicit glow/vignette win over derived.
  const overrides = useMemo(() => resolveLookOverrides(room ?? {}), [room]);
  // Creator brightness moves ALL the light: IBL and spots follow the level.
  const level = useMemo(() => resolveLightLevel(room ?? {}), [room]);
  const bloomIntensity = overrides.glow ?? extras.bloom.intensity;
  const vignetteDarkness = Math.min(
    0.85,
    (overrides.vignette ?? extras.vignette) * 1.8,
  );
  // Controlled spot intensity: art pops cleanly without burning out the wall
  const spotIntensity = extras.pictureLight.intensity * level * (overrides.spots ?? 1) * 0.6;

  return (
    <>
      <Lighting preset={look} target={target} />
      <SceneEnvironment intensity={extras.envIntensity * level} />
      {pictureLightPool > 0 ? (
        <PictureLights
          model={model}
          roomId={room?.roomId}
          color={extras.pictureLight.color}
          intensity={spotIntensity}
          poolSize={pictureLightPool}
        />
      ) : null}
      {look.fog.density > 0 ? (
        <fogExp2 attach="fog" args={[look.fog.color, look.fog.density]} />
      ) : null}
      {effects ? (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={bloomIntensity}
            luminanceThreshold={Math.max(1.05, extras.bloom.luminanceThreshold)}
            luminanceSmoothing={0.3}
          />
          <Vignette darkness={vignetteDarkness} offset={0.35} />
          {/* Use ToneMappingMode.NEUTRAL (mode 8) from postprocessing for true Khronos PBR Neutral curve */}
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      ) : null}
    </>
  );
}
