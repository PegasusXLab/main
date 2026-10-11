import React, { useCallback, useMemo, useState } from "react";
import { THEME } from "@/lib/theme";
import type { Artwork, Room } from "@/lib/schema/types";
import {
  useGalleryStore,
  type Selection,
  type ArtworkPatch,
} from "@/store/gallery";
import { compile } from "@/lib/compile/compile";
import type { CompileIssue } from "@/lib/compile/frames";

export interface ArtSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
  wallLength: number;
}

/**
 * Pure math: calculates 2D line segment in plan coordinates for artwork on a room wall.
 */
export function computeArtSegment(
  room: { x: number; y: number; w: number; d: number },
  wall: "n" | "s" | "w" | "e",
  offset: number,
  width: number,
): ArtSegment {
  let cx = 0;
  let cy = 0;
  let x1 = 0;
  let y1 = 0;
  let x2 = 0;
  let y2 = 0;
  let wallLength = 0;

  const halfW = width / 2;

  switch (wall) {
    case "n":
      wallLength = room.w;
      cx = room.x + offset;
      cy = room.y;
      x1 = cx - halfW;
      y1 = cy;
      x2 = cx + halfW;
      y2 = cy;
      break;
    case "s":
      wallLength = room.w;
      cx = room.x + room.w - offset;
      cy = room.y + room.d;
      x1 = cx - halfW;
      y1 = cy;
      x2 = cx + halfW;
      y2 = cy;
      break;
    case "w":
      wallLength = room.d;
      cx = room.x;
      cy = room.y + room.d - offset;
      x1 = cx;
      y1 = cy - halfW;
      x2 = cx;
      y2 = cy + halfW;
      break;
    case "e":
      wallLength = room.d;
      cx = room.x + room.w;
      cy = room.y + offset;
      x1 = cx;
      y1 = cy - halfW;
      x2 = cx;
      y2 = cy + halfW;
      break;
  }

  return { x1, y1, x2, y2, cx, cy, wallLength };
}

/**
 * Pure math: moves offset along wall, clamped to wall length and snapped to 0.1 m.
 */
export function computeDragOffset(
  wall: "n" | "s" | "w" | "e",
  startOffset: number,
  dxMeters: number,
  dyMeters: number,
  wallLength: number,
): number {
  let delta = 0;
  switch (wall) {
    case "n":
      delta = dxMeters;
      break;
    case "s":
      delta = -dxMeters;
      break;
    case "w":
      delta = -dyMeters;
      break;
    case "e":
      delta = dyMeters;
      break;
  }
  const raw = startOffset + delta;
  const snapped = Math.round(raw * 10) / 10;
  return Math.max(0, Math.min(wallLength, snapped));
}

export function createMarkerClickHandler(
  id: string,
  onSelect: (id: string) => void,
) {
  return (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(id);
  };
}

export interface ArtMarkersProps {
  ppm: number;
  artworks?: Artwork[];
  rooms?: Room[];
  selection?: Selection;
  issues?: CompileIssue[];
  onSelect?: (id: string) => void;
  onUpdateArtwork?: (id: string, patch: ArtworkPatch) => void;
}

