"use client";

// TourView (T-124): the visitor tour of a gallery, shared by the viewer (/g/[id]) and the
// editor's live "3D POV" view. Travel, Prev/Next, doorway/floor clicks, drag-look, plaque,
// arrival title, minimap and room audio all live here; it reads only the Gallery it's given.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { RoomAudio } from "@/audio/RoomAudio";
import { useNarrationStore } from "@/audio/narrationStore";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import { Minimap } from "./Minimap";
import { CreatorChip, CreatorPanel } from "./CreatorPanel";
import { useSpinStore } from "@/audio/spinStore";
import { useGuestbookStore } from "./guestbookStore";
import { hasCreator } from "@/lib/promo";
import { InspectPanel, ITEM_AUDIO_DELAY_MS, type InspectItem } from "./InspectPanel";
import { isInspectable } from "@/lib/inspect";
import { RoomTitle } from "./RoomTitle";
import { TourNav } from "./TourNav";
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

/** Beat between arriving in a room and its music / narration starting. */
export const ARRIVAL_AUDIO_DELAY_MS = 1000;

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
  const [creatorOpen, setCreatorOpen] = useState(false);
  const creator = hasCreator(gallery.creator) ? gallery.creator : undefined;

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
    if (titleFont === "custom") void loadCustomFont(customFontUrl);
  }, [titleFont, customFontUrl]);

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

  // Items visitors can open in this room (artworks first, then objects), for previous / next.
  const inspectables = useMemo<InspectItem[]>(() => {
    const arts = gallery.artworks
      .filter((a) => a.roomId === roomId && isInspectable(a, "artwork"))
      .map((a): InspectItem => ({ id: a.id, kind: "artwork", title: a.title, artist: a.artist, story: a.story, facts: a.facts, link: a.link, action: a.action, price: a.price, voiceOver: a.voiceOver, track: a.track }));
    const objs = (gallery.objects ?? [])
      .filter((o) => o.roomId === roomId && isInspectable(o, "object"))
      .map((o): InspectItem => ({ id: o.id, kind: "object", title: o.title, artist: o.artist, story: o.story, facts: o.facts, link: o.link, action: o.action, price: o.price, voiceOver: o.voiceOver, device: o.device }));
    return [...arts, ...objs];
  }, [gallery.artworks, gallery.objects, roomId]);
  // Everything in the gallery visitors can open (hover cue + click), across rooms.
  const inspectableIds = useMemo(
    () =>
      new Set([
        ...gallery.artworks.filter((a) => isInspectable(a, "artwork")).map((a) => a.id),
        ...(gallery.objects ?? []).filter((o) => isInspectable(o, "object")).map((o) => o.id),
      ]),
    [gallery.artworks, gallery.objects],
  );
  const inspectIndex = plaque ? inspectables.findIndex((i) => i.id === plaque.id) : -1;
  const inspecting = inspectIndex >= 0 ? inspectables[inspectIndex] : null;

  // The camera reports when it walks / glides; the title waits until the visitor has arrived.
  const [cameraMoving, setCameraMoving] = useState(false);
  const isHudVisible = Boolean(roomName) && !focusId && !hudDismissed && !cameraMoving;

  const playNarration = useNarrationStore((s) => s.playNarration);
  const stopNarration = useNarrationStore((s) => s.stopNarration);
  const isAudioGuideMuted = useNarrationStore((s) => s.muted);

  // "Arrived": the camera has stood still in a room for a beat. Room music and the room's
  // narration start then (not while walking); closing an inspection in the same room doesn't
  // count as arriving again.
  const [arrivedRoomId, setArrivedRoomId] = useState<string | null>(null);
  useEffect(() => {
    if (cameraMoving || arrivedRoomId === roomId) return;
    const t = setTimeout(() => setArrivedRoomId(roomId), ARRIVAL_AUDIO_DELAY_MS);
    return () => clearTimeout(t);
  }, [cameraMoving, roomId, arrivedRoomId]);

  // Leaving a room stops its voice right away.
  useEffect(() => {
    stopNarration();
  }, [roomId, stopNarration]);

  // The first arrival in a room this session reads its narration; after that it waits for the
  // visitor to replay it (the "Listen" chip on the room title, or the audio pill).
  const hasVisitedRoom = useNarrationStore((s) => s.hasVisitedRoom);
  const markRoomVisited = useNarrationStore((s) => s.markRoomVisited);
  useEffect(() => {
    if (!arrivedRoomId) return;
    const room = gallery.rooms.find((r) => r.id === arrivedRoomId);
    if (!room?.narration?.audioUrl || isAudioGuideMuted || hasVisitedRoom(arrivedRoomId)) return;
    markRoomVisited(arrivedRoomId);
    playNarration({
      url: room.narration.audioUrl,
      title: room.name,
      voiceName: room.narration.voiceName || "Docent",
      text: room.narration.text,
    });
    // Only on arrival; not when the gallery is edited live or the guide is toggled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivedRoomId]);

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
  const roomNames = useMemo(
    () => Object.fromEntries(gallery.rooms.map((r) => [r.id, r.name])),
    [gallery.rooms],
  );
  const onFrameClick = useCallback(
    (artworkId: string) => {
      if (wasDrag.current) return;
      const art = gallery.artworks.find((a) => a.id === artworkId);
      if (!art || !isInspectable(art, "artwork")) return;
      setRoomId(art.roomId);
      onRoomChange?.(art.roomId);
      setCreatorOpen(false);
      setFocusId(artworkId);
    },
    [gallery.artworks, onRoomChange],
  );
  const onObjectClick = useCallback(
    (objectId: string) => {
      if (wasDrag.current) return;
      const obj = gallery.objects?.find((o) => o.id === objectId);
      if (!obj || !isInspectable(obj, "object")) return;
      setRoomId(obj.roomId);
      onRoomChange?.(obj.roomId);
      setCreatorOpen(false);
      setFocusId(objectId);
    },
    [gallery.objects, onRoomChange],
  );
  const closePlaque = useCallback(() => setFocusId(undefined), []);

  // Shared links (?piece=<id>) open straight onto that piece.
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (openedFromLink.current || typeof window === "undefined") return;
    const piece = new URLSearchParams(window.location.search).get("piece");
    if (!piece) return;
    // Marked inside the frame callback so a dev double-mount (cleanup cancels it) still opens it.
    const id = requestAnimationFrame(() => {
      openedFromLink.current = true;
      if (gallery.artworks.some((a) => a.id === piece)) onFrameClick(piece);
      else if (gallery.objects?.some((o) => o.id === piece)) onObjectClick(piece);
    });
    return () => cancelAnimationFrame(id);
  }, [gallery.artworks, gallery.objects, onFrameClick, onObjectClick]);

  // A track chosen at a listening station / album cover plays in its room only.
  useEffect(() => {
    useSpinStore.getState().stop();
    useSpinStore.getState().setHold(false);
  }, [roomId]);
  useEffect(() => () => useSpinStore.getState().stop(), []);

  // The guestbook's signatures (the 3D book shows the latest on its pages).
  const hasGuestbook = (gallery.objects ?? []).some((o) => o.device?.kind === "guestbook");
  useEffect(() => {
    if (hasGuestbook) void useGuestbookStore.getState().load(gallery.id);
  }, [hasGuestbook, gallery.id]);
  const openCreator = useCallback(() => {
    setFocusId(undefined);
    setCreatorOpen(true);
  }, []);
  const closeCreator = useCallback(() => setCreatorOpen(false), []);
  const stepItem = (delta: number) => {
    if (!inspectables.length) return;
    const next = inspectables[(Math.max(0, inspectIndex) + delta + inspectables.length) % inspectables.length];
    setFocusId(next.id);
  };

  // An item's voiceover reads the first time it's opened this session (after the camera glides
  // in); replay from the panel. It stops when the inspection closes.
  const hasVisitedItem = useNarrationStore((s) => s.hasVisitedItem);
  const markItemVisited = useNarrationStore((s) => s.markItemVisited);
  const inspectAudio = inspecting?.voiceOver?.audioUrl;
  useEffect(() => {
    if (!inspecting || !inspectAudio || isAudioGuideMuted || hasVisitedItem(inspecting.id)) return;
    const item = inspecting;
    const t = setTimeout(() => {
      markItemVisited(item.id);
      playNarration({
        url: inspectAudio,
        title: item.title || "Artwork",
        voiceName: item.voiceOver?.voiceName || "Docent",
        text: item.voiceOver?.text,
      });
    }, ITEM_AUDIO_DELAY_MS);
    return () => {
      clearTimeout(t);
      if (useNarrationStore.getState().activeUrl === inspectAudio) stopNarration();
    };
    // Per item; not on live edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspecting?.id, inspectAudio]);

  // While inspecting, frame the piece beside the panel (desktop: right column; phone: bottom sheet).
  const [wide, setWide] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const viewShift = useMemo(() => {
    if (!inspecting) return undefined;
    if (!wide) return { x: 0, y: 0.24 };
    const w = typeof window !== "undefined" ? window.innerWidth : 1280;
    const panel = Math.min(480, 0.42 * w);
    return { x: panel / 2 / w, y: 0 };
  }, [inspecting, wide]);

  // Replay the current room's narration (room title chip).
  const listenToRoom =
    currentRoom?.narration?.audioUrl
      ? () => {
          if (isAudioGuideMuted) useNarrationStore.getState().setMuted(false);
          playNarration({
            url: currentRoom.narration!.audioUrl!,
            title: currentRoom.name,
            voiceName: currentRoom.narration!.voiceName || "Docent",
            text: currentRoom.narration!.text,
          });
        }
      : undefined;
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
        onMovingChange={setCameraMoving}
        roomNames={roomNames}
        viewShift={viewShift}
        inspectableIds={inspectableIds}
        className="h-full w-full"
      />

      {/* Top Header Bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-4 bg-gradient-to-b from-black/35 to-transparent p-4 text-paper">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-[2px] border border-white/10 bg-graphite/80 px-3.5 py-1.5 shadow-lg backdrop-blur-md">
            <h1 className="text-sm font-semibold tracking-wide text-paper">
              {gallery.title || "Untitled gallery"}
            </h1>
          </div>
          {creator ? <CreatorChip creator={creator} onOpen={openCreator} /> : null}
        </div>
        {/* Room music + Audio Guide (F9, F10); the header ignores clicks, the controls don't. */}
        <div className="pointer-events-auto flex items-center gap-2">
          <RoomAudio gallery={gallery} currentRoomId={arrivedRoomId ?? undefined} waiting={!arrivedRoomId} />
        </div>
      </header>

      {/* Minimap (T-075, T-082, T-083): a movable, resizable, collapsible panel on desktop,
          a Map button + sheet on phones. */}
      <Minimap model={scene} currentRoomId={roomId} onRoomClick={goTo} />

      {/* Room arrival title (floats in after the walk, away while a plaque is open) */}
      {roomName ? (
        <RoomTitle
          key={roomId}
          name={roomName}
          description={roomDesc}
          fontFamily={roomFontFamily}
          position={titlePosition}
          color={currentRoom?.titleColor}
          variant={currentRoom?.titleStyle}
          index={Math.max(1, order.indexOf(roomId) + 1)}
          count={order.length}
          visible={isHudVisible}
          onDismiss={() => setHudDismissed(true)}
          onListen={listenToRoom}
        />
      ) : null}

      {/* Item inspection: side panel (bottom sheet on phones); ✕ or Esc closes it. */}
      <InspectPanel
        item={inspecting}
        fontFamily={roomFontFamily}
        galleryId={gallery.id}
        index={inspectIndex + 1}
        count={inspectables.length}
        onPrev={() => stepItem(-1)}
        onNext={() => stepItem(1)}
        onClose={closePlaque}
      />

      {/* Creator profile: "by <name>" in the header opens their bio and links. */}
      {creator ? (
        <CreatorPanel creator={creator} open={creatorOpen && !inspecting} fontFamily={roomFontFamily} onClose={closeCreator} />
      ) : null}

      {/* Room wayfinding: previous / next and a dot per room */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300 ${
          inspecting || creatorOpen ? "opacity-0 [&_*]:!pointer-events-none" : "opacity-100"
        }`}
      >
        <TourNav order={order} currentRoomId={roomId} roomNames={roomNames} onGo={goTo} />
      </div>

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
