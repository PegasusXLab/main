"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { EditorShell } from "@/components/EditorShell";
import { AddMenu } from "@/components/AddMenu";
import { Canvas } from "@/editor2d/Canvas";
import { GalleryPanel } from "@/panels/GalleryPanel";
import { RoomPanel } from "@/panels/RoomPanel";
import { ObjectPanel } from "@/panels/ObjectPanel";
import { ObjectAddPanel } from "@/panels/ObjectAddPanel";
import { FloorObjectPanel } from "@/panels/FloorObjectPanel";
import { PublishPanel } from "@/components/PublishPanel";
import { Live3DPreview } from "@/components/Live3DPreview";
import { compile } from "@/lib/compile/compile";
import { validate } from "@/lib/schema/validate";
import { startAutosave, loadAutosave } from "@/store/autosave";
import {
  redo,
  undo,
  useGalleryStore,
  type Selection,
  type View,
} from "@/store/gallery";
import { isTypingTarget, undoRedoKey } from "@/store/history";

// 3D POV: the visitor tour (same component as /g/[id]) on the live, unsaved gallery (T-124).
const TourView = dynamic(
  () => import("@/viewer3d/TourView").then((m) => m.TourView),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="loading-pov"
        className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm text-zinc-400"
      >
        Loading 3D POV...
      </div>
    ),
  },
);

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
  searchParams?: Promise<{ key?: string }>;
  selection?: Selection;
  view?: View;
}

