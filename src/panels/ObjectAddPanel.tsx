"use client";

import React, { useRef, useState } from "react";
import { LIBRARY, libraryEntry } from "@/lib/objects/library";
import { MODEL_HINT } from "@/lib/modelLimit";
import { uploadModel } from "@/upload/uploadModel";
import { useGalleryStore } from "@/store/gallery";
import type { Room } from "@/lib/schema/types";
import { Button, Label } from "@/components/ui";

export interface ObjectAddPanelProps {
  roomId: string;
  room?: Room;
  onAdded?: (id: string) => void;
  onCancel?: () => void;
  className?: string;
}

type Choice = "library" | "file";

/**
 * "What do you have?" (T-132): pick a library object or upload a .glb, and the
 * object lands at the room centre. The photo/AI path is cut (no approved
 * provider) and shows as coming soon.
 */
export function ObjectAddPanel({
  roomId,
  room: propRoom,
  onAdded,
  onCancel,
  className = "",
}: ObjectAddPanelProps) {
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const addObject = useGalleryStore((s) => s.addObject);
  const updateObject = useGalleryStore((s) => s.updateObject);

  const room = propRoom ?? storeRooms.find((r) => r.id === roomId);

  const [choice, setChoice] = useState<Choice>("library");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const id = addObject({ kind: "library", libraryId }, roomId);
    if (!id) {
      setError("Could not add to this room");
      return;
    }
    // Library pieces stand at their real height on their usual plinth.
    updateObject(id, {
      height: entry.defaultHeight,
      plinth: { shape: entry.plinth.shape, height: entry.plinth.height },
    });
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

  return (
    <div
      data-testid="object-add-panel"
      className={`flex flex-col gap-4 p-4 text-sm text-graphite ${className}`}
    >
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <h2 className="font-semibold text-graphite">Add object</h2>
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
            type="button"
            role="radio"
            aria-checked={choice === "library"}
            data-testid="object-add-choice-library"
            onClick={() => setChoice("library")}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setChoice("file");
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
            type="button"
            role="radio"
            aria-checked={choice === "file"}
            data-testid="object-add-choice-file"
            onClick={() => setChoice("file")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setChoice("library");
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
        <div className="flex flex-col gap-2">
          <span className="text-xs text-pencil">
            Click to drop it at the room centre.
          </span>
          {LIBRARY.length === 0 ? (
            <p className="text-xs text-pencil italic">
              The library is coming soon.
            </p>
          ) : (
            <ul
              data-testid="object-library-grid"
              className="grid grid-cols-3 gap-2"
            >
              {LIBRARY.map((entry) => (
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
