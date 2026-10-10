"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { EditorShell } from "@/components/EditorShell";
import { Canvas } from "@/editor2d/Canvas";
import { GalleryPanel } from "@/panels/GalleryPanel";
import { RoomPanel } from "@/panels/RoomPanel";
import { ObjectPanel } from "@/panels/ObjectPanel";
import { PublishPanel } from "@/components/PublishPanel";
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

  // Undo / redo (T-076): Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y; ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const action = undoRedoKey(e);
      if (!action) return;
      e.preventDefault();
      if (action === "undo") undo();
      else redo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const loadGallery = useGalleryStore((s) => s.loadGallery);

  const [addingArtRoomId, setAddingArtRoomId] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const view = propView ?? storeView;
  const selection = propSelection ?? storeSelection;

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
      />
    );
  } else {
    panel = <GalleryPanel />;
  }

  // Determine main workspace view (2D canvas or lazy 3D scene)
  const main =
    view === "2d" ? (
      <Canvas />
    ) : view === "pov" ? (
      <TourView gallery={gallery} fill="parent" />
    ) : (
      <Scene
        model={compiled.scene}
        mode="orbit"
        currentRoomId={
          selection.kind === "room"
            ? selection.id
            : selection.kind === "artwork"
              ? gallery.artworks.find((a) => a.id === selection.id)?.roomId
              : gallery.entranceRoomId
        }
        {...(selection.kind === "room"
          ? { selectedRoomId: selection.id }
          : selection.kind === "artwork"
            ? { selectedArtworkId: selection.id }
            : {})}
        onFloorClick={(roomId: string) => select({ kind: "room", id: roomId })}
        onFrameClick={(artworkId: string) =>
          select({ kind: "artwork", id: artworkId })
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
