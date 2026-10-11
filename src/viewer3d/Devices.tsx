"use client";

// Interactive devices standing on a host object (ADR-015 objects + this): a TV on a media cabinet,
// a turntable on a console, a guestbook on a side table. The host is ordinary furniture; the device
// is what visitors use, so it's drawn here, in code, where it can move: the screen plays its video
// and spills light on the floor, the record spins (only while its song is really playing) and the
// tonearm swings in, the book's pages show the latest signatures. Materials that gain or lose a
// texture are keyed so they remount (three won't recompile a material when `map` appears). Click anywhere on the piece to open
// its panel. Rendering is on demand: devices invalidate only while something moves.

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { SceneObject } from "@/lib/compile/types";
import type { ObjectDevice, Track } from "@/lib/schema/types";
import { GUESTBOOK_SIZE, TURNTABLE_SIZE, TV_STAND } from "@/lib/devices";
import { useSpinStore } from "@/audio/spinStore";
import { useGuestbookStore } from "./guestbookStore";
import { getGlowTexture } from "./DoorwayCue";
import type { GuestbookEntry } from "@/lib/guestbook";

const noRaycast = () => null;

// ---------------------------------------------------------------------------------------------
// TV video elements, by object id, so the inspect panel can play / pause / unmute them.

const tvVideos = new Map<string, HTMLVideoElement>();
const tvListeners = new Set<() => void>();
export function getTvVideo(objectId: string): HTMLVideoElement | undefined {
  return tvVideos.get(objectId);
}
export function subscribeTvVideos(fn: () => void): () => void {
  tvListeners.add(fn);
  return () => tvListeners.delete(fn);
}
function setTvVideo(objectId: string, v: HTMLVideoElement | null) {
  if (v) tvVideos.set(objectId, v);
  else tvVideos.delete(objectId);
  tvListeners.forEach((fn) => fn());
}

export function DeviceMount({ obj }: { obj: SceneObject }) {
  const d = obj.device;
  if (!d) return null;
  return (
    <group position={[0, obj.height, 0]}>
      <DeviceBody objectId={obj.objectId} device={d} hostHeight={obj.height + obj.base[1]} />
    </group>
  );
}

function DeviceBody({ objectId, device, hostHeight }: { objectId: string; device: ObjectDevice; hostHeight: number }) {
  switch (device.kind) {
    case "tv":
      return <TvDevice objectId={objectId} device={device} hostHeight={hostHeight} />;
    case "turntable":
      return <TurntableDevice objectId={objectId} tracks={device.tracks} accent={device.accent} />;
    case "guestbook":
      return <GuestbookDevice />;
  }
}

// ---------------------------------------------------------------------------------------------
// TV

/** A screen is a light source: lift it a little above the room's grading so it glows. */
const SCREEN_GAIN = new THREE.Color(1.35, 1.35, 1.35);

/** The TV plays (and redraws the scene) only while the visitor is this close (meters). */
const TV_NEAR = 9;

