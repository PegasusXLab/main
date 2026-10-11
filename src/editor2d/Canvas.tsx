"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Grid } from "./Grid";
import { RoomShape } from "./RoomShape";
import { ArtMarkers } from "./ArtMarkers";
import { FloorObjects, ObjectGlyphIcon } from "./FloorObjects";
import { AddRoomButtons } from "./AddRoomButtons";
import {
  ResizeHandles,
  type ResizeEdge,
  computeResizeRect,
} from "./ResizeHandles";
import { hasOverlap } from "./overlap";
import { snap } from "./snapping";
import { THEME } from "@/lib/theme";
import { useGalleryStore } from "@/store/gallery";
import type { Room } from "@/lib/schema/types";

/** Object kinds shown in the plan key, as [glyph category, label]. */
const PLAN_KEY_OBJECTS: readonly (readonly [string, string])[] = [
  ["seating", "Seating"],
  ["tables", "Table"],
  ["plants", "Plant"],
  ["light", "Lighting"],
  ["display", "Display"],
  ["objects", "Object"],
  ["model", "Your 3D file"],
];

export interface CanvasView {
  pan: { x: number; y: number };
  zoom: number;
}

/** Pure 1D conversion helpers */
export function toMeters(
  screenCoord: number,
  panOffset: number,
  ppm: number,
): number {
  return (screenCoord - panOffset) / ppm;
}

export function toScreen(
  meterCoord: number,
  panOffset: number,
  ppm: number,
): number {
  return meterCoord * ppm + panOffset;
}

/** Pure zoom calculation anchoring a specific screen point */
export function zoomAt(
  view: CanvasView,
  anchorPoint: { x: number; y: number },
  factor: number,
  minZoom = 0.25,
  maxZoom = 3.0,
): CanvasView {
  const newZoom = Math.min(
    maxZoom,
    Math.max(minZoom, Number((view.zoom * factor).toFixed(2))),
  );
  const ratio = newZoom / view.zoom;
  const newPanX = anchorPoint.x - (anchorPoint.x - view.pan.x) * ratio;
  const newPanY = anchorPoint.y - (anchorPoint.y - view.pan.y) * ratio;

  return {
    zoom: newZoom,
    pan: { x: newPanX, y: newPanY },
  };
}

export interface CanvasTransformContextValue {
  pan: { x: number; y: number };
  zoom: number;
  pixelsPerMeter: number;
  /** Converts SVG-local pixel coordinates to meters */
  screenToMeters: (
    screenX: number,
    screenY: number,
  ) => { x: number; y: number };
  /** Converts meters to SVG-local pixel coordinates */
  metersToScreen: (meterX: number, meterY: number) => { x: number; y: number };
  /** Converts browser client coordinates (from MouseEvent clientX/Y) to meters */
  clientToMeters: (
    clientX: number,
    clientY: number,
  ) => { x: number; y: number };
}

const CanvasTransformContext =
  createContext<CanvasTransformContextValue | null>(null);

export { CanvasTransformContext };

export function useCanvasTransform(): CanvasTransformContextValue {
  const ctx = useContext(CanvasTransformContext);
  if (!ctx) {
    throw new Error("useCanvasTransform must be used within a Canvas");
  }
  return ctx;
}

const BASE_PPM = 40; // Base pixels per meter
const ZOOM_STEP = 0.2;

export interface CanvasProps {
  children?: React.ReactNode;
}

