"use client";

// TourView (T-124): the visitor tour of a gallery, shared by the viewer (/g/[id]) and the
// editor's live "3D POV" view. Travel, Prev/Next, doorway/floor clicks, drag-look, plaque,
// arrival title, minimap and room audio all live here; it reads only the Gallery it's given.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { RoomAudio } from "@/audio/RoomAudio";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import { Minimap } from "./Minimap";
import { Plaque } from "./Plaque";
import { roomOrder } from "./roomOrder";
import { lookExtras, resolveLook, resolveLookOverrides } from "@/lib/schema/atmosphere";
import { getFontFamily, loadCustomFont } from "@/lib/fonts";

const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-graphite font-sans text-pencil">
      Loading gallery…
    </div>
  ),
});

export interface TourViewProps {
  gallery: Gallery;
  /** "screen" (viewer page, default) fills the viewport; "parent" fills its container (editor). */
  fill?: "screen" | "parent";
  currentRoomId?: string;
  onRoomChange?: (roomId: string) => void;
  onObjectDrag?: (objectId: string, newPosition: { x: number; y: number }) => void;
}

export function TourView({
  gallery,
  fill = "screen",
  currentRoomId,
  onRoomChange,
  onObjectDrag,
}: TourViewProps) {
  if (gallery.rooms.length === 0) {
    return (
      <div
        data-testid="tour-empty"
        className={`flex items-center justify-center bg-graphite font-sans text-pencil ${
          fill === "screen" ? "h-screen w-screen" : "h-full w-full"
        }`}
      >
        Add a room in 2D
      </div>
    );
  }
  return (
    <Tour
      gallery={gallery}
      fill={fill}
      currentRoomId={currentRoomId}
      onRoomChange={onRoomChange}
      onObjectDrag={onObjectDrag}
    />
  );
}

