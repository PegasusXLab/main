"use client";

// Viewer (F8, plan.md §3.5): /g/<id> loads a published gallery and tours it in 3D.
// Read-only: no editing UI, and the edit key is never needed or shown.

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { RoomAudio } from "@/audio/RoomAudio";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import { validate } from "@/lib/schema/validate";
import { Plaque } from "@/viewer3d/Plaque";
import { roomOrder } from "@/viewer3d/roomOrder";
import { Minimap } from "@/viewer3d/Minimap";

const Scene = dynamic(() => import("@/viewer3d/Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <Centered>Loading gallery…</Centered>,
});

type Load =
  | { state: "loading" }
  | { state: "missing" }
  | { state: "error" }
  | { state: "ready"; gallery: Gallery };

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-graphite text-pencil font-sans">
      {children}
    </div>
  );
}

// With Cache Components on, useParams() must run inside a Suspense boundary (Next 16.4 docs).
export default function ViewerPage() {
  return (
    <Suspense fallback={<Centered>Loading gallery…</Centered>}>
      <Viewer />
    </Suspense>
  );
}

function Viewer() {
  const { id } = useParams<{ id: string }>();
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/galleries/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setLoad({ state: "missing" });
        if (!res.ok) return setLoad({ state: "error" });
        const result = validate(await res.json());
        setLoad(
          result.ok
            ? { state: "ready", gallery: result.gallery }
            : { state: "error" },
        );
      })
      .catch(() => !cancelled && setLoad({ state: "error" }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (load.state === "loading") return <Centered>Loading gallery…</Centered>;
  if (load.state === "missing")
    return (
      <Centered>
        <div className="max-w-sm rounded-[2px] border border-hairline/20 bg-graphite/90 p-6 text-center shadow-xl">
          <p className="text-base font-semibold text-paper">
            This gallery doesn’t exist.
          </p>
          <p className="mt-1.5 text-xs text-pencil">
            Check the link you were given.
          </p>
        </div>
      </Centered>
    );
  if (load.state === "error")
    return (
      <Centered>
        <div className="max-w-sm rounded-[2px] border border-hairline/20 bg-graphite/90 p-6 text-center text-sm font-medium text-danger shadow-xl">
          This gallery couldn’t be loaded. Try again later.
        </div>
      </Centered>
    );
  return <Tour gallery={load.gallery} />;
}

function Tour({ gallery }: { gallery: Gallery }) {
  const { scene } = useMemo(() => compile(gallery), [gallery]);
  const order = useMemo(
    () => roomOrder(scene, gallery.entranceRoomId),
    [scene, gallery.entranceRoomId],
  );
  const [roomId, setRoomId] = useState(order[0]);
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
      className="relative h-screen w-screen overflow-hidden bg-black"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Scene
        model={scene}
        mode="travel"
        currentRoomId={roomId}
        focusArtworkId={focusId}
        onFloorClick={goTo}
        onDoorwayClick={onDoorwayClick}
        onFrameClick={onFrameClick}
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

      {/* Artwork Plaque Card */}
      {focused ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center px-4">
          <Plaque
            title={focused.title}
            artist={focused.artist}
            story={focused.story}
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