function TvDevice({
  objectId,
  device,
  hostHeight,
}: {
  objectId: string;
  device: Extract<ObjectDevice, { kind: "tv" }>;
  hostHeight: number;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera);
  const root = useRef<THREE.Group>(null);
  const glowMap = useMemo(() => getGlowTexture(), []);
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  const poster = useCoverTexture(device.video.posterUrl);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const spill = useRef<THREE.MeshBasicMaterial>(null);
  const t = useRef(0);
  const w = device.screen;
  const h = device.screen * device.video.aspect;
  const { url, posterUrl } = device.video;

  useEffect(() => {
    // No video chosen yet: the screen shows standby.
    if (typeof document === "undefined" || !url) return;
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    if (posterUrl) v.poster = posterUrl;
    v.src = url;
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    let alive = true;
    let handle = 0;
    // Redraw on every decoded video frame (on-demand rendering otherwise freezes the picture).
    const onFrame = () => {
      if (!alive) return;
      invalidate();
      if ("requestVideoFrameCallback" in v) handle = v.requestVideoFrameCallback(onFrame);
    };
    const interval = "requestVideoFrameCallback" in v ? 0 : window.setInterval(() => invalidate(), 1000 / 30);
    if ("requestVideoFrameCallback" in v) handle = v.requestVideoFrameCallback(onFrame);
    // Play while the visitor is near, pause when they walk away (no frames spent on other rooms).
    const here = new THREE.Vector3();
    let userPaused = false;
    let autoPausing = false;
    v.addEventListener("pause", () => {
      if (!autoPausing) userPaused = true;
    });
    v.addEventListener("play", () => {
      userPaused = false;
    });
    const check = () => {
      if (!root.current) return;
      root.current.getWorldPosition(here);
      const near = camera.position.distanceTo(here) < TV_NEAR;
      if (near && v.paused && !userPaused) {
        void v.play().catch(() => {
          // Autoplay refused (rare for muted video): start on the next gesture.
          window.addEventListener("pointerdown", () => void v.play().catch(() => {}), { once: true, capture: true });
        });
      } else if (!near && !v.paused) {
        autoPausing = true;
        v.pause();
        autoPausing = false;
      }
    };
    const watch = window.setInterval(check, 700);
    requestAnimationFrame(check);
    setTvVideo(objectId, v);
    // Swap the poster for the picture once real frames arrive.
    const ready = () => setTexture(tex);
    v.addEventListener("playing", ready, { once: true });
    return () => {
      alive = false;
      window.clearInterval(watch);
      v.removeEventListener("playing", ready);
      if (interval) window.clearInterval(interval);
      if (handle && "cancelVideoFrameCallback" in v) v.cancelVideoFrameCallback(handle);
      v.pause();
      v.removeAttribute("src");
      v.load();
      tex.dispose();
      setTvVideo(objectId, null);
    };
  }, [url, posterUrl, objectId, invalidate, camera]);

  // A slow shimmer in the light the screen throws (the picture itself drives redraws).
  useFrame((_, delta) => {
    t.current += Math.min(delta, 0.1);
    const f = 0.85 + 0.15 * Math.sin(t.current * 1.7) * Math.sin(t.current * 0.63 + 1);
    if (halo.current) halo.current.opacity = 0.32 * f;
    if (spill.current) spill.current.opacity = 0.22 * f;
  });

  const bezel = 0.018;
  const screenY = TV_STAND + h / 2;
  return (
    <group ref={root} position={[0, 0, -0.06]}>
      {/* Foot + neck */}
      <mesh position={[0, 0.006, -0.02]} castShadow>
        <boxGeometry args={[Math.max(0.28, w * 0.32), 0.012, 0.2]} />
        <meshStandardMaterial color="#1c1c1f" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, TV_STAND / 2 + 0.01, -0.035]}>
        <boxGeometry args={[0.05, TV_STAND, 0.03]} />
        <meshStandardMaterial color="#1c1c1f" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Body + screen */}
      {/* Body sits well behind the screen surface: a hairline gap z-fights at viewing distance. */}
      <mesh position={[0, screenY, -0.035]} castShadow>
        <boxGeometry args={[w + bezel * 2, h + bezel * 2, 0.035]} />
        <meshStandardMaterial color="#121214" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, screenY, 0]}>
        <planeGeometry args={[w, h]} />
        {texture ? (
          <meshBasicMaterial key="video" map={texture} color={SCREEN_GAIN} toneMapped={false} />
        ) : poster ? (
          <meshBasicMaterial key="poster" map={poster} color={SCREEN_GAIN} toneMapped={false} />
        ) : (
          <meshBasicMaterial key="standby" color="#0b1020" toneMapped={false} />
        )}
      </mesh>
      {/* Light from the screen: a halo on the wall behind, a pool on the floor in front. */}
      <mesh position={[0, screenY, -0.08]} raycast={noRaycast}>
        <planeGeometry args={[w * 2.2, h * 2.4]} />
        <meshBasicMaterial
          ref={halo}
          map={glowMap}
          color="#9fb8ff"
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -hostHeight + 0.012, 0.9]} raycast={noRaycast}>
        <planeGeometry args={[w * 1.8, 1.6]} />
        <meshBasicMaterial
          ref={spill}
          map={glowMap}
          color="#a9c2ff"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// Turntable

