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

      {/* Editor Body: side-by-side on desktop, panel under canvas on phones */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Properties Panel */}
        <aside className="order-2 w-full shrink-0 overflow-y-auto border-t border-zinc-200 bg-white p-4 max-h-[45vh] md:order-1 md:max-h-none md:w-80 md:border-b-0 md:border-r md:border-t-0">
          {panel}
        </aside>

        {/* Main 2D Canvas / 3D Preview Workspace */}
        <main className="relative order-1 min-h-0 flex-1 overflow-hidden bg-zinc-100 md:order-2">
          {main}
        </main>
      </div>
    </div>
  );
}

export default EditorShell;
