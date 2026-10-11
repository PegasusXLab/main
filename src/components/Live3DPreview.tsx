"use client";

import React from "react";
import { FloatingPanel } from "@/components/FloatingPanel";
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
  /** Start as the small "Live 3D Preview" pill (it opens by default). */
  defaultCollapsed?: boolean;
  /**
   * Whether to persist and restore the collapsed state across reloads.
   * Defaults to false so the 3D preview window is automatically open when loading the editor.
   */
  rememberCollapsed?: boolean;
  className?: string;
}

const LIVE_DOT = (
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
  </span>
);

const HEADER_ACTION =
  "rounded px-1.5 py-0.5 text-[11px] font-medium text-pencil transition-colors hover:bg-paper hover:text-graphite";

export function Live3DPreview({
  scene,
  selectedRoomId,
  entranceRoomId,
  rooms,
  onSelectRoom,
  onObjectDrag,
  onExpandSplit,
  onOpenFull3D,
  defaultCollapsed = false,
  rememberCollapsed = false,
  className = "",
}: Live3DPreviewProps) {
  const currentRoomId = selectedRoomId ?? entranceRoomId;
  const currentRoom = rooms.find((r) => r.id === currentRoomId);

  return (
    <FloatingPanel
      id="live-3d-preview"
      label="Live 3D preview"
      testId="live-3d-preview"
      collapsedTestId="live-3d-preview-open"
      collapseTestId="live-3d-preview-minimize"
      anchor="bottom-right"
      inset={{ x: 16, y: 60 }}
      defaultSize={{ w: 320, h: 220 }}
      minSize={{ w: 240, h: 170 }}
      defaultCollapsed={defaultCollapsed}
      rememberCollapsed={rememberCollapsed}
      collapsedLabel="Live 3D Preview"
      pillIcon={LIVE_DOT}
      className={`hidden md:flex ${className}`}
      title={
        <>
          {LIVE_DOT}
          <span className="text-graphite">3D Preview</span>
          {currentRoom ? (
            <span className="max-w-[90px] truncate text-[11px] font-normal text-pencil" title={currentRoom.name}>
              · {currentRoom.name}
            </span>
          ) : null}
        </>
      }
      actions={
        <>
          {onExpandSplit ? (
            <button type="button" onClick={onExpandSplit} title="Split screen view" className={HEADER_ACTION}>
              Split
            </button>
          ) : null}
          {onOpenFull3D ? (
            <button type="button" onClick={onOpenFull3D} title="Open full 3D viewer" className={HEADER_ACTION}>
              Full
            </button>
          ) : null}
        </>
      }
    >
      <div className="absolute inset-0 bg-zinc-950">
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
    </FloatingPanel>
  );
}

export default Live3DPreview;