let grooveTexture: THREE.CanvasTexture | null = null;
function getGrooveTexture(): THREE.CanvasTexture | null {
  if (grooveTexture || typeof document === "undefined") return grooveTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, 512, 512);
  for (let r = 250; r > 92; r -= 2.2) {
    ctx.strokeStyle = `rgba(255,255,255,${0.025 + ((r * 13) % 7) * 0.006})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // A soft sheen band so the spin reads.
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0.42, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.10)");
  g.addColorStop(0.58, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();
  grooveTexture = new THREE.CanvasTexture(c);
  grooveTexture.colorSpace = THREE.SRGBColorSpace;
  return grooveTexture;
}

function useCoverTexture(url?: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!url) {
      const id = requestAnimationFrame(() => setTex(null));
      return () => cancelAnimationFrame(id);
    }
    let alive = true;
    let loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      loaded = t;
      if (alive) {
        setTex(t);
        invalidate();
      } else t.dispose();
    });
    return () => {
      alive = false;
      loaded?.dispose();
    };
  }, [url, invalidate]);
  return tex;
}

const RPM = 33.3;
const ARM_REST = 0.42; // radians, swung out
const ARM_PLAY = 0.05;

function TurntableDevice({ objectId, tracks, accent = "#e8b04a" }: { objectId: string; tracks: Track[]; accent?: string }) {
  const invalidate = useThree((s) => s.invalidate);
  const mine = useSpinStore((s) => s.sourceId === objectId);
  const spinTrack = useSpinStore((s) => (s.sourceId === objectId ? s.track : null));
  const audible = useSpinStore((s) => s.sourceId === objectId && s.audible);
  const current = spinTrack ?? tracks[0];
  const cover = useCoverTexture(current?.coverUrl);
  const grooves = useMemo(() => getGrooveTexture(), []);
  const glowMap = useMemo(() => getGlowTexture(), []);

  const record = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const speed = useRef(0);
  const armAngle = useRef(ARM_REST);
  const t = useRef(0);

  useEffect(() => {
    invalidate();
  }, [audible, mine, invalidate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const goal = audible ? 1 : 0;
    // Spin up quickly, coast down slowly, like a real platter.
    speed.current += (goal - speed.current) * (1 - Math.exp(-(goal ? 3.2 : 1.4) * dt));
    if (Math.abs(goal - speed.current) < 0.002) speed.current = goal;
    const armGoal = mine ? ARM_PLAY : ARM_REST;
    armAngle.current += (armGoal - armAngle.current) * (1 - Math.exp(-4 * dt));
    if (Math.abs(armGoal - armAngle.current) < 0.001) armAngle.current = armGoal;
    t.current += dt;
    if (record.current) record.current.rotation.y -= speed.current * (RPM / 60) * Math.PI * 2 * dt;
    if (arm.current) arm.current.rotation.y = armAngle.current;
    const beat = 0.5 + 0.5 * Math.sin(t.current * Math.PI * 2 * 1.6);
    if (led.current) led.current.opacity = mine ? 0.55 + 0.45 * speed.current * beat : 0.25;
    if (pool.current) pool.current.opacity = 0.12 + 0.28 * speed.current * (0.7 + 0.3 * beat);
    const moving = speed.current > 0 || Math.abs(armGoal - armAngle.current) > 0 || audible;
    if (moving) invalidate();
  });

  const { w, d } = TURNTABLE_SIZE;
  const plinthH = 0.065;
  const top = plinthH;
  return (
    <group>
      {/* Warm light pooling on the console top; it breathes with the music. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} raycast={noRaycast}>
        <planeGeometry args={[w * 2.4, d * 2.6]} />
        <meshBasicMaterial
          ref={pool}
          map={glowMap}
          color={accent}
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Plinth: walnut body, brushed top plate, little feet. */}
      <mesh position={[0, plinthH / 2 + 0.01, 0]} castShadow>
        <boxGeometry args={[w, plinthH, d]} />
        <meshStandardMaterial color="#4a2f1f" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, plinthH + 0.0105, 0]}>
        <boxGeometry args={[w - 0.012, 0.002, d - 0.012]} />
        <meshStandardMaterial color="#1d1d20" roughness={0.6} metalness={0.3} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.04), 0.005, sz * (d / 2 - 0.04)]}>
            <cylinderGeometry args={[0.018, 0.02, 0.01, 16]} />
            <meshStandardMaterial color="#b9bcc0" metalness={0.8} roughness={0.25} />
          </mesh>
        )),
      )}
      {/* Platter + record (spins) */}
      <group ref={record} position={[-0.04, top + 0.012, 0]}>
        <mesh>
          <cylinderGeometry args={[0.152, 0.152, 0.012, 64]} />
          <meshStandardMaterial color="#c4c8cc" metalness={0.85} roughness={0.22} />
        </mesh>
        {/* Layers stacked a few mm apart: thinner gaps z-fight at viewing distance. */}
        <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.148, 64]} />
          <meshStandardMaterial map={grooves} color="#6b6b6b" roughness={0.55} metalness={0} envMapIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.0115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 48]} />
          {cover ? (
            <meshStandardMaterial key={cover.uuid} map={cover} roughness={0.6} />
          ) : (
            <meshStandardMaterial key="plain" color={accent} roughness={0.6} />
          )}
        </mesh>
        <mesh position={[0, 0.016, 0]}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.014, 12]} />
          <meshStandardMaterial color="#e6e6e6" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      {/* Tonearm: pivot back-right, swings onto the record while it plays. */}
      <group position={[w / 2 - 0.07, top + 0.03, -d / 2 + 0.075]}>
        <mesh position={[0, -0.008, 0]}>
          <cylinderGeometry args={[0.02, 0.024, 0.03, 24]} />
          <meshStandardMaterial color="#2a2a2d" metalness={0.7} roughness={0.3} />
        </mesh>
        <group ref={arm} rotation={[0, ARM_REST, 0]}>
          <mesh position={[-0.01, 0.006, 0.11]} rotation={[Math.PI / 2, 0, 0.12]}>
            <cylinderGeometry args={[0.0045, 0.0045, 0.23, 12]} />
            <meshStandardMaterial color="#d9dcdf" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-0.03, 0.0, 0.225]} rotation={[0, 0.25, 0]}>
            <boxGeometry args={[0.02, 0.012, 0.04]} />
            <meshStandardMaterial color="#1a1a1c" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0.008, 0.006, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.035, 16]} />
            <meshStandardMaterial color="#3a3a3e" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      </group>
      {/* Power LED in the accent color, pulsing with the beat. */}
      <mesh position={[w / 2 - 0.05, plinthH / 2 + 0.01, d / 2 + 0.0006]} raycast={noRaycast}>
        <circleGeometry args={[0.006, 16]} />
        <meshBasicMaterial ref={led} color={accent} transparent opacity={0.25} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// Guestbook

function drawPages(entries: GuestbookEntry[]): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 704;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#f4ecd8";
  ctx.fillRect(0, 0, 1024, 704);
  // Gutter shadow
  const gut = ctx.createLinearGradient(452, 0, 572, 0);
  gut.addColorStop(0, "rgba(0,0,0,0)");
  gut.addColorStop(0.5, "rgba(80,60,30,0.28)");
  gut.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gut;
  ctx.fillRect(452, 0, 120, 704);
  // Ruled lines
  ctx.strokeStyle = "rgba(90,110,150,0.18)";
  ctx.lineWidth = 1.5;
  for (let y = 150; y < 680; y += 44) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(480, y);
    ctx.moveTo(544, y);
    ctx.lineTo(984, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#3b2e1e";
  ctx.font = "italic 600 54px Georgia, 'Times New Roman', serif";
  ctx.fillText("Guestbook", 48, 96);
  ctx.font = "italic 26px Georgia, serif";
  ctx.fillStyle = "rgba(59,46,30,0.6)";
  ctx.fillText(entries.length ? `${entries.length} signature${entries.length === 1 ? "" : "s"}` : "Be the first to sign", 560, 96);

  const lines: string[] = [];
  for (const e of entries.slice(0, 10)) {
    const msg = e.message.replace(/\s+/g, " ");
    lines.push(`“${msg.length > 34 ? `${msg.slice(0, 33)}…` : msg}”`);
    lines.push(`   — ${e.name}`);
  }
  ctx.font = "italic 30px 'Snell Roundhand', 'Brush Script MT', 'Segoe Script', cursive";
  lines.forEach((ln, i) => {
    const col = i < 12 ? 0 : 1;
    const row = i % 12;
    if (i >= 24) return;
    ctx.fillStyle = ln.startsWith("   —") ? "rgba(30,40,80,0.75)" : "rgba(30,40,80,0.9)";
    ctx.fillText(ln, col ? 560 : 52, 140 + row * 44);
  });
  return c;
}

function GuestbookDevice() {
  const invalidate = useThree((s) => s.invalidate);
  const entries = useGuestbookStore((s) => s.entries);
  const [pages, setPages] = useState<{ left: THREE.CanvasTexture; right: THREE.CanvasTexture } | null>(null);
  const glowMap = useMemo(() => getGlowTexture(), []);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const t = useRef(0);

  useEffect(() => {
    const canvas = drawPages(entries);
    if (!canvas) return;
    // One canvas holds the spread; each page shows its half.
    const half = (offset: number) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.repeat.set(0.5, 1);
      tex.offset.set(offset, 0);
      return tex;
    };
    const left = half(0);
    const right = half(0.5);
    const id = requestAnimationFrame(() => {
      setPages({ left, right });
      invalidate();
    });
    return () => {
      cancelAnimationFrame(id);
      left.dispose();
      right.dispose();
    };
  }, [entries, invalidate]);

  // The reading light breathes whenever the scene redraws (no extra frames of its own).
  useFrame((_, delta) => {
    t.current += Math.min(delta, 0.2);
    if (glow.current) glow.current.opacity = 0.28 + 0.1 * Math.sin(t.current * 1.3);
  });

  const { w, d } = GUESTBOOK_SIZE;
  const pageW = w / 2 - 0.012;
  const tilt = 0.07;
  return (
    <group rotation={[0, 0, 0]}>
      {/* Leather cover */}
      <mesh position={[0, 0.006, 0]} castShadow>
        <boxGeometry args={[w + 0.02, 0.012, d + 0.02]} />
        <meshStandardMaterial color="#29453a" roughness={0.7} />
      </mesh>
      {/* Page blocks, sloping down from the spine */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (pageW / 2 + 0.006), 0.022, 0]} rotation={[0, 0, -side * tilt]} castShadow>
          <boxGeometry args={[pageW, 0.02, d - 0.01]} />
          <meshStandardMaterial color="#efe6cf" roughness={0.95} />
        </mesh>
      ))}
      {/* The spread (both pages in one texture), laid over the page blocks */}
      {[-1, 1].map((side) => (
        <mesh
          key={`p${side}`}
          position={[side * (pageW / 2 + 0.006), 0.036, 0]}
          rotation={[-Math.PI / 2, -side * tilt, 0]}
          raycast={noRaycast}
        >
          <planeGeometry args={[pageW, d - 0.012]} />
          {pages ? (
            <meshStandardMaterial
              key={(side < 0 ? pages.left : pages.right).uuid}
              map={side < 0 ? pages.left : pages.right}
              roughness={0.9}
            />
          ) : (
            <meshStandardMaterial key="blank" color="#f4ecd8" roughness={0.9} />
          )}
        </mesh>
      ))}
      {/* Pen resting on the right page */}
      <group position={[0.15, 0.048, 0.04]} rotation={[0, -0.6, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.0055, 0.0055, 0.15, 12]} />
          <meshStandardMaterial color="#141416" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.083, 0]}>
          <coneGeometry args={[0.0055, 0.018, 12]} />
          <meshStandardMaterial color="#c9a45a" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      {/* Ribbon bookmark */}
      <mesh position={[0.004, 0.02, d / 2 + 0.03]} rotation={[-1.2, 0, 0]} raycast={noRaycast}>
        <planeGeometry args={[0.012, 0.08]} />
        <meshStandardMaterial color="#8c1f2a" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      {/* Warm reading light */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.036, 0]} raycast={noRaycast}>
        <planeGeometry args={[w * 1.8, d * 1.9]} />
        <meshBasicMaterial
          ref={glow}
          map={glowMap}
          color="#ffd9a0"
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
