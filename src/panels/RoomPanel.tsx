"use client";

import React, { useState } from "react";
import { hasOverlap } from "@/editor2d/overlap";
import { snap } from "@/lib/schema/geom";
import { useGalleryStore } from "@/store/gallery";
import type { Atmosphere, Room } from "@/lib/schema/types";
import { TRACKS } from "@/audio/tracks";

export interface RoomPanelProps {
  room?: Room;
  rooms?: readonly Room[];
  onAddObject?: (roomId: string) => void;
  className?: string;
}

export function RoomPanel({
  room: propRoom,
  rooms: propRooms,
  onAddObject,
  className,
}: RoomPanelProps) {
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const rooms = propRooms ?? storeRooms;
  const artworks = useGalleryStore((s) => s.gallery.artworks);
  const selection = useGalleryStore((s) => s.selection);
  const select = useGalleryStore((s) => s.select);
  const updateRoom = useGalleryStore((s) => s.updateRoom);
  const deleteRoom = useGalleryStore((s) => s.deleteRoom);

  const selectedRoomId =
    propRoom?.id ?? (selection.kind === "room" ? selection.id : null);
  const room = propRoom ?? rooms.find((r) => r.id === selectedRoomId);

  const [prevRoomId, setPrevRoomId] = useState(room?.id);
  const [invalidWidth, setInvalidWidth] = useState<string | null>(null);
  const [invalidDepth, setInvalidDepth] = useState<string | null>(null);
  const [invalidHeight, setInvalidHeight] = useState<string | null>(null);

  const [widthError, setWidthError] = useState<string | null>(null);
  const [depthError, setDepthError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (room && room.id !== prevRoomId) {
    setPrevRoomId(room.id);
    setInvalidWidth(null);
    setInvalidDepth(null);
    setInvalidHeight(null);
    setWidthError(null);
    setDepthError(null);
    setHeightError(null);
    setDeleteError(null);
  }

  if (!room) {
    return (
      <div data-testid="room-panel-empty" className="p-4 text-xs text-zinc-500">
        No room selected.
      </div>
    );
  }

  const handleWidthChange = (valStr: string) => {
    const val = Number(valStr);
    if (valStr.trim() === "" || isNaN(val)) {
      setInvalidWidth(valStr);
      setWidthError("Please enter a valid number");
      return;
    }
    if (val < 2) {
      setInvalidWidth(valStr);
      setWidthError("Width must be at least 2 m");
      return;
    }
    const snapped = snap(val);
    const candidate = { x: room.x, y: room.y, w: snapped, d: room.d };
    if (hasOverlap(candidate, rooms, room.id)) {
      setInvalidWidth(valStr);
      setWidthError("New width causes room to overlap an existing room");
      return;
    }
    setInvalidWidth(null);
    setWidthError(null);
    updateRoom(room.id, { w: snapped });
  };

  const handleDepthChange = (valStr: string) => {
    const val = Number(valStr);
    if (valStr.trim() === "" || isNaN(val)) {
      setInvalidDepth(valStr);
      setDepthError("Please enter a valid number");
      return;
    }
    if (val < 2) {
      setInvalidDepth(valStr);
      setDepthError("Depth must be at least 2 m");
      return;
    }
    const snapped = snap(val);
    const candidate = { x: room.x, y: room.y, w: room.w, d: snapped };
    if (hasOverlap(candidate, rooms, room.id)) {
      setInvalidDepth(valStr);
      setDepthError("New depth causes room to overlap an existing room");
      return;
    }
    setInvalidDepth(null);
    setDepthError(null);
    updateRoom(room.id, { d: snapped });
  };

  const handleHeightChange = (valStr: string) => {
    const val = Number(valStr);
    if (valStr.trim() === "" || isNaN(val)) {
      setInvalidHeight(valStr);
      setHeightError("Please enter a valid number");
      return;
    }
    if (val < 2) {
      setInvalidHeight(valStr);
      setHeightError("Wall height must be at least 2 m");
      return;
    }
    const snapped = snap(val);
    setInvalidHeight(null);
    setHeightError(null);
    updateRoom(room.id, { wallHeight: snapped });
  };

  const handleDeleteRoom = () => {
    setDeleteError(null);
    const success = deleteRoom(room.id);
    if (!success) {
      setDeleteError("Cannot delete the only remaining room.");
    }
  };

  const roomArtworks = artworks.filter((a) => a.roomId === room.id);

  return (
    <div
      data-testid="room-panel"
      className={`flex flex-col gap-4 text-sm text-zinc-800 ${className ?? ""}`}
    >
      <div>
        <h2 className="text-base font-semibold text-zinc-900">
          Room Properties
        </h2>
        <p className="text-xs text-zinc-500">
          Configure dimensions, materials and lighting
        </p>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-name-input"
          className="text-xs font-medium text-zinc-600"
        >
          Name
        </label>
        <input
          id="room-name-input"
          type="text"
          value={room.name}
          onChange={(e) => updateRoom(room.id, { name: e.target.value })}
          placeholder="Room name"
          className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-desc-input"
          className="text-xs font-medium text-zinc-600"
        >
          Description
        </label>
        <textarea
          id="room-desc-input"
          rows={2}
          value={room.description}
          onChange={(e) => updateRoom(room.id, { description: e.target.value })}
          placeholder="Optional room description"
          className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {/* Dimensions: Width and Depth */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="room-width-input"
            className="text-xs font-medium text-zinc-600"
          >
            Width (m)
          </label>
          <input
            id="room-width-input"
            type="number"
            step={0.5}
            min={2}
            value={invalidWidth ?? room.w}
            onChange={(e) => handleWidthChange(e.target.value)}
            className={`rounded border px-2.5 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              widthError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500"
            }`}
          />
          {widthError && (
            <span role="alert" className="text-[11px] font-medium text-red-600">
              {widthError}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="room-depth-input"
            className="text-xs font-medium text-zinc-600"
          >
            Depth (m)
          </label>
          <input
            id="room-depth-input"
            type="number"
            step={0.5}
            min={2}
            value={invalidDepth ?? room.d}
            onChange={(e) => handleDepthChange(e.target.value)}
            className={`rounded border px-2.5 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              depthError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500"
            }`}
          />
          {depthError && (
            <span role="alert" className="text-[11px] font-medium text-red-600">
              {depthError}
            </span>
          )}
        </div>
      </div>

      {/* Wall Height */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-height-input"
          className="text-xs font-medium text-zinc-600"
        >
          Wall Height (m)
        </label>
        <input
          id="room-height-input"
          type="number"
          step={0.5}
          min={2}
          value={invalidHeight ?? room.wallHeight}
          onChange={(e) => handleHeightChange(e.target.value)}
          className={`rounded border px-2.5 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 ${
            heightError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500"
          }`}
        />
        {heightError && (
          <span role="alert" className="text-[11px] font-medium text-red-600">
            {heightError}
          </span>
        )}
      </div>

      {/* Wall Color */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-wall-color-input"
          className="text-xs font-medium text-zinc-600"
        >
          Wall Color
        </label>
        <div className="flex items-center gap-2">
          <input
            id="room-wall-color-picker"
            type="color"
            value={room.wallColor}
            onChange={(e) => updateRoom(room.id, { wallColor: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
          />
          <input
            id="room-wall-color-input"
            type="text"
            value={room.wallColor}
            onChange={(e) => updateRoom(room.id, { wallColor: e.target.value })}
            placeholder="#f2efe9"
            className="flex-1 rounded border border-zinc-300 bg-white px-2.5 py-1 font-mono text-xs uppercase shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      {/* Floor Preset */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-floor-select"
          className="text-xs font-medium text-zinc-600"
        >
          Floor Preset
        </label>
        <select
          id="room-floor-select"
          value={room.floor}
          onChange={(e) =>
            updateRoom(room.id, {
              floor: e.target.value as "wood" | "concrete" | "marble",
            })
          }
          className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="wood">Wood</option>
          <option value="concrete">Concrete</option>
          <option value="marble">Marble</option>
        </select>
      </div>

      {/* Lighting Preset */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-lighting-select"
          className="text-xs font-medium text-zinc-600"
        >
          Lighting Preset
        </label>
        <select
          id="room-lighting-select"
          value={room.lighting}
          onChange={(e) =>
            updateRoom(room.id, {
              lighting: e.target.value as "gallery" | "warm" | "moody",
            })
          }
          className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="gallery">Gallery (Neutral / Bright)</option>
          <option value="warm">Warm (Golden / Intimate)</option>
          <option value="moody">Moody (Atmospheric / Dim)</option>
        </select>
      </div>

      {/* Atmosphere Preset */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-atmosphere-select"
          className="text-xs font-medium text-zinc-600"
        >
          Atmosphere Preset
        </label>
        <select
          id="room-atmosphere-select"
          value={room.atmosphere?.preset ?? "none"}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "none") {
              updateRoom(room.id, { atmosphere: undefined });
            } else {
              const currentCustom = room.atmosphere ?? {
                preset: val as Atmosphere["preset"],
                moodColor: "#ffffff",
                haze: 0.2,
                brightness: 0.8,
                lightDirection: 45,
                grain: 0,
              };
              updateRoom(room.id, {
                atmosphere: {
                  ...currentCustom,
                  preset: val as Atmosphere["preset"],
                },
              });
            }
          }}
          className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="none">None (Match lighting)</option>
          <option value="gallery-white">Gallery White</option>
          <option value="neon-bunker">Neon Bunker</option>
          <option value="golden-hour">Golden Hour</option>
          <option value="moonlit">Moonlit</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Custom Atmosphere Sliders */}
      {room.atmosphere?.preset === "custom" && (
        <div
          data-testid="custom-atmosphere-controls"
          className="flex flex-col gap-2 rounded border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-700"
        >
          <span className="font-semibold text-zinc-800">Custom Atmosphere</span>

          {/* Mood Color */}
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="custom-mood-color"
              className="font-medium text-zinc-600"
            >
              Mood Color
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="custom-mood-color"
                type="color"
                value={room.atmosphere.moodColor}
                onChange={(e) =>
                  updateRoom(room.id, {
                    atmosphere: {
                      ...room.atmosphere!,
                      moodColor: e.target.value,
                    },
                  })
                }
                className="h-6 w-8 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
              />
              <span className="font-mono text-[11px] text-zinc-500">
                {room.atmosphere.moodColor}
              </span>
            </div>
          </div>

          {/* Haze */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <label
                htmlFor="custom-haze"
                className="font-medium text-zinc-600"
              >
                Haze / Fog
              </label>
              <span className="text-zinc-500">
                {Math.round(room.atmosphere.haze * 100)}%
              </span>
            </div>
            <input
              id="custom-haze"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.haze}
              onChange={(e) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    haze: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full"
            />
          </div>

          {/* Brightness */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <label
                htmlFor="custom-brightness"
                className="font-medium text-zinc-600"
              >
                Brightness
              </label>
              <span className="text-zinc-500">
                {Math.round(room.atmosphere.brightness * 100)}%
              </span>
            </div>
            <input
              id="custom-brightness"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.brightness}
              onChange={(e) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    brightness: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full"
            />
          </div>

          {/* Light Direction */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <label
                htmlFor="custom-light-direction"
                className="font-medium text-zinc-600"
              >
                Light Direction
              </label>
              <span className="text-zinc-500">
                {Math.round(room.atmosphere.lightDirection)}°
              </span>
            </div>
            <input
              id="custom-light-direction"
              type="range"
              min={0}
              max={360}
              step={1}
              value={room.atmosphere.lightDirection}
              onChange={(e) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    lightDirection: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full"
            />
          </div>

          {/* Grain */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <label
                htmlFor="custom-grain"
                className="font-medium text-zinc-600"
              >
                Grain
              </label>
              <span className="text-zinc-500">
                {Math.round(room.atmosphere.grain * 100)}%
              </span>
            </div>
            <input
              id="custom-grain"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.grain}
              onChange={(e) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    grain: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Music Select */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="room-music-select"
          className="text-xs font-medium text-zinc-600"
        >
          Music Track
        </label>
        <select
          id="room-music-select"
          value={room.music?.trackId ?? "none"}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "none") {
              updateRoom(room.id, { music: undefined });
            } else {
              updateRoom(room.id, { music: { trackId: val } });
            }
          }}
          className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="none">None (Silence)</option>
          {TRACKS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Read-only Objects in Room List */}
      <div className="mt-1 flex flex-col gap-1.5 border-t border-zinc-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-700">
            Objects in room ({roomArtworks.length})
          </span>
          <button
            type="button"
            onClick={() => onAddObject?.(room.id)}
            className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200"
          >
            + Add object
          </button>
        </div>
        {roomArtworks.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">
            No objects in this room.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {roomArtworks.map((art) => (
              <li
                key={art.id}
                onClick={() => select({ kind: "artwork", id: art.id })}
                className="flex cursor-pointer items-center justify-between rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-700 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100"
              >
                <div className="truncate">
                  <span className="font-medium">{art.title || "Untitled"}</span>
                  {art.artist && (
                    <span className="text-zinc-500 ml-1">by {art.artist}</span>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-zinc-400 font-mono">
                  {art.placement.wall.toUpperCase()} wall
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Room Button */}
      <div className="mt-3 flex flex-col gap-1 border-t border-zinc-200 pt-3">
        {deleteError && (
          <span role="alert" className="text-xs font-medium text-red-600">
            {deleteError}
          </span>
        )}
        <button
          type="button"
          onClick={handleDeleteRoom}
          disabled={rooms.length <= 1}
          className={`rounded border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
            rooms.length <= 1
              ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200"
          }`}
        >
          Delete room
        </button>
      </div>
    </div>
  );
}

export default RoomPanel;
