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
import { useGalleryStore } from "@/store/gallery";

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

export function useCanvasTransform(): CanvasTransformContextValue {
  const ctx = useContext(CanvasTransformContext);
  if (!ctx) {
    throw new Error("useCanvasTransform must be used within a Canvas");
  }
  return ctx;
}

const BASE_PPM = 40; // Base pixels per meter
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.2;

export interface CanvasProps {
  children?: React.ReactNode;
}

export function Canvas({ children }: CanvasProps) {
  const [pan, setPan] = useState({ x: 200, y: 150 });
  const [zoom, setZoom] = useState(1.0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Subscribe to store rooms per-field (R11)
  const rooms = useGalleryStore((s) => s.gallery.rooms);

  const ppm = BASE_PPM * zoom;

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

  // Native non-passive wheel event listener to prevent passive console errors & browser zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;

      setZoom((currentZoom) => {
        const newZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, Number((currentZoom * delta).toFixed(2))),
        );
        const ratio = newZoom / currentZoom;
        setPan((currentPan) => ({
          x: mouseX - (mouseX - currentPan.x) * ratio,
          y: mouseY - (mouseY - currentPan.y) * ratio,
        }));
        return newZoom;
      });
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
        x: toMeters(screenX, pan.x, ppm),
        y: toMeters(screenY, pan.y, ppm),
      };
    },
    [pan.x, pan.y, ppm],
  );

  const metersToScreen = useCallback(
    (meterX: number, meterY: number) => {
      return {
        x: toScreen(meterX, pan.x, ppm),
        y: toScreen(meterY, pan.y, ppm),
      };
    },
    [pan.x, pan.y, ppm],
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
    // Middle button (button 1) or Space + Left button (button 0)
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Zoom centered around the view center
  const zoomAroundCenter = (targetZoomFn: (currentZoom: number) => number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : 400;
    const centerY = rect ? rect.height / 2 : 300;

    setZoom((currentZoom) => {
      const newZoom = targetZoomFn(currentZoom);
      const ratio = newZoom / currentZoom;
      setPan((currentPan) => ({
        x: centerX - (centerX - currentPan.x) * ratio,
        y: centerY - (centerY - currentPan.y) * ratio,
      }));
      return newZoom;
    });
  };

  const zoomIn = () => {
    zoomAroundCenter((z) =>
      Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))),
    );
  };

  const zoomOut = () => {
    zoomAroundCenter((z) =>
      Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))),
    );
  };

  const resetZoom = () => {
    setZoom(1.0);
    setPan({ x: 200, y: 150 });
  };

  const contextValue: CanvasTransformContextValue = {
    pan,
    zoom,
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
        className={`relative h-full w-full select-none overflow-hidden bg-zinc-50 ${cursorClass}`}
      >
        <svg
          ref={svgRef}
          className="h-full w-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* SVG Grid pattern offset by pan */}
          <Grid pixelsPerMeter={ppm} pan={pan} />

          {/* Grid background layer */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#editor-grid-pattern)"
          />

          {/* Transformed scene in meters */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${ppm})`}>
            {/* Store Rooms (read-only plain rectangles with names) */}
            {rooms.map((room) => (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.d}
                  fill="white"
                  stroke="#3f3f46"
                  strokeWidth={2 / ppm}
                  rx={0.05}
                  className="shadow-sm"
                />
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.d / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#27272a"
                  fontSize={Math.max(12 / ppm, 0.35)}
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {room.name}
                </text>
              </g>
            ))}

            {/* Child elements in meters space */}
            {children}
          </g>
        </svg>

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
            {Math.round(zoom * 100)}%
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