function Tour({
  gallery,
  fill,
  currentRoomId: propRoomId,
  onRoomChange,
  onObjectDrag,
}: {
  gallery: Gallery;
  fill: "screen" | "parent";
  currentRoomId?: string;
  onRoomChange?: (roomId: string) => void;
  onObjectDrag?: (objectId: string, newPosition: { x: number; y: number }) => void;
}) {
  const { scene } = useMemo(() => compile(gallery), [gallery]);
  const order = useMemo(
    () => roomOrder(scene, gallery.entranceRoomId),
    [scene, gallery.entranceRoomId],
  );
  const [prevPropRoomId, setPrevPropRoomId] = useState(propRoomId);
  const [chosenRoomId, setRoomId] = useState(
    propRoomId && order.includes(propRoomId) ? propRoomId : order[0],
  );

  if (propRoomId !== prevPropRoomId) {
    setPrevPropRoomId(propRoomId);
    if (propRoomId && order.includes(propRoomId)) {
      setRoomId(propRoomId);
    }
  }

  // Live editing can delete the room we're in; fall back to the first room in tour order.
  const roomId = order.includes(chosenRoomId) ? chosenRoomId : order[0];
  const [focusId, setFocusId] = useState<string | undefined>();

  // Room arrival title & description HUD state (stays until artwork/object is clicked)
  const [hudDismissed, setHudDismissed] = useState(false);
  const [prevRoomForHud, setPrevRoomForHud] = useState<string | null>(null);

  if (roomId !== prevRoomForHud) {
    setPrevRoomForHud(roomId);
    setHudDismissed(false);
  }

  const currentRoom = gallery.rooms.find((r) => r.id === roomId);
  const roomName = currentRoom?.name ?? "";
  const roomDesc = currentRoom?.description ?? "";
  const titleFont = currentRoom?.titleFont;
  const titlePosition = currentRoom?.titlePosition ?? "top-left";
  const customFontUrl = currentRoom?.customFontUrl;
  const roomFontFamily = getFontFamily(titleFont, customFontUrl);

  useEffect(() => {
    if (customFontUrl) {
      loadCustomFont(customFontUrl);
    }
  }, [customFontUrl]);

  // Film grain (look L2, bunker recipe): a static SVG-turbulence overlay, denser in dark
  // moody rooms, barely there in gallery-white. Zero WebGL cost; static under reduced motion.
  const grain = useMemo(() => {
    const room = gallery.rooms.find((r) => r.id === roomId);
    if (!room) return 0;
    const custom = resolveLookOverrides(room).grain;
    if (custom !== undefined) return custom;
    return lookExtras(resolveLook(room)).grain;
  }, [gallery.rooms, roomId]);

  const focused = focusId
    ? gallery.artworks.find((a) => a.id === focusId)
    : undefined;
  const focusedObject = !focused && focusId
    ? gallery.objects?.find((o) => o.id === focusId)
    : undefined;
  const plaque = focused ?? focusedObject;

  const isHudVisible = Boolean(roomName) && !focusId && !hudDismissed;

  const positionClasses = useMemo(() => {
    switch (titlePosition) {
      case "top-right":
        return "top-16 right-4 sm:top-20 sm:right-6 md:right-48 items-end text-right";
      case "center":
        return "top-20 inset-x-0 mx-auto items-center text-center";
      case "top-left":
      default:
        return "top-16 left-4 sm:top-20 sm:left-6 items-start text-left";
    }
  }, [titlePosition]);
  const largeImages = useMemo(
    () =>
      Object.fromEntries(
        gallery.artworks
          .filter((a) => a.image.large)
          .map((a) => [a.id, a.image.large!]),
      ),
    [gallery.artworks],
  );

  // Drag vs click guard: after dragging > 5 px (look-around), ignore click (T-074 AC 3)
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const wasDrag = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    wasDrag.current = false;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (pointerStart.current) {
      const dist = Math.hypot(
        e.clientX - pointerStart.current.x,
        e.clientY - pointerStart.current.y,
      );
      if (dist > 5) {
        wasDrag.current = true;
      }
    }
  }, []);

  const goTo = useCallback(
    (id: string) => {
      if (wasDrag.current) return;
      setFocusId(undefined);
      setRoomId(id);
      onRoomChange?.(id);
    },
    [onRoomChange],
  );
  const step = (delta: number) => {
    const i = order.indexOf(roomId);
    goTo(order[(i + delta + order.length) % order.length]);
  };
  const onFrameClick = useCallback(
    (artworkId: string) => {
      if (wasDrag.current) return;
      const art = gallery.artworks.find((a) => a.id === artworkId);
      if (!art) return;
      setRoomId(art.roomId);
      onRoomChange?.(art.roomId);
      setFocusId(artworkId);
    },
    [gallery.artworks, onRoomChange],
  );
  const onObjectClick = useCallback(
    (objectId: string) => {
      if (wasDrag.current) return;
      const obj = gallery.objects?.find((o) => o.id === objectId);
      if (!obj) return;
      setRoomId(obj.roomId);
      onRoomChange?.(obj.roomId);
      setFocusId(objectId);
    },
    [gallery.objects, onRoomChange],
  );
  const closePlaque = useCallback(() => setFocusId(undefined), []);
  // Through a doorway: go to whichever of its two rooms we're not in.
  const onDoorwayClick = useCallback(
    ([a, b]: [string, string]) => {
      if (wasDrag.current) return;
      goTo(roomId === a ? b : a);
    },
    [goTo, roomId],
  );

  return (
    <div
      className={`relative overflow-hidden bg-black ${
        fill === "screen" ? "h-screen w-screen" : "h-full w-full"
      }`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Scene
        model={scene}
        mode="travel"
        currentRoomId={roomId}
        focusArtworkId={focused ? focusId : undefined}
        focusObjectId={focusedObject ? focusId : undefined}
        onFloorClick={goTo}
        onDoorwayClick={onDoorwayClick}
        onFrameClick={onFrameClick}
        onObjectClick={onObjectClick}
        onObjectDrag={onObjectDrag}
        largeImages={largeImages}
        className="h-full w-full"
      />

      {/* Top Header Bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-b from-black/35 to-transparent p-4 text-paper">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-[2px] border border-white/10 bg-graphite/80 px-3.5 py-1.5 shadow-lg backdrop-blur-md">
            <h1 className="text-sm font-semibold tracking-wide text-paper">
              {gallery.title || "Untitled gallery"}
            </h1>
          </div>
        </div>
        {/* Room music + Mute (F9); the header ignores clicks, the controls don't. */}
        <div className="pointer-events-auto">
          <RoomAudio gallery={gallery} currentRoomId={roomId} />
        </div>
      </header>

      {/* Minimap corner overlay (T-075, T-082, T-083) */}
      <aside className="absolute right-4 top-16 z-10 sm:top-20">
        <Minimap model={scene} currentRoomId={roomId} onRoomClick={goTo} />
      </aside>

      {/* Floating Room Title & Description Curatorial HUD */}
      {roomName ? (
        <aside
          data-testid="room-title-hud"
          aria-hidden={!isHudVisible}
          className={`pointer-events-none absolute z-15 flex flex-col max-w-xs sm:max-w-md transition-all duration-300 ease-out motion-reduce:transition-none ${positionClasses} ${
            isHudVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-4 scale-95"
          }`}
        >
          <div className="pointer-events-auto group relative w-full overflow-hidden rounded-[2px] border border-white/15 bg-graphite/80 p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all hover:border-white/30">
            {/* Curatorial room tag & close button */}
            <div
              className={`flex items-center gap-3 pb-1.5 border-b border-white/10 ${
                titlePosition === "top-right"
                  ? "justify-end"
                  : titlePosition === "center"
                    ? "justify-center"
                    : "justify-between"
              }`}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-paper/60">
                Room {Math.max(1, order.indexOf(roomId) + 1)} of {order.length}
              </span>
              <button
                type="button"
                onClick={() => setHudDismissed(true)}
                aria-label="Dismiss room details"
                className="rounded p-0.5 text-paper/40 transition-colors hover:text-paper hover:bg-white/10"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Room Title */}
            <h2
              className="mt-2.5 text-xl sm:text-2xl font-bold tracking-wide text-paper drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              style={{ fontFamily: roomFontFamily }}
            >
              {roomName}
            </h2>

            {/* Room Description */}
            {roomDesc ? (
              <p className="mt-2 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-paper/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] font-sans">
                {roomDesc}
              </p>
            ) : null}
          </div>
        </aside>
      ) : null}

      {/* Artwork / object Plaque Card */}
      {plaque ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4">
          <Plaque
            title={plaque.title}
            artist={plaque.artist}
            story={plaque.story}
            fontFamily={roomFontFamily}
            onClose={closePlaque}
          />
        </div>
      ) : null}

      {/* Bottom Room Navigation Bar */}
      <nav className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-3 p-4">
        {order.length > 1 ? (
          <button
            type="button"
            onClick={() => step(-1)}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/15 bg-graphite/80 px-3.5 py-2 text-xs font-medium text-paper shadow-lg backdrop-blur-md transition-colors hover:bg-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            <span aria-hidden="true">◀</span> Previous room
          </button>
        ) : null}
        <span
          className="rounded-[2px] border border-white/15 bg-graphite/80 px-4 py-2 font-display text-xs font-medium uppercase tracking-wider text-paper shadow-lg backdrop-blur-md"
          aria-live="polite"
        >
          {roomName}
        </span>
        {order.length > 1 ? (
          <button
            type="button"
            onClick={() => step(1)}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/15 bg-graphite/80 px-3.5 py-2 text-xs font-medium text-paper shadow-lg backdrop-blur-md transition-colors hover:bg-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            Next room <span aria-hidden="true">▶</span>
          </button>
        ) : null}
      </nav>

      {/* Film grain (look L2): static, mood-density, never intercepts input. */}
      {grain > 0 ? (
        <div
          aria-hidden="true"
          data-testid="film-grain"
          className="pointer-events-none absolute inset-0 z-30 motion-reduce:hidden"
          style={{
            opacity: grain,
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="160" height="160" filter="url(%23n)" opacity="0.55"/></svg>')`,
          }}
        />
      ) : null}
    </div>
  );
}
