"use client";

// Viewer (F8, plan.md §3.5): /g/<id> loads a published gallery and tours it in 3D.
// Read-only: no editing UI, and the edit key is never needed or shown.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import { validate } from "@/lib/schema/validate";
import { Plaque } from "@/viewer3d/Plaque";
import { roomOrder } from "@/viewer3d/roomOrder";

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
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-900 text-zinc-300">
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
        <div className="text-center">
          <p className="text-lg">This gallery doesn’t exist.</p>
          <p className="mt-1 text-sm text-zinc-400">
            Check the link you were given.
          </p>
        </div>
      </Centered>
    );
  if (load.state === "error")
    return (
      <Centered>This gallery couldn’t be loaded. Try again later.</Centered>
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

  const roomName = gallery.rooms.find((r) => r.id === roomId)?.name ?? "";
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

  const goTo = useCallback((id: string) => {
    setFocusId(undefined);
    setRoomId(id);
  }, []);
  const step = (delta: number) => {
    const i = order.indexOf(roomId);
    goTo(order[(i + delta + order.length) % order.length]);
  };
  const onFrameClick = useCallback(
    (artworkId: string) => {
      const art = gallery.artworks.find((a) => a.id === artworkId);
      if (!art) return;
      setRoomId(art.roomId);
      setFocusId(artworkId);
    },
    [gallery.artworks],
  );
  const closePlaque = useCallback(() => setFocusId(undefined), []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Scene
        model={scene}
        mode="travel"
        currentRoomId={roomId}
        focusArtworkId={focusId}
        onFloorClick={goTo}
        onFrameClick={onFrameClick}
        largeImages={largeImages}
        className="h-full w-full"
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 text-white">
        <h1 className="text-xl font-semibold">
          {gallery.title || "Untitled gallery"}
        </h1>
      </header>

      {focused ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center px-4">
          <Plaque
            title={focused.title}
            artist={focused.artist}
            story={focused.story}
            onClose={closePlaque}
          />
        </div>
      ) : null}

      <nav className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 p-4 text-white">
        {order.length > 1 ? (
          <button
            type="button"
            onClick={() => step(-1)}
            className="rounded bg-black/60 px-3 py-2"
          >
            ◀ Previous room
          </button>
        ) : null}
        <span className="rounded bg-black/60 px-3 py-2" aria-live="polite">
          {roomName}
        </span>
        {order.length > 1 ? (
          <button
            type="button"
            onClick={() => step(1)}
            className="rounded bg-black/60 px-3 py-2"
          >
            Next room ▶
          </button>
        ) : null}
      </nav>
    </div>
  );
}
