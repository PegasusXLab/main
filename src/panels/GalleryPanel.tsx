"use client";

import React from "react";
import { useGalleryStore } from "@/store/gallery";
import { Input, Label, Select } from "@/components/ui";

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
      className={`flex flex-col gap-5 text-sm text-graphite ${className ?? ""}`}
    >
      <div>
        <h2 className="text-base font-semibold text-graphite">
          Gallery Properties
        </h2>
        <p className="text-xs text-pencil">
          Edit general gallery configuration
        </p>
      </div>

      {/* Gallery Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gallery-panel-title">Title</Label>
        <Input
          id="gallery-panel-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled gallery"
        />
      </div>

      {/* Entrance Room Dropdown */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gallery-panel-entrance">Entrance Room</Label>
        <Select
          id="gallery-panel-entrance"
          value={entranceRoomId}
          onChange={(e) => setEntrance(e.target.value)}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name || "Untitled room"} ({room.w} × {room.d} m)
            </option>
          ))}
        </Select>
        <p className="text-[11px] text-pencil">
          The 3D viewer will position visitors in this room first.
        </p>
      </div>

      {/* Room Count Summary */}
      <div className="mt-2 border-t border-hairline pt-3 text-xs text-pencil">
        <p>
          Total rooms:{" "}
          <span className="font-medium text-graphite tabular-nums font-mono">
            {rooms.length}
          </span>
        </p>
      </div>
    </div>
  );
}

export default GalleryPanel;
