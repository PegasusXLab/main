"use client";

import React from "react";
import { useGalleryStore } from "@/store/gallery";

export interface GalleryPanelProps {
  className?: string;
}

export function GalleryPanel({ className }: GalleryPanelProps) {
  const title = useGalleryStore((s) => s.gallery.title);
  const entranceRoomId = useGalleryStore((s) => s.gallery.entranceRoomId);
  const rooms = useGalleryStore((s) => s.gallery.rooms);
  const setTitle = useGalleryStore((s) => s.setTitle);
  const setEntrance = useGalleryStore((s) => s.setEntrance);

  return (
    <div
      data-testid="gallery-panel"
      className={`flex flex-col gap-5 text-sm text-zinc-800 ${className ?? ""}`}
    >
      <div>
        <h2 className="text-base font-semibold text-zinc-900">
          Gallery Properties
        </h2>
        <p className="text-xs text-zinc-500">
          Edit general gallery configuration
        </p>
      </div>

      {/* Gallery Title */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="gallery-panel-title"
          className="text-xs font-medium text-zinc-600"
        >
          Title
        </label>
        <input
          id="gallery-panel-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled gallery"
          className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {/* Entrance Room Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="gallery-panel-entrance"
          className="text-xs font-medium text-zinc-600"
        >
          Entrance Room
        </label>
        <select
          id="gallery-panel-entrance"
          value={entranceRoomId}
          onChange={(e) => setEntrance(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name || "Untitled room"} ({room.w} × {room.d} m)
            </option>
          ))}
        </select>
        <p className="text-[11px] text-zinc-500">
          The 3D viewer will position visitors in this room first.
        </p>
      </div>

      {/* Room Count Summary */}
      <div className="mt-2 border-t border-zinc-200 pt-3 text-xs text-zinc-500">
        <p>
          Total rooms:{" "}
          <span className="font-medium text-zinc-700">{rooms.length}</span>
        </p>
      </div>
    </div>
  );
}

export default GalleryPanel;