export default function EditPage({
  params: propParams,
  searchParams: propSearchParams,
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

  // Undo / redo (T-076): Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y; Escape to deselect (T-UX); ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape") {
        select({ kind: "none" });
        return;
      }
      const action = undoRedoKey(e);
      if (!action) return;
      e.preventDefault();
      if (action === "undo") undo();
      else redo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);
  const loadGallery = useGalleryStore((s) => s.loadGallery);

  const [addingArtRoomId, setAddingArtRoomId] = useState<string | null>(null);
  const [addingObjectRoomId, setAddingObjectRoomId] = useState<string | null>(
    null,
  );
  const [replacingObjectId, setReplacingObjectId] = useState<string | null>(
    null,
  );
  const [showPublish, setShowPublish] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // When the route has an id, stay in the loading state until the server copy is in the store.
  // Otherwise the previous store contents are editable for a moment and the server copy
  // arriving later overwrites those edits (lost-title bug, T-124).
  const [isLoading, setIsLoading] = useState(Boolean(propParams));

  const view = propView ?? storeView;
  const selection = propSelection ?? storeSelection;

  // Auto-select entrance/first room when switching into 3D POV so RoomPanel is immediately active
  useEffect(() => {
    if (view === "pov" && selection.kind === "none" && gallery.rooms.length > 0) {
      select({
        kind: "room",
        id: gallery.entranceRoomId || gallery.rooms[0].id,
      });
    }
  }, [view, selection.kind, gallery.entranceRoomId, gallery.rooms, select]);

  // Resolve route params & query params (e.g. /edit/[id]?key=<k>)
  useEffect(() => {
    let unmounted = false;

    async function initParams() {
      let resolvedId: string | undefined;
      let resolvedKey: string | undefined;

      if (propParams) {
        const p = await propParams;
        resolvedId = p.id;
      } else if (typeof window !== "undefined") {
        const match = window.location.pathname.match(/\/edit\/([^/]+)/);
        if (match) resolvedId = match[1];
      }

      if (propSearchParams) {
        const sp = await propSearchParams;
        resolvedKey = sp.key;
      } else if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        resolvedKey = urlParams.get("key") ?? undefined;
      }

      if (unmounted) return;
      if (!resolvedId || resolvedId === "local") setIsLoading(false);

      if (resolvedKey) {
        setEditKey(resolvedKey);
      }

      if (resolvedId && resolvedId !== "local") {
        setGalleryId(resolvedId);
        setIsLoading(true);
        try {
          const res = await fetch(`/api/galleries/${resolvedId}`);
          if (res.status === 404) {
            setLoadError("Gallery not found (404)");
            return;
          }
          if (!res.ok) {
            setLoadError(`Failed to load gallery (${res.status})`);
            return;
          }
          const data = await res.json();
          const validation = validate(data);
          if (validation.ok) {
            loadGallery(validation.gallery);
          } else {
            setLoadError("Invalid gallery document");
          }
        } catch (err) {
          setLoadError(
            err instanceof Error ? err.message : "Error loading gallery",
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        // Local mode: check autosave
        const saved = loadAutosave("local");
        if (saved) {
          loadGallery(saved);
        }
      }
    }

    initParams();
    return () => {
      unmounted = true;
    };
  }, [propParams, propSearchParams, loadGallery]);

  // Start autosave
  useEffect(() => {
    const key = galleryId ?? "local";
    return startAutosave(useGalleryStore, key);
  }, [galleryId]);

  // Live compilation of the gallery document into SceneModel for 3D preview
  const compiled = useMemo(() => compile(gallery), [gallery]);

  // Handle panel selection: ObjectPanel takes precedence when adding art or selecting artwork
  let panel: React.ReactNode;
  if (showPublish) {
    panel = (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-4 pt-2">
          <h2 className="text-sm font-semibold text-zinc-900">Publish</h2>
          <button
            type="button"
            onClick={() => setShowPublish(false)}
            className="text-xs text-zinc-500 hover:text-zinc-800"
          >
            Close
          </button>
        </div>
        <PublishPanel
          gallery={gallery}
          id={galleryId ?? undefined}
          editKey={editKey ?? undefined}
          onPublished={(res) => {
            setGalleryId(res.id);
            setEditKey(res.editKey);
            if (typeof window !== "undefined") {
              const newUrl = `/edit/${res.id}?key=${res.editKey}`;
              window.history.replaceState(null, "", newUrl);
            }
          }}
        />
      </div>
    );
  } else if (addingArtRoomId) {
    panel = (
      <ObjectPanel
        roomId={addingArtRoomId}
        onSave={(artId) => {
          setAddingArtRoomId(null);
          select({ kind: "artwork", id: artId });
        }}
        onCancel={() => setAddingArtRoomId(null)}
      />
    );
  } else if (addingObjectRoomId) {
    panel = (
      <ObjectAddPanel
        roomId={addingObjectRoomId}
        replaceObjectId={replacingObjectId ?? undefined}
        onAdded={(objectId) => {
          setAddingObjectRoomId(null);
          setReplacingObjectId(null);
          select({ kind: "object", id: objectId });
        }}
        onCancel={() => {
          setAddingObjectRoomId(null);
          setReplacingObjectId(null);
        }}
      />
    );
  } else if (selection.kind === "object") {
    const selectedObject = (gallery.objects ?? []).find(
      (o) => o.id === selection.id,
    );
    panel = selectedObject ? (
      <FloorObjectPanel
        objectId={selectedObject.id}
        onReplace={(roomId) => {
          setReplacingObjectId(selectedObject.id);
          setAddingObjectRoomId(roomId);
        }}
        onDeleted={() => select({ kind: "none" })}
        onCancel={() => select({ kind: "none" })}
      />
    ) : (
      <GalleryPanel />
    );
  } else if (selection.kind === "artwork") {
    const selectedArt = gallery.artworks.find((a) => a.id === selection.id);
    panel = selectedArt ? (
      <ObjectPanel
        roomId={selectedArt.roomId}
        artworkId={selectedArt.id}
        onSave={() => {}}
        onCancel={() => select({ kind: "none" })}
      />
    ) : (
      <GalleryPanel />
    );
  } else if (selection.kind === "room") {
    const selectedRoom = gallery.rooms.find((r) => r.id === selection.id);
    panel = (
      <RoomPanel
        room={selectedRoom}
        onAddObject={(roomId) => setAddingArtRoomId(roomId)}
        onAddFloorObject={(roomId) => setAddingObjectRoomId(roomId)}
      />
    );
  } else {
    panel = <GalleryPanel />;
  }

  const activeRoomId =
    selection.kind === "room"
      ? selection.id
      : selection.kind === "artwork"
        ? gallery.artworks.find((a) => a.id === selection.id)?.roomId
        : selection.kind === "object"
          ? (gallery.objects ?? []).find((o) => o.id === selection.id)?.roomId
          : gallery.entranceRoomId;

  // Determine main workspace view (2D canvas or lazy 3D scene)
  const main =
    view === "2d" && isSplit ? (
      <div className="flex h-full w-full flex-col md:flex-row">
        {/* 2D Plan on Left / Top */}
        <div className="relative h-1/2 md:h-full md:w-1/2 border-b md:border-b-0 md:border-r border-hairline overflow-hidden">
          <Canvas />
          <AddMenu
            onAddArtwork={(roomId) => setAddingArtRoomId(roomId)}
            onAddObject={(roomId) => setAddingObjectRoomId(roomId)}
          />
        </div>
        {/* Live 3D Viewport on Right / Bottom */}
        <div className="relative h-1/2 md:h-full md:w-1/2 bg-zinc-950 overflow-hidden">
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded bg-black/70 px-2.5 py-1 text-xs text-white backdrop-blur">
            <span className="font-semibold">3D Split View</span>
            <button
              type="button"
              onClick={() => setIsSplit(false)}
              className="ml-1 text-zinc-400 hover:text-white transition-colors"
              title="Close split view"
            >
              ✕
            </button>
          </div>
          <Scene
            model={compiled.scene}
            mode="orbit"
            currentRoomId={activeRoomId}
            {...(selection.kind === "room"
              ? { selectedRoomId: selection.id }
              : selection.kind === "artwork"
                ? { selectedArtworkId: selection.id }
                : selection.kind === "object"
                  ? { selectedObjectId: selection.id }
                  : {})}
            onFloorClick={(roomId: string) => select({ kind: "room", id: roomId })}
            onFrameClick={(artworkId: string) =>
              select({ kind: "artwork", id: artworkId })
            }
            onObjectClick={(objectId: string) =>
              select({ kind: "object", id: objectId })
            }
          />
        </div>
      </div>
    ) : view === "2d" ? (
      <div className="relative h-full w-full">
        <Canvas />
        <AddMenu
          onAddArtwork={(roomId) => setAddingArtRoomId(roomId)}
          onAddObject={(roomId) => setAddingObjectRoomId(roomId)}
        />
        <Live3DPreview
          scene={compiled.scene}
          selectedRoomId={
            selection.kind === "room"
              ? selection.id
              : selection.kind === "artwork"
                ? gallery.artworks.find((a) => a.id === selection.id)?.roomId
                : selection.kind === "object"
                  ? (gallery.objects ?? []).find((o) => o.id === selection.id)?.roomId
                  : undefined
          }
          entranceRoomId={gallery.entranceRoomId}
          rooms={gallery.rooms}
          onSelectRoom={(roomId) => select({ kind: "room", id: roomId })}
          onExpandSplit={() => setIsSplit(true)}
          onOpenFull3D={() => setView("3d")}
        />
      </div>
    ) : view === "pov" ? (
      <TourView
        gallery={gallery}
        fill="parent"
        currentRoomId={activeRoomId}
        onRoomChange={(roomId: string) => select({ kind: "room", id: roomId })}
      />
    ) : (
      <Scene
        model={compiled.scene}
        mode="orbit"
        currentRoomId={activeRoomId}
        {...(selection.kind === "room"
          ? { selectedRoomId: selection.id }
          : selection.kind === "artwork"
            ? { selectedArtworkId: selection.id }
            : selection.kind === "object"
              ? { selectedObjectId: selection.id }
              : {})}
        onFloorClick={(roomId: string) => select({ kind: "room", id: roomId })}
        onFrameClick={(artworkId: string) =>
          select({ kind: "artwork", id: artworkId })
        }
        onObjectClick={(objectId: string) =>
          select({ kind: "object", id: objectId })
        }
      />
    );

  if (loadError) {
    return (
      <div
        data-testid="edit-load-error"
        className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center"
      >
        <h1 className="text-xl font-bold text-red-600">
          Failed to load gallery
        </h1>
        <p className="text-sm text-zinc-600">{loadError}</p>
        <Link
          href="/"
          className="rounded bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          Return to Start Screen
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        data-testid="edit-loading"
        className="flex h-screen w-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500"
      >
        Loading gallery...
      </div>
    );
  }

  return (
    <EditorShell
      title={title}
      onTitleChange={setTitle}
      view={view}
      onViewChange={setView}
      onPublish={() => setShowPublish(true)}
      panel={panel}
      main={main}
    />
  );
}
