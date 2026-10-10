import React from "react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export interface EditorShellProps {
  title: string;
  onTitleChange: (title: string) => void;
  view: "2d" | "pov" | "3d";
  onViewChange: (view: "2d" | "pov" | "3d") => void;
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
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-plaster px-4">
        {/* Gallery Title Input */}
        <div className="flex items-center gap-2">
          <Label htmlFor="gallery-title-input">Gallery:</Label>
          <Input
            id="gallery-title-input"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="My First Show"
            className="w-48"
          />
        </div>

        {/* View switcher (T-124): 2D plan · 3D POV (visitor tour) · Top-down (orbit) */}
        <div
          role="group"
          aria-label="Editor view"
          className="flex items-center gap-1 rounded-[2px] border border-hairline bg-plaster p-0.5"
        >
          <Toggle
            pressed={view === "2d"}
            onPressedChange={() => onViewChange("2d")}
            size="sm"
          >
            2D
          </Toggle>
          <Toggle
            pressed={view === "pov"}
            onPressedChange={() => onViewChange("pov")}
            size="sm"
          >
            3D POV
          </Toggle>
          <Toggle
            pressed={view === "3d"}
            onPressedChange={() => onViewChange("3d")}
            size="sm"
          >
            Top-down
          </Toggle>
        </div>

        {/* Publish Action */}
        <div>
          <Button variant="primary" size="sm" onClick={onPublish}>
            Publish
          </Button>
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
