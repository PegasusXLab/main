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
}

export function TourView({ gallery, fill = "screen" }: TourViewProps) {
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
  return <Tour gallery={gallery} fill={fill} />;
}

function Tour({
  gallery,
  fill,
}: {
  gallery: Gallery;
  fill: "screen" | "parent";
}) {
  const { scene } = useMemo(() => compile(gallery), [gallery]);
  const order = useMemo(
    () => roomOrder(scene, gallery.entranceRoomId),
    [scene, gallery.entranceRoomId],
  );
  const [chosenRoomId, setRoomId] = useState(order[0]);
  // Live editing can delete the room we're in; fall back to the first room in tour order.
  const roomId = order.includes(chosenRoomId) ? chosenRoomId : order[0];
  const [focusId, setFocusId] = useState<string | undefined>();

  // Room arrival title state ("Opening Night" moment)
  const [arrivalState, setArrivalState] = useState<{
    roomId: string;
    name: string;
    visible: boolean;
  } | null>(null);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roomName = gallery.rooms.find((r) => r.id === roomId)?.name ?? "";

  // Adjust arrival title state when roomId changes during render
  if (roomName && arrivalState?.roomId !== roomId) {
    setArrivalState({
      roomId,
      name: roomName,
      visible: true,
    });
  }

  useEffect(() => {
    if (arrivalState?.visible) {
      if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
      arrivalTimerRef.current = setTimeout(() => {
        setArrivalState((prev) => (prev ? { ...prev, visible: false } : null));
      }, 1500);
    }
    return () => {
      if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
    };
  }, [arrivalState?.roomId, arrivalState?.visible]);

  const focused = focusId
    ? gallery.artworks.find((a) => a.id === focusId)
    : undefined;
  const focusedObject = !focused && focusId
    ? gallery.objects?.find((o) => o.id === focusId)
    : undefined;
  const plaque = focused ?? focusedObject;
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

  const goTo = useCallback((id: string) => {
    if (wasDrag.current) return;
    setFocusId(undefined);
    setRoomId(id);
  }, []);
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
      setFocusId(artworkId);
    },
    [gallery.artworks],
  );
  const onObjectClick = useCallback(
    (objectId: string) => {
      if (wasDrag.current) return;
      const obj = gallery.objects?.find((o) => o.id === objectId);
      if (!obj) return;
      setRoomId(obj.roomId);
      setFocusId(objectId);
    },
    [gallery.objects],
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
        largeImages={largeImages}
        className="h-full w-full"
      />

      {/* Top Header Bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-4 text-paper">
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

      {/* Room Arrival Title Banner ("Opening Night" moment) */}
      {arrivalState?.name ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <div
            className={`transition-opacity motion-reduce:transition-none ${
              arrivalState.visible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transitionDuration: arrivalState.visible ? "180ms" : "400ms",
            }}
          >
            <span className="select-none px-6 py-2 text-center font-display text-2xl font-semibold uppercase tracking-widest text-paper/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-3xl">
              {arrivalState.name}
            </span>
          </div>
        </div>
      ) : null}

      {/* Artwork / object Plaque Card */}
      {plaque ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center px-4">
          <Plaque
            title={plaque.title}
            artist={plaque.artist}
            story={plaque.story}
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
    </div>
  );
}
