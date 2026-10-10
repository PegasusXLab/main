import React from "react";

export interface EditorShellProps {
  title: string;
  onTitleChange: (title: string) => void;
  view: "2d" | "3d";
  onViewChange: (view: "2d" | "3d") => void;
  onPublish: () => void;
  panel: React.ReactNode;
  main: React.ReactNode;
}

export function EditorShell({
  title,
  onTitleChange,
  view,
  onViewChange,
  onPublish,
  panel,
  main,
}: EditorShellProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-zinc-900">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4">
        {/* Gallery Title Input */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="gallery-title-input"
            className="text-sm font-medium text-zinc-600"
          >
            Gallery:
          </label>
          <input
            id="gallery-title-input"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="My First Show"
            className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* 2D / 3D Toggle */}
        <div className="flex items-center gap-1 rounded-md border border-zinc-300 bg-zinc-200/60 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => onViewChange("2d")}
            className={`rounded px-3 py-1 transition-colors ${
              view === "2d"
                ? "bg-white text-zinc-900 shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => onViewChange("3d")}
            className={`rounded px-3 py-1 transition-colors ${
              view === "3d"
                ? "bg-white text-zinc-900 shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            3D
          </button>
        </div>

        {/* Publish Action */}
        <div>
          <button
            type="button"
            onClick={onPublish}
            className="rounded bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-zinc-800 active:bg-zinc-950"
          >
            Publish
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Properties Panel */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4">
          {panel}
        </aside>

        {/* Main 2D Canvas / 3D Preview Workspace */}
        <main className="relative flex-1 overflow-hidden bg-zinc-100">
          {main}
        </main>
      </div>
    </div>
  );
}

export default EditorShell;
