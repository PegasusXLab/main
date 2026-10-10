"use client";

import React, { useRef, useState } from "react";
import { LIBRARY, libraryEntry, type LibraryCategory } from "@/lib/objects/library";
import { MODEL_HINT } from "@/lib/modelLimit";
import { uploadModel } from "@/upload/uploadModel";
import { useGalleryStore } from "@/store/gallery";
import type { Room } from "@/lib/schema/types";
import { Button, Label } from "@/components/ui";

export interface ObjectAddPanelProps {
  roomId: string;
  room?: Room;
  replaceObjectId?: string;
  onAdded?: (id: string) => void;
  onCancel?: () => void;
  className?: string;
}

type Choice = "library" | "file";

const CATEGORIES: { id: "all" | LibraryCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "seating", label: "Seating" },
  { id: "tables", label: "Tables" },
  { id: "plants", label: "Plants" },
  { id: "light", label: "Light" },
  { id: "display", label: "Display" },
  { id: "objects", label: "Objects" },
];

/**
 * "What do you have?" (T-132): pick a library object or upload a .glb, and the
 * object lands at the room centre. The photo/AI path is cut (no approved
 * provider) and shows as coming soon. Supports in-place object replacement.
 */
export function ObjectAddPanel({
  roomId,
  room: propRoom,
  replaceObjectId,
  onAdded,
  onCancel,
  className = "",
}: ObjectAddPanelProps) {
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const addObject = useGalleryStore((s) => s.addObject);
  const updateObject = useGalleryStore((s) => s.updateObject);

  const room = propRoom ?? storeRooms.find((r) => r.id === roomId);

  const [choice, setChoice] = useState<Choice>("library");
  const [category, setCategory] = useState<"all" | LibraryCategory>("all");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const libraryRadioRef = useRef<HTMLButtonElement>(null);
  const fileRadioRef = useRef<HTMLButtonElement>(null);

  if (!room) {
    return (
      <div
        data-testid="object-add-panel-no-room"
        className="p-4 text-xs text-pencil"
      >
        Room not found.
      </div>
    );
  }

  const handleLibraryAdd = (libraryId: string) => {
    setError(null);
    const entry = libraryEntry(libraryId);
    if (!entry) {
      setError("That library object is not available");
      return;
    }
    if (replaceObjectId) {
      updateObject(replaceObjectId, {
        source: { kind: "library", libraryId },
        height: entry.defaultHeight,
        plinth: { shape: entry.plinth.shape, height: entry.plinth.height },
      });
      onAdded?.(replaceObjectId);
      return;
    }
    // Single atomic commit for add + plinth + height so undo removes the object in one step.
    const id = addObject(
      { kind: "library", libraryId },
      roomId,
      {
        height: entry.defaultHeight,
        plinth: { shape: entry.plinth.shape, height: entry.plinth.height },
      },
    );
    if (!id) {
      setError("Could not add to this room");
      return;
    }
    onAdded?.(id);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const uploaded = await uploadModel(file, setProgress);
      if (replaceObjectId) {
        updateObject(replaceObjectId, {
          source: { kind: "model", modelUrl: uploaded.url, origin: "upload" },
        });
        onAdded?.(replaceObjectId);
        return;
      }
      const id = addObject(
        { kind: "model", modelUrl: uploaded.url, origin: "upload" },
        roomId,
      );
      if (!id) {
        setError("Could not add to this room");
        return;
      }
      onAdded?.(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const cardClass = (selected: boolean) =>
    `flex cursor-pointer flex-col gap-1 rounded-[2px] border p-3 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      selected
        ? "border-accent bg-accent-subtle"
        : "border-hairline bg-paper hover:border-pencil"
    }`;

  const visibleEntries =
    category === "all"
      ? LIBRARY
      : LIBRARY.filter((e) => e.category === category);

  return (
    <div
      data-testid="object-add-panel"
      className={`flex flex-col gap-4 p-4 text-sm text-graphite ${className}`}
    >
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <h2 className="font-semibold text-graphite">
          {replaceObjectId ? "Replace object" : "Add object"}
        </h2>
        <span className="text-xs text-pencil">in {room.name}</span>
      </div>

      <div className="flex flex-col gap-1">
        <Label id="object-add-choices-label">What do you have?</Label>
        <div
          role="radiogroup"
          aria-labelledby="object-add-choices-label"
          className="flex flex-col gap-2"
        >
          <button
            ref={libraryRadioRef}
            type="button"
            role="radio"
            aria-checked={choice === "library"}
            data-testid="object-add-choice-library"
            onClick={() => setChoice("library")}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setChoice("file");
                fileRadioRef.current?.focus();
              }
            }}
            className={cardClass(choice === "library")}
          >
            <span className="font-medium">Pick from the library</span>
            <span className="text-xs text-pencil">
              Plinths, benches, plants, lamps
            </span>
          </button>

          <button
            ref={fileRadioRef}
            type="button"
            role="radio"
            aria-checked={choice === "file"}
            data-testid="object-add-choice-file"
            onClick={() => setChoice("file")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                setChoice("library");
                libraryRadioRef.current?.focus();
              }
            }}
            className={cardClass(choice === "file")}
          >
            <span className="font-medium">A 3D file</span>
            <span className="text-xs text-pencil">{MODEL_HINT}</span>
          </button>

          <div
            role="radio"
            aria-checked={false}
            aria-disabled
            data-testid="object-add-choice-photo"
            className="flex cursor-not-allowed flex-col gap-1 rounded-[2px] border border-hairline bg-paper p-3 opacity-50"
          >
            <span className="font-medium">
              A photo of it{" "}
              <span className="ml-1 text-[11px] text-pencil">coming soon</span>
            </span>
            <span className="text-xs text-pencil">
              We would make it 3D in about a minute.
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div
          data-testid="object-add-error"
          role="alert"
          className="text-xs font-medium text-danger"
        >
          {error}
        </div>
      )}

      {choice === "library" ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-pencil">
              Click to drop it at the room centre.
            </span>
          </div>

          {/* Category filter tabs */}
          <div
            role="tablist"
            aria-label="Library categories"
            className="flex flex-wrap gap-1"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={category === cat.id}
                data-testid={`library-category-${cat.id}`}
                onClick={() => setCategory(cat.id)}
                className={`rounded-[2px] px-2 py-0.5 text-xs transition-colors duration-fast ${
                  category === cat.id
                    ? "bg-graphite text-paper"
                    : "bg-paper text-pencil hover:text-graphite border border-hairline"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {visibleEntries.length === 0 ? (
            <p className="text-xs text-pencil italic">
              No objects in this category.
            </p>
          ) : (
            <ul
              data-testid="object-library-grid"
              className="grid grid-cols-3 gap-2"
            >
              {visibleEntries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    data-testid={`object-library-${entry.id}`}
                    onClick={() => handleLibraryAdd(entry.id)}
                    className="flex w-full flex-col items-center gap-1 rounded-[2px] border border-hairline bg-paper p-1.5 transition-colors duration-fast hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.posterUrl}
                      alt={entry.name}
                      loading="lazy"
                      className="h-14 w-full rounded-[2px] bg-plaster object-cover"
                    />
                    <span className="w-full truncate text-center text-[11px] text-graphite">
                      {entry.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".glb,model/gltf-binary"
            data-testid="object-file-input"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Choose a .glb file"}
          </Button>
          {uploading ? (
            <div
              data-testid="object-upload-progress"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 w-full overflow-hidden rounded bg-plaster"
            >
              <div
                className="h-full bg-accent transition-[width] duration-fast"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