export function ArtMarkers({
  ppm,
  artworks: propArtworks,
  rooms: propRooms,
  selection: propSelection,
  issues: propIssues,
  onSelect: propOnSelect,
  onUpdateArtwork: propOnUpdateArtwork,
}: ArtMarkersProps) {
  const storeGallery = useGalleryStore((s) => s.gallery);
  const storeSelection = useGalleryStore((s) => s.selection);
  const storeSelect = useGalleryStore((s) => s.select);
  const storeUpdateArtwork = useGalleryStore((s) => s.updateArtwork);

  const artworks = propArtworks ?? storeGallery.artworks;
  const rooms = propRooms ?? storeGallery.rooms;
  const selection = propSelection ?? storeSelection;

  const handleSelect = useCallback(
    (id: string) => {
      if (propOnSelect) {
        propOnSelect(id);
      } else {
        storeSelect({ kind: "artwork", id });
      }
    },
    [propOnSelect, storeSelect],
  );

  const onUpdateArtwork = propOnUpdateArtwork ?? storeUpdateArtwork;

  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const compileIssues = useMemo(() => {
    if (propIssues) return propIssues;
    try {
      return compile(storeGallery).issues;
    } catch {
      return [];
    }
  }, [propIssues, storeGallery]);

  const issueIds = useMemo(
    () => new Set(compileIssues.map((i) => i.artworkId)),
    [compileIssues],
  );

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    artworkId: string;
    wall: "n" | "s" | "w" | "e";
    wallLength: number;
    startOffset: number;
    startX: number;
    startY: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (art: Artwork, wallLength: number, e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      handleSelect(art.id);
      setDragState({
        artworkId: art.id,
        wall: art.placement.wall,
        wallLength,
        startOffset: art.placement.offset,
        startX: e.clientX,
        startY: e.clientY,
      });
    },
    [handleSelect],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      if (!dragState) return;
      e.stopPropagation();
      const currentArt = artworks.find((a) => a.id === dragState.artworkId);
      if (!currentArt) return;
      const dxMeters = (e.clientX - dragState.startX) / ppm;
      const dyMeters = (e.clientY - dragState.startY) / ppm;
      const newOffset = computeDragOffset(
        dragState.wall,
        dragState.startOffset,
        dxMeters,
        dyMeters,
        dragState.wallLength,
      );
      onUpdateArtwork(dragState.artworkId, {
        placement: {
          ...currentArt.placement,
          offset: newOffset,
        },
      });
    },
    [dragState, ppm, artworks, onUpdateArtwork],
  );

  const handlePointerUp = useCallback(
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

  return (
    <g data-testid="art-markers">
      {artworks.map((art) => {
        const room = roomMap.get(art.roomId);
        if (!room) return null;

        const segment = computeArtSegment(
          room,
          art.placement.wall,
          art.placement.offset,
          art.width,
        );

        const isSelected =
          selection.kind === "artwork" && selection.id === art.id;
        const hasIssue = issueIds.has(art.id);

        let strokeColor: string = THEME.colors.graphite; // default dark tick
        if (hasIssue) {
          strokeColor = THEME.colors.danger; // red for compile issues
        } else if (isSelected) {
          strokeColor = THEME.colors.accent; // Klein blue for selected
        }

        const isHorizontal =
          art.placement.wall === "n" || art.placement.wall === "s";
        const cursorClass = isHorizontal
          ? "cursor-ew-resize"
          : "cursor-ns-resize";

        return (
          <g
            key={art.id}
            data-testid={`art-marker-${art.id}`}
            className={cursorClass}
            onClick={createMarkerClickHandler(art.id, handleSelect)}
            onPointerDown={(e) => handlePointerDown(art, segment.wallLength, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerEnter={() => setHoveredId(art.id)}
            onPointerLeave={() => setHoveredId(null)}
          >
            <title>{`[Artwork]: ${art.title || "Untitled"} (${art.placement.wall.toUpperCase()} wall)`}</title>
            {/* Visual tick line */}
            <line
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              stroke={strokeColor}
              strokeWidth={6 / ppm}
              strokeLinecap="round"
            />
            {/* Invisible thicker hit-box for easier clicking and dragging */}
            <line
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              stroke="transparent"
              strokeWidth={16 / ppm}
              strokeLinecap="round"
            />
            {/* Hover tooltip badge when not selected */}
            {hoveredId === art.id && !isSelected && !dragState ? (
              <g
                transform={`translate(${segment.cx}, ${segment.cy - 14 / ppm})`}
                className="pointer-events-none select-none"
              >
                <rect
                  x={-1.1}
                  y={-0.30}
                  width={2.2}
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
                  {`[Artwork]: ${art.title || "Untitled"}`}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
