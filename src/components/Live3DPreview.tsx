"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import type { SceneModel } from "@/lib/compile/types";
import type { Room } from "@/lib/schema/types";

const Scene = dynamic(() => import("@/viewer3d/Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-zinc-400">
      Loading 3D...
    </div>
  ),
});

export interface Live3DPreviewProps {
  scene: SceneModel;
  selectedRoomId?: string;
  entranceRoomId: string;
  rooms: readonly Room[];
  onSelectRoom: (roomId: string) => void;
  onObjectDrag?: (
    objectId: string,
    newPosition: { x: number; y: number },
  ) => void;
  onExpandSplit?: () => void;
  onOpenFull3D?: () => void;
  /** Start as the small "Live 3D Preview" button so the window never covers the plan unasked. */
  defaultCollapsed?: boolean;
  className?: string;
}

export function Live3DPreview({
  scene,
  selectedRoomId,
  entranceRoomId,
  rooms,
  onSelectRoom,
  onObjectDrag,
  onExpandSplit,
  onOpenFull3D,
  defaultCollapsed = true,
  className = "",
}: Live3DPreviewProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const currentRoomId = selectedRoomId ?? entranceRoomId;
  const currentRoom = rooms.find((r) => r.id === currentRoomId);

  if (collapsed) {
    return (
      <button
        type="button"
        data-testid="live-3d-preview-open"
        onClick={() => setCollapsed(false)}
        className={`absolute top-16 right-4 z-20 hidden items-center gap-2 rounded-full md:flex border border-hairline bg-paper/95 px-3 py-1.5 text-xs font-semibold text-graphite shadow-md backdrop-blur transition-all hover:bg-plaster ${className}`}
        title="Open live 3D preview window"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span>Live 3D Preview</span>
      </button>
    );
  }

  return (
    <div
      data-testid="live-3d-preview"
      className={`absolute top-16 right-4 z-20 hidden w-80 flex-col md:flex overflow-hidden rounded-lg border border-hairline bg-paper/95 shadow-xl backdrop-blur-md transition-all ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2 bg-plaster/50">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-graphite">
            3D Preview
          </span>
          {currentRoom && (
            <span className="max-w-[80px] truncate text-[11px] text-pencil" title={currentRoom.name}>
              · {currentRoom.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onExpandSplit && (
            <button
              type="button"
              onClick={onExpandSplit}
              title="Split screen view"
              className="rounded px-1.5 py-0.5 text-[11px] font-medium text-pencil hover:bg-paper hover:text-graphite transition-colors"
            >
              Split
            </button>
          )}

          {onOpenFull3D && (
            <button
              type="button"
              onClick={onOpenFull3D}
              title="Open full 3D viewer"
              className="rounded px-1.5 py-0.5 text-[11px] font-medium text-pencil hover:bg-paper hover:text-graphite transition-colors"
            >
              Full
            </button>
          )}

          <button
            type="button"
            data-testid="live-3d-preview-minimize"
            onClick={() => setCollapsed(true)}
            title="Minimize preview"
            className="flex h-5 w-5 items-center justify-center rounded text-xs text-pencil hover:bg-paper hover:text-graphite transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative h-52 w-full bg-zinc-950">
        <Scene
          model={scene}
          mode="orbit"
          currentRoomId={currentRoomId}
          selectedRoomId={selectedRoomId}
          onFloorClick={onSelectRoom}
          onObjectDrag={onObjectDrag}
        />
        <div className="pointer-events-none absolute bottom-1.5 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-300 backdrop-blur">
          Drag to orbit · Real-time sync
        </div>
      </div>
    </div>
  );
}

export default Live3DPreview;
