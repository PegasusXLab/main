"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { EditorShell } from "@/components/EditorShell";
import { Canvas } from "@/editor2d/Canvas";
import { GalleryPanel } from "@/panels/GalleryPanel";
import { RoomPanel } from "@/panels/RoomPanel";
import { compile } from "@/lib/compile/compile";
import { useGalleryStore, type Selection, type View } from "@/store/gallery";

// 3D Scene loaded lazily so three.js is not included in initial 2D load (AC: no three.js on initial 2D load)
const Scene = dynamic(() => import("@/viewer3d/Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => (
    <div
      data-testid="loading-3d"
      className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm text-zinc-400"
    >
      Loading 3D preview...
    </div>
  ),
});

export interface EditPageProps {
  params?: Promise<{ id: string }>;
  selection?: Selection;
  view?: View;
}

export default function EditPage({
  selection: propSelection,
  view: propView,
}: EditPageProps = {}) {
  // Subscribe to store per-field (R11)
  const gallery = useGalleryStore((s) => s.gallery);
  const title = useGalleryStore((s) => s.gallery.title);
  const setTitle = useGalleryStore((s) => s.setTitle);
  const storeView = useGalleryStore((s) => s.view);
  const setView = useGalleryStore((s) => s.setView);
  const storeSelection = useGalleryStore((s) => s.selection);
  const select = useGalleryStore((s) => s.select);

  const view = propView ?? storeView;
  const selection = propSelection ?? storeSelection;

  // Live compilation of the gallery document into SceneModel for 3D preview
  const compiled = useMemo(() => compile(gallery), [gallery]);

  // Determine active side panel based on selection
  const selectedRoom =
    selection.kind === "room"
      ? gallery.rooms.find((r) => r.id === selection.id)
      : undefined;
  const panel =
    selection.kind === "room" ? (
      <RoomPanel room={selectedRoom} />
    ) : (
      <GalleryPanel />
    );

  // Determine main workspace view (2D canvas or lazy 3D scene)
  const main =
    view === "2d" ? (
      <Canvas />
    ) : (
      <Scene
        model={compiled.scene}
        currentRoomId={
          selection.kind === "room" ? selection.id : gallery.entranceRoomId
        }
        onFloorClick={(roomId: string) => select({ kind: "room", id: roomId })}
      />
    );

  return (
    <EditorShell
      title={title}
      onTitleChange={setTitle}
      view={view}
      onViewChange={setView}
      onPublish={() => {}}
      panel={panel}
      main={main}
    />
  );
}
