"use client";

import React from "react";
import { useGalleryStore } from "@/store/gallery";
import { Input, Label, Select } from "@/components/ui";
import { getAdjacentRoomRect, SIDES } from "@/editor2d/AddRoomButtons";
import { hasOverlap } from "@/editor2d/overlap";

export interface GalleryPanelProps {
  className?: string;
}

const EMPTY_OBJECTS: never[] = [];

export function GalleryPanel({ className }: GalleryPanelProps) {
  const title = useGalleryStore((s) => s.gallery.title);
  const entranceRoomId = useGalleryStore((s) => s.gallery.entranceRoomId);
  const rooms = useGalleryStore((s) => s.gallery.rooms);
  const artworks = useGalleryStore((s) => s.gallery.artworks);
  const storeObjects = useGalleryStore((s) => s.gallery.objects);
  const objects = storeObjects ?? EMPTY_OBJECTS;
  const setTitle = useGalleryStore((s) => s.setTitle);
  const setEntrance = useGalleryStore((s) => s.setEntrance);
  const select = useGalleryStore((s) => s.select);
  const addRoom = useGalleryStore((s) => s.addRoom);

  const totalArea = rooms.reduce((acc, r) => acc + r.w * r.d, 0);

  const handleAddRoom = () => {
    // Find the first non-overlapping adjacent spot next to an existing room
    for (const room of rooms) {
      for (const side of SIDES) {
        const candidate = getAdjacentRoomRect(room, side);
        if (!hasOverlap(candidate, rooms)) {
          const newId = addRoom(candidate);
          select({ kind: "room", id: newId });
          return;
        }
      }
    }
  };

  return (
    <div
      data-testid="gallery-panel"
      className={`flex flex-col gap-4 text-sm text-graphite ${className ?? ""}`}
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
      <div className="flex flex-col gap-1">
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
      <div className="flex flex-col gap-1">
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

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-2 rounded bg-plaster p-2.5 text-center">
        <div>
          <div className="text-[10px] uppercase font-semibold text-pencil">Area</div>
          <div className="font-mono text-xs font-semibold text-graphite">{totalArea} m²</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-pencil">Artworks</div>
          <div className="font-mono text-xs font-semibold text-graphite">{artworks.length}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-pencil">Objects</div>
          <div className="font-mono text-xs font-semibold text-graphite">{objects.length}</div>
        </div>
      </div>

      {/* Interactive Rooms List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-pencil">
            Rooms ({rooms.length})
          </span>
          <button
            type="button"
            onClick={handleAddRoom}
            className="flex items-center gap-1 rounded bg-plaster px-2 py-0.5 text-xs font-semibold text-graphite hover:bg-zinc-200 transition-colors"
          >
            + Add Room
          </button>
        </div>

        <div className="flex flex-col divide-y divide-hairline rounded border border-hairline bg-paper">
          {rooms.map((room) => {
            const artCount = artworks.filter((a) => a.roomId === room.id).length;
            const objCount = objects.filter((o) => o.roomId === room.id).length;
            const isEntrance = room.id === entranceRoomId;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => select({ kind: "room", id: room.id })}
                className="group flex items-center justify-between p-2.5 text-left transition-colors hover:bg-plaster"
                title={`Edit ${room.name || "Untitled room"}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-graphite group-hover:text-accent">
                      {room.name || "Untitled room"}
                    </span>
                    {isEntrance && (
                      <span className="rounded bg-accent/10 px-1 py-0.2 text-[10px] font-medium text-accent">
                        Entrance
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-pencil">
                    <span className="font-mono">{room.w} × {room.d} m</span>
                    {(artCount > 0 || objCount > 0) && (
                      <span>
                        · {artCount > 0 ? `${artCount} art` : ""}
                        {artCount > 0 && objCount > 0 ? ", " : ""}
                        {objCount > 0 ? `${objCount} obj` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-pencil transition-transform group-hover:translate-x-0.5 group-hover:text-graphite">
                  →
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Start Builder Guide */}
      <div className="rounded-md border border-hairline bg-paper/60 p-3 text-xs flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-graphite">
          <span>💡</span>
          <span>Quick Builder Guide</span>
        </div>
        <ul className="flex flex-col gap-1.5 text-[11px] text-pencil leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="font-semibold text-graphite">1.</span>
            <span>Click any room on the grid to customize wall colors, lighting, floors &amp; music.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="font-semibold text-graphite">2.</span>
            <span>Click the <strong className="font-semibold text-graphite">+</strong> buttons on walls to add connected rooms.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="font-semibold text-graphite">3.</span>
            <span>Use the <strong className="font-semibold text-graphite">+ Add</strong> menu to hang art or place 3D sculptures.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="font-semibold text-graphite">4.</span>
            <span>Drag the bottom-right corner handle of any room to resize it.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default GalleryPanel;