export function Canvas({ children }: CanvasProps) {
  // Keep pan and zoom in a single state object to avoid desynchronization in React Strict Mode
  const [view, setView] = useState<CanvasView>({
    pan: { x: 200, y: 150 },
    zoom: 1.0,
  });

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const canvasClickPosRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Subscribe to store fields per-field (R11)
  const rooms = useGalleryStore((s) => s.gallery.rooms);
  const selection = useGalleryStore((s) => s.selection);
  const select = useGalleryStore((s) => s.select);
  const addRoom = useGalleryStore((s) => s.addRoom);
  const updateRoom = useGalleryStore((s) => s.updateRoom);
  const deleteRoom = useGalleryStore((s) => s.deleteRoom);
  const removeObject = useGalleryStore((s) => s.removeObject);

  const ppm = BASE_PPM * view.zoom;

  // Track room drag state
  const [roomDrag, setRoomDrag] = useState<{
    roomId: string;
    originX: number;
    originY: number;
    startClientX: number;
    startClientY: number;
    currentClientX: number;
    currentClientY: number;
    hasMoved: boolean;
  } | null>(null);

  // Track room edge resize state
  const [resizing, setResizing] = useState<{
    roomId: string;
    edge: ResizeEdge;
    original: { x: number; y: number; w: number; d: number };
    startClientX: number;
    startClientY: number;
    currentClientX: number;
    currentClientY: number;
  } | null>(null);

  // Track Space key for pan mode (excluding inputs, textareas, selects, and contenteditable)
  useEffect(() => {
    const isTextInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTextInput(e.target)) {
        e.preventDefault();
        if (!e.repeat) setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Keyboard shortcut: Delete removes the selected room or object; Escape deselects
  useEffect(() => {
    const isTextInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTextInput(e.target)) return;

      if (e.key === "Delete") {
        if (selection.kind === "room") {
          e.preventDefault();
          deleteRoom(selection.id);
        } else if (selection.kind === "object") {
          e.preventDefault();
          removeObject(selection.id);
        }
      } else if (e.key === "Escape") {
        select({ kind: "none" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selection, deleteRoom, removeObject, select]);

  // Native non-passive wheel event listener using pure zoomAt calculation
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;
      setView((current) => zoomAt(current, { x: mouseX, y: mouseY }, delta));
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      svg.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Screen <-> Meters conversions
  const screenToMeters = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: toMeters(screenX, view.pan.x, ppm),
        y: toMeters(screenY, view.pan.y, ppm),
      };
    },
    [view.pan.x, view.pan.y, ppm],
  );

  const metersToScreen = useCallback(
    (meterX: number, meterY: number) => {
      return {
        x: toScreen(meterX, view.pan.x, ppm),
        y: toScreen(meterY, view.pan.y, ppm),
      };
    },
    [view.pan.x, view.pan.y, ppm],
  );

  const clientToMeters = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const sx = rect ? clientX - rect.left : clientX;
      const sy = rect ? clientY - rect.top : clientY;
      return screenToMeters(sx, sy);
    },
    [screenToMeters],
  );

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    canvasClickPosRef.current = { x: e.clientX, y: e.clientY };

    // Middle button (button 1) or Space + Left button (button 0)
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: view.pan.x,
        panY: view.pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setView((current) => ({
      ...current,
      pan: {
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      },
    }));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Clicking empty canvas space adds a 6 × 6 m room snapped to 0.5 m (or deselects if overlap)
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isSpacePressed || e.button !== 0) return;
    if ((e.target as Element).closest?.("[data-room-id]")) return;
    const dx = e.clientX - canvasClickPosRef.current.x;
    const dy = e.clientY - canvasClickPosRef.current.y;
    if (Math.hypot(dx, dy) > 4) return; // Ignore drag / pan gestures

    const meterPos = clientToMeters(e.clientX, e.clientY);
    const candidate = {
      x: snap(meterPos.x),
      y: snap(meterPos.y),
      w: 6,
      d: 6,
    };

    if (!hasOverlap(candidate, rooms)) {
      const newId = addRoom(candidate);
      select({ kind: "room", id: newId });
    } else {
      select({ kind: "none" });
    }
  };

  // Dragging rooms with live snapping and overlap rejection (snap back)
  const handleRoomDragStart = useCallback(
    (room: Room, e: React.MouseEvent<SVGGElement>) => {
      if (isSpacePressed || e.button !== 0) return;
      setRoomDrag({
        roomId: room.id,
        originX: room.x,
        originY: room.y,
        startClientX: e.clientX,
        startClientY: e.clientY,
        currentClientX: e.clientX,
        currentClientY: e.clientY,
        hasMoved: false,
      });
    },
    [isSpacePressed],
  );

  useEffect(() => {
    if (!roomDrag) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - roomDrag.startClientX;
      const dy = e.clientY - roomDrag.startClientY;
      const hasMoved = roomDrag.hasMoved || Math.hypot(dx, dy) > 3;
      setRoomDrag((cur) =>
        cur
          ? {
              ...cur,
              currentClientX: e.clientX,
              currentClientY: e.clientY,
              hasMoved,
            }
          : null,
      );
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (roomDrag.hasMoved) {
        const dxMeters = (e.clientX - roomDrag.startClientX) / ppm;
        const dyMeters = (e.clientY - roomDrag.startClientY) / ppm;
        const targetRoom = rooms.find((r) => r.id === roomDrag.roomId);
        if (targetRoom) {
          const candidateX = snap(roomDrag.originX + dxMeters);
          const candidateY = snap(roomDrag.originY + dyMeters);
          const candidateRect = {
            x: candidateX,
            y: candidateY,
            w: targetRoom.w,
            d: targetRoom.d,
          };
          const overlaps = hasOverlap(candidateRect, rooms, targetRoom.id);
          // If valid move without overlap, commit to store; otherwise snap back (no store change)
          if (!overlaps) {
            if (
              candidateX !== roomDrag.originX ||
              candidateY !== roomDrag.originY
            ) {
              updateRoom(targetRoom.id, { x: candidateX, y: candidateY });
            }
          }
        }
      }
      setRoomDrag(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [roomDrag, ppm, rooms, updateRoom]);

  // Handle room edge resize start
  const handleResizeStart = useCallback(
    (edge: ResizeEdge, e: React.MouseEvent<SVGElement>) => {
      const selectedRoom = rooms.find(
        (r) => selection.kind === "room" && r.id === selection.id,
      );
      if (!selectedRoom || isSpacePressed || e.button !== 0) return;
      setResizing({
        roomId: selectedRoom.id,
        edge,
        original: {
          x: selectedRoom.x,
          y: selectedRoom.y,
          w: selectedRoom.w,
          d: selectedRoom.d,
        },
        startClientX: e.clientX,
        startClientY: e.clientY,
        currentClientX: e.clientX,
        currentClientY: e.clientY,
      });
    },
    [rooms, selection, isSpacePressed],
  );

  useEffect(() => {
    if (!resizing) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      setResizing((cur) =>
        cur
          ? {
              ...cur,
              currentClientX: e.clientX,
              currentClientY: e.clientY,
            }
          : null,
      );
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      const dxMeters = (e.clientX - resizing.startClientX) / ppm;
      const dyMeters = (e.clientY - resizing.startClientY) / ppm;
      const candidateRect = computeResizeRect(
        resizing.original,
        resizing.edge,
        dxMeters,
        dyMeters,
      );
      const overlaps = hasOverlap(candidateRect, rooms, resizing.roomId);
      // If valid resize without overlap, update room; otherwise snap back to original dimensions
      if (!overlaps) {
        updateRoom(resizing.roomId, candidateRect);
      }
      setResizing(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [resizing, ppm, rooms, updateRoom]);

  // Compute active drag offset and overlap state
  let activeDragOffset: { x: number; y: number } | null = null;
  let activeDragOverlap = false;

  if (roomDrag && roomDrag.hasMoved) {
    const dxMeters = (roomDrag.currentClientX - roomDrag.startClientX) / ppm;
    const dyMeters = (roomDrag.currentClientY - roomDrag.startClientY) / ppm;
    const candidateX = snap(roomDrag.originX + dxMeters);
    const candidateY = snap(roomDrag.originY + dyMeters);
    activeDragOffset = {
      x: candidateX - roomDrag.originX,
      y: candidateY - roomDrag.originY,
    };
    const targetRoom = rooms.find((r) => r.id === roomDrag.roomId);
    if (targetRoom) {
      activeDragOverlap = hasOverlap(
        {
          x: candidateX,
          y: candidateY,
          w: targetRoom.w,
          d: targetRoom.d,
        },
        rooms,
        targetRoom.id,
      );
    }
  }

  // Zoom centered around the view center
  const zoomAroundCenter = (factor: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 400;
    const centerY = rect ? rect.height / 2 : 300;

    setView((current) => zoomAt(current, { x: centerX, y: centerY }, factor));
  };

  const zoomIn = () => {
    zoomAroundCenter(1 + ZOOM_STEP);
  };

  const zoomOut = () => {
    zoomAroundCenter(1 - ZOOM_STEP);
  };

  const resetZoom = () => {
    setView({
      pan: { x: 200, y: 150 },
      zoom: 1.0,
    });
  };

  const contextValue: CanvasTransformContextValue = {
    pan: view.pan,
    zoom: view.zoom,
    pixelsPerMeter: ppm,
    screenToMeters,
    metersToScreen,
    clientToMeters,
  };

  const cursorClass = isDragging
    ? "cursor-grabbing"
    : isSpacePressed
      ? "cursor-grab"
      : "cursor-default";

  return (
    <CanvasTransformContext.Provider value={contextValue}>
      <div
        className={`relative h-full w-full select-none overflow-hidden bg-[#eff0ee] ${cursorClass}`}
        style={{ backgroundColor: THEME.colors.plaster }}
      >
        <svg
          ref={svgRef}
          className="h-full w-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {/* SVG Grid pattern offset by pan */}
          <Grid pixelsPerMeter={ppm} pan={view.pan} />

          {/* Grid background layer */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#editor-grid-pattern)"
          />

          {/* Transformed scene in meters */}
          <g
            transform={`translate(${view.pan.x}, ${view.pan.y}) scale(${ppm})`}
          >
            {/* Interactive 2D Rooms */}
            {rooms.map((room) => {
              const isSelected =
                selection.kind === "room" && selection.id === room.id;
              const isDraggingThis =
                roomDrag?.roomId === room.id && roomDrag.hasMoved;

              return (
                <RoomShape
                  key={room.id}
                  room={room}
                  isSelected={isSelected}
                  isDragging={isDraggingThis}
                  dragOffset={isDraggingThis ? activeDragOffset : null}
                  hasDragOverlap={isDraggingThis ? activeDragOverlap : false}
                  ppm={ppm}
                  onSelect={(id) => select({ kind: "room", id })}
                  onDragStart={handleRoomDragStart}
                />
              );
            })}

            {/* Free-standing object markers (above floors, below art markers) */}
            <FloorObjects ppm={ppm} />

            {/* Artwork markers on walls */}
            <ArtMarkers ppm={ppm} />

            {/* Resize handles and Add Room buttons on selected room */}
            {selection.kind === "room" &&
              !roomDrag?.hasMoved &&
              !resizing &&
              (() => {
                const selectedRoom = rooms.find((r) => r.id === selection.id);
                return selectedRoom ? (
                  <>
                    <ResizeHandles
                      room={selectedRoom}
                      ppm={ppm}
                      onResizeStart={handleResizeStart}
                    />
                    <AddRoomButtons
                      room={selectedRoom}
                      rooms={rooms}
                      ppm={ppm}
                      onAddAdjacent={(candidateRect) => {
                        const newId = addRoom(candidateRect);
                        select({ kind: "room", id: newId });
                      }}
                    />
                  </>
                ) : null;
              })()}

            {/* Active resize preview */}
            {resizing &&
              (() => {
                const dxMeters =
                  (resizing.currentClientX - resizing.startClientX) / ppm;
                const dyMeters =
                  (resizing.currentClientY - resizing.startClientY) / ppm;
                const candidateRect = computeResizeRect(
                  resizing.original,
                  resizing.edge,
                  dxMeters,
                  dyMeters,
                );
                const overlaps = hasOverlap(
                  candidateRect,
                  rooms,
                  resizing.roomId,
                );
                return (
                  <rect
                    data-testid="resize-preview"
                    x={candidateRect.x}
                    y={candidateRect.y}
                    width={candidateRect.w}
                    height={candidateRect.d}
                    fill={overlaps ? "#fef2f2" : "none"}
                    fillOpacity={overlaps ? 0.3 : 0}
                    stroke={
                      overlaps ? THEME.colors.danger : THEME.colors.accent
                    }
                    strokeWidth={2 / ppm}
                    strokeDasharray={`${4 / ppm} ${4 / ppm}`}
                    className="pointer-events-none"
                  />
                );
              })()}

            {/* Child elements in meters space */}
            {children}
          </g>
        </svg>

        {/* Plan key: what the marks on the plan mean */}
        <div
          data-testid="canvas-plan-legend"
          className="absolute bottom-4 left-4 z-10 flex flex-col rounded-md border border-hairline bg-paper/95 text-graphite shadow-sm backdrop-blur"
        >
          {showLegend ? (
            <div className="flex w-60 flex-col gap-2.5 p-3 text-xs">
              <div className="flex items-center justify-between border-b border-hairline pb-1.5">
                <span className="font-semibold">Plan key</span>
                <button
                  type="button"
                  onClick={() => setShowLegend(false)}
                  className="rounded px-1 text-pencil transition-colors hover:bg-plaster hover:text-graphite"
                  aria-label="Close plan key"
                >
                  ✕
                </button>
              </div>
              <ul className="flex flex-col gap-1.5 text-[11px]">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-4 shrink-0 rounded-full bg-graphite" />
                  Artwork on a wall
                </li>
                {PLAN_KEY_OBJECTS.map(([category, label]) => (
                  <li key={category} className="flex items-center gap-2">
                    <ObjectGlyphIcon category={category} className="h-4 w-4 shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-0.5 border-t border-hairline pt-1.5 text-[10px] text-pencil">
                <span>Drag a marker to move it</span>
                <span>[ and ] rotate a selected object 15°</span>
                <span>Fine-tune position in the side panel</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid="canvas-plan-legend-toggle"
              onClick={() => setShowLegend(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-pencil transition-colors hover:text-graphite"
              aria-expanded={false}
            >
              Plan key
            </button>
          )}
        </div>

        {/* Footer controls: Zoom [-] [+] and percentage indicator */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-md border border-zinc-300 bg-white/90 p-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom out"
            aria-label="Zoom out"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-zinc-100 active:bg-zinc-200"
          >
            -
          </button>
          <button
            type="button"
            onClick={resetZoom}
            title="Reset zoom"
            aria-label="Reset zoom"
            className="px-2 py-0.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900"
          >
            {Math.round(view.zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            title="Zoom in"
            aria-label="Zoom in"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-zinc-100 active:bg-zinc-200"
          >
            +
          </button>
        </div>
      </div>
    </CanvasTransformContext.Provider>
  );
}

export default Canvas;
