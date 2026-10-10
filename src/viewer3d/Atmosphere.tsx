"use client";

// <Atmosphere model currentRoomId />: lights, fog and background for the current room (F11).
// On a room change it blends from what's on screen to the new room's look over ~1 s (R7), easing
// in-out, with the frame step clamped (R6). It invalidates only while blending, so the canvas keeps
// rendering on demand (plan.md §7). No post-processing.

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { SceneModel } from "@/lib/compile/types";
import {
  blendLook,
  easeInOutCubic,
  resolveLook,
  type AtmosphereLook,
} from "@/lib/schema/atmosphere";
import { Lighting } from "./Lighting";

export const ATMOSPHERE_BLEND_SECONDS = 1;
const MAX_FRAME_DELTA = 1 / 15; // R6

export function Atmosphere({
  model,
  currentRoomId,
  target,
}: {
  model: SceneModel;
  currentRoomId?: string;
  target?: [number, number, number];
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
  const invalidate = useThree((s) => s.invalidate);

  // A new goal starts a blend from whatever is on screen right now (never jumps mid-blend).
  useEffect(() => {
    if (shown.current === goal) return;
    blend.current = { from: shown.current, to: goal, t: 0 };
    invalidate();
  }, [goal, invalidate]);

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

  return (
    <>
      <Lighting preset={look} target={target} />
      {look.fog.density > 0 ? (
        <fogExp2 attach="fog" args={[look.fog.color, look.fog.density]} />
      ) : null}
    </>
  );
}
