"use client";

import React, { useMemo, useState } from "react";
import { useGalleryStore } from "@/store/gallery";
import { UploadButton } from "@/upload/UploadButton";
import { compile } from "@/lib/compile/compile";
import type { CompileIssue } from "@/lib/compile/frames";
import type { Artwork, Room, Wall } from "@/lib/schema/types";

export interface ObjectPanelProps {
  roomId: string;
  artworkId?: string;
  room?: Room;
  artwork?: Artwork;
  issues?: CompileIssue[];
  onSave?: (id: string) => void;
  onCancel?: () => void;
  className?: string;
}

const WALL_OPTIONS: { value: Wall; label: string }[] = [
  { value: "n", label: "North" },
  { value: "e", label: "East" },
  { value: "s", label: "South" },
  { value: "w", label: "West" },
];

export function ObjectPanel({
  roomId,
  artworkId,
  room: propRoom,
  artwork: propArtwork,
  issues: propIssues,
  onSave,
  onCancel,
  className = "",
}: ObjectPanelProps) {
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const storeArtworks = useGalleryStore((s) => s.gallery.artworks);
  const storeGallery = useGalleryStore((s) => s.gallery);
  const addArtwork = useGalleryStore((s) => s.addArtwork);
  const updateArtwork = useGalleryStore((s) => s.updateArtwork);
  const deleteArtwork = useGalleryStore((s) => s.deleteArtwork);

  const room = propRoom ?? storeRooms.find((r) => r.id === roomId);
  const existingArtwork =
    propArtwork ??
    (artworkId ? storeArtworks.find((a) => a.id === artworkId) : undefined);

  const [wall, setWall] = useState<Wall>(
    existingArtwork?.placement.wall ?? "n",
  );
  const [offset, setOffset] = useState<number>(
    existingArtwork?.placement.offset ?? 1.5,
  );
  const [height, setHeight] = useState<number>(
    existingArtwork?.placement.height ?? 1.5,
  );
  const [width, setWidth] = useState<number>(existingArtwork?.width ?? 1.0);
  const [aspect, setAspect] = useState<number>(existingArtwork?.aspect ?? 1.0);
  const [image, setImage] = useState<{
    small: string;
    medium: string;
    large?: string;
  } | null>(existingArtwork?.image ?? null);
  const [title, setTitle] = useState(existingArtwork?.title ?? "");
  const [artist, setArtist] = useState(existingArtwork?.artist ?? "");
  const [story, setStory] = useState(existingArtwork?.story ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const [prevArtworkId, setPrevArtworkId] = useState(existingArtwork?.id);

  if (existingArtwork && existingArtwork.id !== prevArtworkId) {
    setPrevArtworkId(existingArtwork.id);
    setWall(existingArtwork.placement.wall);
    setOffset(existingArtwork.placement.offset);
    setHeight(existingArtwork.placement.height);
    setWidth(existingArtwork.width);
    setAspect(existingArtwork.aspect);
    setImage(existingArtwork.image);
    setTitle(existingArtwork.title);
    setArtist(existingArtwork.artist);
    setStory(existingArtwork.story);
  }

  const wallLength = useMemo(() => {
    if (!room) return 6;
    return wall === "n" || wall === "s" ? room.w : room.d;
  }, [room, wall]);

  const wallHeight = room?.wallHeight ?? 3.0;

  // Compile issues for this artwork
  const compileIssues = useMemo(() => {
    if (propIssues) return propIssues;
    if (!existingArtwork) return [];
    try {
      const { issues } = compile(storeGallery);
      return issues.filter((i) => i.artworkId === existingArtwork.id);
    } catch {
      return [];
    }
  }, [propIssues, existingArtwork, storeGallery]);

  const offsetIssues = compileIssues.filter(
    (i) =>
      i.code === "artwork-past-wall-end" || i.code === "artwork-over-doorway",
  );
  const heightIssues = compileIssues.filter(
    (i) =>
      i.code === "artwork-past-wall-top" || i.code === "artwork-below-floor",
  );

  if (!room) {
    return (
      <div
        data-testid="object-panel-no-room"
        className="p-4 text-xs text-zinc-500"
      >
        Room not found.
      </div>
    );
  }

  const handleSave = () => {
    if (!image) {
      setFormError("Please upload an image");
      return;
    }
    setFormError(null);

    const artData = {
      roomId,
      type: "image" as const,
      placement: { wall, offset, height },
      width: Math.max(0.1, width),
      aspect: Math.max(0.1, aspect),
      image,
      title: title.trim() || "Untitled",
      artist: artist.trim(),
      story: story.trim(),
    };

    if (existingArtwork) {
      updateArtwork(existingArtwork.id, artData);
      onSave?.(existingArtwork.id);
    } else {
      const newId = addArtwork(artData);
      if (newId) onSave?.(newId);
    }
  };

  const handleDelete = () => {
    if (existingArtwork) {
      deleteArtwork(existingArtwork.id);
      onCancel?.();
    }
  };

  return (
    <div
      data-testid="object-panel"
      className={`flex flex-col gap-4 p-4 text-sm text-zinc-900 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
        <h2 className="font-semibold text-zinc-800">
          {existingArtwork ? "Edit Artwork" : "Add Artwork"}
        </h2>
        <span className="text-xs text-zinc-500">in {room.name}</span>
      </div>

      {formError && (
        <div data-testid="object-panel-error" className="text-xs text-red-600">
          {formError}
        </div>
      )}

      {/* Image Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-700">Image</label>
        <UploadButton
          onUploaded={({ image: uploadedImage, aspect: uploadedAspect }) => {
            setImage(uploadedImage);
            setAspect(uploadedAspect);
            setFormError(null);
          }}
        />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="art-title"
          className="text-xs font-medium text-zinc-700"
        >
          Title
        </label>
        <input
          id="art-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Artist */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="art-artist"
          className="text-xs font-medium text-zinc-700"
        >
          Artist
        </label>
        <input
          id="art-artist"
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist name"
          className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Wall selector */}
      <div className="flex flex-col gap-1">
        <label htmlFor="art-wall" className="text-xs font-medium text-zinc-700">
          Wall
        </label>
        <select
          id="art-wall"
          value={wall}
          onChange={(e) => {
            const nextWall = e.target.value as Wall;
            setWall(nextWall);
            const nextMax =
              nextWall === "n" || nextWall === "s" ? room.w : room.d;
            if (offset > nextMax) setOffset(nextMax);
          }}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {WALL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} (
              {opt.value === "n" || opt.value === "s" ? room.w : room.d} m)
            </option>
          ))}
        </select>
      </div>

      {/* Position along wall (slider) */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="art-offset" className="font-medium text-zinc-700">
            Position along wall
          </label>
          <span className="text-zinc-500">{offset.toFixed(1)} m</span>
        </div>
        <input
          id="art-offset"
          type="range"
          min={0}
          max={wallLength}
          step={0.1}
          value={offset}
          onChange={(e) => setOffset(parseFloat(e.target.value))}
          className="w-full"
        />
        {offsetIssues.map((issue) => (
          <p
            key={issue.code}
            data-testid="issue-offset"
            className="text-xs text-red-600"
          >
            {issue.message}
          </p>
        ))}
      </div>

      {/* Height on wall (slider) */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <label htmlFor="art-height" className="font-medium text-zinc-700">
            Center height
          </label>
          <span className="text-zinc-500">{height.toFixed(1)} m</span>
        </div>
        <input
          id="art-height"
          type="range"
          min={0}
          max={wallHeight}
          step={0.1}
          value={height}
          onChange={(e) => setHeight(parseFloat(e.target.value))}
          className="w-full"
        />
        {heightIssues.map((issue) => (
          <p
            key={issue.code}
            data-testid="issue-height"
            className="text-xs text-red-600"
          >
            {issue.message}
          </p>
        ))}
      </div>

      {/* Width input (meters) */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="art-width"
          className="text-xs font-medium text-zinc-700"
        >
          Width (meters)
        </label>
        <input
          id="art-width"
          type="number"
          min={0.1}
          max={wallLength}
          step={0.1}
          value={width}
          onChange={(e) => setWidth(parseFloat(e.target.value) || 0.1)}
          className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Story */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="art-story"
          className="text-xs font-medium text-zinc-700"
        >
          Story / Description
        </label>
        <textarea
          id="art-story"
          rows={3}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Story or description of artwork"
          className="rounded border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded bg-zinc-900 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          {existingArtwork ? "Save changes" : "Add artwork"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>
        {existingArtwork && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
