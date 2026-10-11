import React, { useCallback, useContext, useMemo, useState } from "react";
import { THEME } from "@/lib/theme";
import type { GalleryObject, Room } from "@/lib/schema/types";
import { libraryEntry } from "@/lib/objects/library";
import {
  useGalleryStore,
  type Selection,
  type ObjectPatch,
} from "@/store/gallery";
import { CanvasTransformContext } from "./Canvas";

/** Room-edge margin kept clear when dragging an object, meters. */
export const OBJECT_ROOM_MARGIN = 0.3;
/** Drag snap step, meters. */
export const OBJECT_SNAP = 0.1;
/** Rotation snap step, degrees. */
export const OBJECT_ROTATION_SNAP = 15;

/** Pure: marker footprint side, meters (square, or circle diameter when round). */
export function computeObjectFootprint(obj: Pick<GalleryObject, "height">): number {
  const h = Number.isFinite(obj?.height) ? obj.height : 1.0;
  return Math.min(1.5, Math.max(0.4, h));
}

/** Pure: snap a value to the 0.1 m grid (Shift bypasses snapping). */
export function snapPosition(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Pure: clamp a room-relative center so the marker keeps the edge margin. */
export function clampObjectPosition(
  dim: number,
  center: number,
  side: number,
): number {
  const lo = OBJECT_ROOM_MARGIN + side / 2;
  const hi = dim - OBJECT_ROOM_MARGIN - side / 2;
  if (hi < lo) return dim / 2;
  return Math.min(hi, Math.max(lo, center));
}

/** Pure: snap degrees to 15°, normalized to [0, 360). */
export function snapRotation(deg: number): number {
  const normalized = ((deg % 360) + 360) % 360;
  return (Math.round(normalized / OBJECT_ROTATION_SNAP) * OBJECT_ROTATION_SNAP) % 360;
}

/** Pure: pointer angle (meters, marker-relative) to rotation degrees, 0 = +y. */
export function pointerAngleToRotation(dx: number, dy: number): number {
  return snapRotation((Math.atan2(dx, dy) * 180) / Math.PI);
}

export function createObjectMarkerClickHandler(
  id: string,
  onSelect: (id: string) => void,
) {
  return (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(id);
  };
}

/** Glyph category for an object: its library category, or "model" for an uploaded .glb. */
export function objectCategory(source: GalleryObject["source"]): string {
  if (source.kind === "library") return libraryEntry(source.libraryId)?.category ?? "objects";
  if (source.kind === "model") return "model";
  return "display";
}

/** The marker glyph as a standalone icon (plan key, room panel lists). */
export function ObjectGlyphIcon({
  category,
  className,
}: {
  category: string | undefined;
  className?: string;
}) {
  return (
    <svg viewBox="-0.5 -0.5 1 1" aria-hidden="true" className={className}>
      {renderObjectGlyph(category, 1.15, "currentColor", 14)}
    </svg>
  );
}

/** Renders a distinct vector glyph inside a 2D floor object marker to indicate its category. */
export function renderObjectGlyph(
  category: string | undefined,
  side: number,
  color: string,
  ppm: number,
) {
  const s = side * 0.42;
  const sw = Math.max(1.2 / ppm, 0.02);
  switch (category) {
    case "seating":
      return (
        <g stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x={-s * 0.45} y={-s * 0.45} width={s * 0.9} height={s * 0.9} rx={s * 0.15} />
          <line x1={-s * 0.35} y1={-s * 0.1} x2={s * 0.35} y2={-s * 0.1} />
        </g>
      );
    case "tables":
      return (
        <g stroke={color} strokeWidth={sw} fill="none">
          <circle cx={0} cy={0} r={s * 0.45} strokeDasharray={`${s * 0.15} ${s * 0.1}`} />
          <circle cx={0} cy={0} r={s * 0.08} fill={color} />
        </g>
      );
    case "plants":
      return (
        <g stroke={color} strokeWidth={sw} fill={color} fillOpacity={0.25} strokeLinecap="round">
          <path d={`M 0 ${s * 0.42} Q 0 0 ${s * 0.35} ${-s * 0.22} Q 0 0 0 ${s * 0.42} Q 0 0 ${-s * 0.35} ${-s * 0.22} Q 0 0 0 ${s * 0.42}`} />
        </g>
      );
    case "light":
      return (
        <g stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round">
          <circle cx={0} cy={-s * 0.1} r={s * 0.3} />
          <line x1={0} y1={s * 0.2} x2={0} y2={s * 0.42} />
          <circle cx={0} cy={-s * 0.1} r={s * 0.1} fill={color} />
        </g>
      );
    case "display":
      return (
        <g stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round">
          <rect x={-s * 0.4} y={-s * 0.35} width={s * 0.8} height={s * 0.55} rx={s * 0.05} />
          <line x1={-s * 0.3} y1={s * 0.4} x2={0} y2={s * 0.2} />
          <line x1={s * 0.3} y1={s * 0.4} x2={0} y2={s * 0.2} />
        </g>
      );
    case "model":
      return (
        <g stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M 0 ${-s * 0.45} L ${s * 0.39} ${-s * 0.22} L ${s * 0.39} ${s * 0.22} L 0 ${s * 0.45} L ${-s * 0.39} ${s * 0.22} L ${-s * 0.39} ${-s * 0.22} Z M 0 ${-s * 0.45} L 0 0 M ${s * 0.39} ${s * 0.22} L 0 0 M ${-s * 0.39} ${s * 0.22} L 0 0`} />
        </g>
      );
    case "objects":
    default:
      return (
        <g stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polygon points={`0,${-s * 0.48} ${s * 0.42},0 0,${s * 0.48} ${-s * 0.42},0`} />
          <circle cx={0} cy={0} r={s * 0.1} fill={color} />
        </g>
      );
  }
}

export interface FloorObjectsProps {
  ppm: number;
  objects?: GalleryObject[];
  rooms?: Room[];
  selection?: Selection;
  onSelect?: (id: string) => void;
  onUpdateObject?: (id: string, patch: ObjectPatch) => void;
  onRemoveObject?: (id: string) => void;
}

export function FloorObjects({
  ppm,
  objects: propObjects,
  rooms: propRooms,
  selection: propSelection,
  onSelect: propOnSelect,
  onUpdateObject: propOnUpdateObject,
  onRemoveObject: propOnRemoveObject,
}: FloorObjectsProps) {
  const storeObjects = useGalleryStore((s) => s.gallery.objects);
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const storeSelection = useGalleryStore((s) => s.selection);
  const storeSelect = useGalleryStore((s) => s.select);
  const storeUpdateObject = useGalleryStore((s) => s.updateObject);
  const storeRemoveObject = useGalleryStore((s) => s.removeObject);
  // SSR/test-safe: outside a Canvas there is no transform; rotate-by-drag then
  // falls back to raw client pixels scaled by ppm (only used in event handlers).
  const transform = useContext(CanvasTransformContext);
  const clientToMeters = useMemo(
    () =>
      transform?.clientToMeters ??
      ((clientX: number, clientY: number) => ({
        x: clientX / ppm,
        y: clientY / ppm,
      })),
    [transform, ppm],
  );

  const objects = useMemo(
    () => propObjects ?? storeObjects ?? [],
    [propObjects, storeObjects],
  );
  const rooms = propRooms ?? storeRooms;
  const selection = propSelection ?? storeSelection;

  const handleSelect = useCallback(
    (id: string) => {
      if (propOnSelect) propOnSelect(id);
      else storeSelect({ kind: "object", id });
    },
    [propOnSelect, storeSelect],
  );

  const onUpdateObject = propOnUpdateObject ?? storeUpdateObject;
  const onRemoveObject = propOnRemoveObject ?? storeRemoveObject;

  const [dragState, setDragState] = useState<{
    objectId: string;
    side: number;
    roomW: number;
    roomD: number;
    startX: number;
    startY: number;
    startClientX: number;
    startClientY: number;
    noSnap: boolean;
  } | null>(null);

  const [rotateState, setRotateState] = useState<{
    objectId: string;
    cx: number;
    cy: number;
  } | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const handleMarkerPointerDown = useCallback(
    (obj: GalleryObject, room: Room, e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      try {
        (e.currentTarget as SVGElement).focus?.();
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      handleSelect(obj.id);
      const side = computeObjectFootprint(obj);
      setDragState({
        objectId: obj.id,
        side,
        roomW: room.w,
        roomD: room.d,
        startX: obj.position.x,
        startY: obj.position.y,
        startClientX: e.clientX,
        startClientY: e.clientY,
        noSnap: e.shiftKey,
      });
    },
    [handleSelect],
  );

  const handleDragMove = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      if (!dragState) return;
      e.stopPropagation();
      const dxm = (e.clientX - dragState.startClientX) / ppm;
      const dym = (e.clientY - dragState.startClientY) / ppm;
      let nx = dragState.startX + dxm;
      let ny = dragState.startY + dym;
      if (!e.shiftKey && !dragState.noSnap) {
        nx = snapPosition(nx);
        ny = snapPosition(ny);
      }
      onUpdateObject(dragState.objectId, {
        position: {
          x: clampObjectPosition(dragState.roomW, nx, dragState.side),
          y: clampObjectPosition(dragState.roomD, ny, dragState.side),
        },
      });
    },
    [dragState, ppm, onUpdateObject],
  );

  const handleDragEnd = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      if (!dragState) return;
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDragState(null);
    },
    [dragState],
  );

  const handleRotateMove = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (!rotateState) return;
      e.stopPropagation();
      const p = clientToMeters(e.clientX, e.clientY);
      onUpdateObject(rotateState.objectId, {
        rotation: pointerAngleToRotation(p.x - rotateState.cx, p.y - rotateState.cy),
      });
    },
    [rotateState, clientToMeters, onUpdateObject],
  );

  const handleRotateEnd = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (!rotateState) return;
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setRotateState(null);
    },
    [rotateState],
  );

  const handleMarkerKeyDown = useCallback(
    (obj: GalleryObject, room: Room, e: React.KeyboardEvent<SVGGElement>) => {
      const side = computeObjectFootprint(obj);
      const step = e.shiftKey ? 0.5 : 0.1;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        onUpdateObject(obj.id, {
          position: {
            x: clampObjectPosition(room.w, obj.position.x + dx, side),
            y: clampObjectPosition(room.d, obj.position.y + dy, side),
          },
        });
        return;
      }
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const delta = e.key === "[" ? -OBJECT_ROTATION_SNAP : OBJECT_ROTATION_SNAP;
        onUpdateObject(obj.id, { rotation: snapRotation(obj.rotation + delta) });
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onRemoveObject(obj.id);
      }
    },
    [onUpdateObject, onRemoveObject],
  );

  // Global keyboard shortcuts (arrow nudge, [ ] rotate) when an object is selected
  React.useEffect(() => {
    if (selection.kind !== "object") return;
    const isTextInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      );
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (isTextInput(e.target)) return;
      const currentObj = objects.find((o) => o.id === selection.id);
      if (!currentObj) return;
      const currentRoom = roomMap.get(currentObj.roomId);
      if (!currentRoom) return;
      const side = computeObjectFootprint(currentObj);
      const step = e.shiftKey ? 0.5 : 0.1;

      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        onUpdateObject(currentObj.id, {
          position: {
            x: clampObjectPosition(
              currentRoom.w,
              currentObj.position.x + dx,
              side,
            ),
            y: clampObjectPosition(
              currentRoom.d,
              currentObj.position.y + dy,
              side,
            ),
          },
        });
        return;
      }
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const delta =
          e.key === "[" ? -OBJECT_ROTATION_SNAP : OBJECT_ROTATION_SNAP;
        onUpdateObject(currentObj.id, {
          rotation: snapRotation(currentObj.rotation + delta),
        });
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [selection, objects, roomMap, onUpdateObject]);

  return (
    <g data-testid="floor-objects">
      {objects.map((obj) => {
        const room = roomMap.get(obj.roomId);
        if (!room) return null;
        const side = computeObjectFootprint(obj);
        const cx = room.x + obj.position.x;
        const cy = room.y + obj.position.y;
        const isSelected =
          selection.kind === "object" && selection.id === obj.id;
        const isRound = obj.plinth.shape === "cylinder";
        const rotRad = (obj.rotation * Math.PI) / 180;
        const strokeBase = THEME.colors.graphite;
        const isKraft =
          obj.source.kind === "model" &&
          obj.source.job !== undefined &&
          (obj.source.job.status === "queued" ||
            obj.source.job.status === "running");
        const fillColor = isKraft ? THEME.colors.kraft : THEME.colors.paper;

        const safePpm = ppm > 0 ? ppm : 40;
        const entry =
          obj.source.kind === "library"
            ? libraryEntry(obj.source.libraryId)
            : undefined;
        const category = objectCategory(obj.source);
        const objectTitle =
          obj.title ||
          entry?.name ||
          (obj.source.kind === "model" ? "3D File" : "3D Exhibit");
        const glyphColor = isSelected ? THEME.colors.accent : strokeBase;
        const badgeTitle =
          objectTitle.length > 28 ? `${objectTitle.slice(0, 27)}…` : objectTitle;
        const badgeW = badgeTitle.length * 0.085 + 0.3;

        // Heading tick: rotation 0 faces +y (plan down, like 3D +z).
        const tickLen = side / 2;
        const tx = cx + Math.sin(rotRad) * tickLen;
        const ty = cy + Math.cos(rotRad) * tickLen;

        // Rotate handle: 20 px off the top-right corner.
        const hx = cx + side / 2 + 20 / safePpm;
        const hy = cy - side / 2 - 20 / safePpm;

        const tag = `${obj.plinth.shape === "none" ? "no plinth" : `${obj.plinth.height.toFixed(2)} m plinth`} · ${Math.round(obj.rotation)}°${isKraft ? " · making 3D…" : ""}`;
        const fontSize = 0.20;
        const tagW = tag.length * fontSize * 0.62 + 0.16; // monospace advance ≈ 0.6 em

        return (
          <g
            key={obj.id}
            data-testid={`floor-object-${obj.id}`}
            tabIndex={0}
            role="button"
            aria-label={`Object ${objectTitle}, ${Math.round(obj.rotation)} degrees`}
            className="cursor-move"
            // The global :focus-visible outline is in screen px but this group is scaled to
            // meters, so it painted an 80 px accent block (the "blue stadium"). Draw our own ring.
            style={{ outline: "none" }}
            onFocus={(e) =>
              setFocusedId(e.currentTarget.matches(":focus-visible") ? obj.id : null)
            }
            onBlur={() => setFocusedId(null)}
            onClick={createObjectMarkerClickHandler(obj.id, handleSelect)}
            onPointerDown={(e) => handleMarkerPointerDown(obj, room, e)}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerEnter={() => setHoveredId(obj.id)}
            onPointerLeave={() => setHoveredId(null)}
            onKeyDown={(e) => handleMarkerKeyDown(obj, room, e)}
          >
            <title>{`${objectTitle} (${Math.round(obj.rotation)}°) · Position: (${obj.position.x.toFixed(2)}m, ${obj.position.y.toFixed(2)}m)`}</title>
            {/* Invisible larger hit area: the true-scale marker can be tiny */}
            <rect
              x={cx - side / 2 - 8 / safePpm}
              y={cy - side / 2 - 8 / safePpm}
              width={side + 16 / safePpm}
              height={side + 16 / safePpm}
              fill="transparent"
            />
            {isRound ? (
              <circle
                cx={cx}
                cy={cy}
                r={side / 2}
                fill={fillColor}
                style={{
                  transition: "fill 400ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                stroke={isSelected ? THEME.colors.accent : strokeBase}
                strokeWidth={(isSelected ? 2 : 1.5) / safePpm}
              />
            ) : (
              <rect
                x={cx - side / 2}
                y={cy - side / 2}
                width={side}
                height={side}
                fill={fillColor}
                style={{
                  transition: "fill 400ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                stroke={isSelected ? THEME.colors.accent : strokeBase}
                strokeWidth={(isSelected ? 2 : 1.5) / safePpm}
              />
            )}
            {/* Category iconography inside marker */}
            <g transform={`translate(${cx}, ${cy})`} className="pointer-events-none">
              {renderObjectGlyph(category, side, glyphColor, safePpm)}
            </g>
            {focusedId === obj.id ? (
              <rect
                data-testid={`floor-object-focus-${obj.id}`}
                x={cx - side / 2 - 6 / safePpm}
                y={cy - side / 2 - 6 / safePpm}
                width={side + 12 / safePpm}
                height={side + 12 / safePpm}
                rx={3 / safePpm}
                fill="none"
                stroke={THEME.colors.accent}
                strokeWidth={1.5 / safePpm}
                strokeDasharray={`${4 / safePpm} ${3 / safePpm}`}
                className="pointer-events-none"
              />
            ) : null}
            {isSelected ? (
              isRound ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={side / 2 + 3 / safePpm}
                  fill="none"
                  stroke={THEME.colors.accent}
                  strokeWidth={2 / safePpm}
                  className="pointer-events-none"
                />
              ) : (
                <rect
                  x={cx - side / 2 - 3 / safePpm}
                  y={cy - side / 2 - 3 / safePpm}
                  width={side + 6 / safePpm}
                  height={side + 6 / safePpm}
                  fill="none"
                  stroke={THEME.colors.accent}
                  strokeWidth={2 / safePpm}
                  className="pointer-events-none"
                />
              )
            ) : null}
            {/* Heading tick */}
            <line
              x1={cx}
              y1={cy}
              x2={tx}
              y2={ty}
              stroke={isSelected ? THEME.colors.accent : strokeBase}
              strokeWidth={2 / safePpm}
              strokeLinecap="round"
              className="pointer-events-none"
            />
            {/* Hover tooltip badge when not selected */}
            {hoveredId === obj.id && !isSelected && !dragState ? (
              <g
                transform={`translate(${cx}, ${cy - side / 2 - 12 / safePpm})`}
                className="pointer-events-none select-none"
              >
                <rect
                  x={-badgeW / 2}
                  y={-0.30}
                  width={badgeW}
                  height={0.28}
                  rx={0.04}
                  fill={THEME.colors.graphite}
                  fillOpacity={0.92}
                />
                <text
                  x={0}
                  y={-0.12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={0.15}
                  fill="#ffffff"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {badgeTitle}
                </text>
              </g>
            ) : null}
            {isSelected ? (
              <>
                {/* Rotate handle */}
                <circle
                  cx={hx}
                  cy={hy}
                  r={6 / safePpm}
                  fill={THEME.colors.paper}
                  stroke={THEME.colors.accent}
                  strokeWidth={1.5 / safePpm}
                  className="cursor-grab"
                  data-testid={`floor-object-rotate-${obj.id}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setRotateState({ objectId: obj.id, cx, cy });
                  }}
                  onPointerMove={handleRotateMove}
                  onPointerUp={handleRotateEnd}
                />
                {/* Tape tag */}
                <g
                  transform={`translate(${cx + side / 2 + 6 / safePpm}, ${cy - side / 2 - 14 / safePpm})`}
                  className="pointer-events-none"
                >
                  <rect
                    width={tagW}
                    height={0.28}
                    rx={0.04}
                    fill={THEME.colors.accent}
                  />
                  <text
                    x={0.08}
                    y={0.19}
                    fontSize={fontSize}
                    fill="#ffffff"
                    fontFamily="monospace"
                  >
                    {tag}
                  </text>
                </g>
              </>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
