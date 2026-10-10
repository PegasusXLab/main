import React, { useCallback, useContext, useMemo, useState } from "react";
import { THEME } from "@/lib/theme";
import type { GalleryObject, Room } from "@/lib/schema/types";
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
  return Math.min(1.5, Math.max(0.4, obj.height));
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

        // Heading tick: rotation 0 faces +y (plan down, like 3D +z).
        const tickLen = side / 2;
        const tx = cx + Math.sin(rotRad) * tickLen;
        const ty = cy + Math.cos(rotRad) * tickLen;

        // Rotate handle: 20 px off the top-right corner.
        const hx = cx + side / 2 + 20 / ppm;
        const hy = cy - side / 2 - 20 / ppm;

        const tag = `${obj.plinth.shape === "none" ? "no plinth" : `${obj.plinth.height.toFixed(2)} m plinth`} · ${Math.round(obj.rotation)}°${isKraft ? " · making 3D…" : ""}`;
        const fontSize = 0.22;
        const tagW = tag.length * 0.105 + 0.24;

        return (
          <g
            key={obj.id}
            data-testid={`floor-object-${obj.id}`}
            tabIndex={0}
            role="button"
            aria-label={`Object ${obj.title || obj.id}, ${Math.round(obj.rotation)} degrees`}
            className="cursor-move focus-visible:outline-none"
            onClick={createObjectMarkerClickHandler(obj.id, handleSelect)}
            onPointerDown={(e) => handleMarkerPointerDown(obj, room, e)}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onKeyDown={(e) => handleMarkerKeyDown(obj, room, e)}
          >
            {/* Invisible larger hit area: the true-scale marker can be tiny */}
            <rect
              x={cx - side / 2 - 8 / ppm}
              y={cy - side / 2 - 8 / ppm}
              width={side + 16 / ppm}
              height={side + 16 / ppm}
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
                strokeWidth={(isSelected ? 2 : 1.5) / ppm}
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
                strokeWidth={(isSelected ? 2 : 1.5) / ppm}
              />
            )}
            {isSelected ? (
              isRound ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={side / 2 + 3 / ppm}
                  fill="none"
                  stroke={THEME.colors.accent}
                  strokeWidth={2 / ppm}
                  className="pointer-events-none"
                />
              ) : (
                <rect
                  x={cx - side / 2 - 3 / ppm}
                  y={cy - side / 2 - 3 / ppm}
                  width={side + 6 / ppm}
                  height={side + 6 / ppm}
                  fill="none"
                  stroke={THEME.colors.accent}
                  strokeWidth={2 / ppm}
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
              strokeWidth={2 / ppm}
              strokeLinecap="round"
              className="pointer-events-none"
            />
            {isSelected ? (
              <>
                {/* Rotate handle */}
                <circle
                  cx={hx}
                  cy={hy}
                  r={6 / ppm}
                  fill={THEME.colors.paper}
                  stroke={THEME.colors.accent}
                  strokeWidth={1.5 / ppm}
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
                  transform={`translate(${cx + side / 2 + 6 / ppm}, ${cy - side / 2 - 14 / ppm})`}
                  className="pointer-events-none"
                >
                  <rect
                    width={tagW}
                    height={0.32}
                    rx={0.04}
                    fill={THEME.colors.accent}
                  />
                  <text
                    x={0.1}
                    y={0.23}
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
