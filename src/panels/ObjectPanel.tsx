"use client";

import React, { useMemo, useState } from "react";
import { useGalleryStore } from "@/store/gallery";
import { UploadButton } from "@/upload/UploadButton";
import { compile } from "@/lib/compile/compile";
import type { CompileIssue } from "@/lib/compile/frames";
import type { Artwork, Room, Wall } from "@/lib/schema/types";
import { Button, Input, Label, Select, Slider } from "@/components/ui";

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
        className="p-4 text-xs text-pencil"
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
      className={`flex flex-col gap-4 p-4 text-sm text-graphite ${className}`}
    >
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <h2 className="font-semibold text-graphite">
          {existingArtwork ? "Edit Artwork" : "Add Artwork"}
        </h2>
        <span className="text-xs text-pencil">in {room.name}</span>
      </div>

      {formError && (
        <div
          data-testid="object-panel-error"
          className="text-xs font-medium text-danger"
        >
          {formError}
        </div>
      )}

      {/* Image Upload */}
      <div className="flex flex-col gap-1.5">
        <Label>Image</Label>
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
        <Label htmlFor="art-title">Title</Label>
        <Input
          id="art-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
        />
      </div>

      {/* Artist */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="art-artist">Artist</Label>
        <Input
          id="art-artist"
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist name"
        />
      </div>

      {/* Wall selector */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="art-wall">Wall</Label>
        <Select
          id="art-wall"
          value={wall}
          onChange={(e) => {
            const nextWall = e.target.value as Wall;
            setWall(nextWall);
            const nextMax =
              nextWall === "n" || nextWall === "s" ? room.w : room.d;
            if (offset > nextMax) setOffset(nextMax);
          }}
        >
          {WALL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} (
              {opt.value === "n" || opt.value === "s" ? room.w : room.d} m)
            </option>
          ))}
        </Select>
      </div>

      {/* Position along wall (slider) */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <Label htmlFor="art-offset">Position along wall</Label>
          <span className="text-pencil tabular-nums font-mono text-[11px]">
            {offset.toFixed(1)} m
          </span>
        </div>
        <Slider
          id="art-offset"
          min={0}
          max={wallLength}
          step={0.1}
          value={offset}
          onChange={(val) => setOffset(val)}
        />
        {offsetIssues.map((issue) => (
          <p
            key={issue.code}
            data-testid="issue-offset"
            className="text-xs text-danger"
          >
            {issue.message}
          </p>
        ))}
      </div>

      {/* Height on wall (slider) */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <Label htmlFor="art-height">Center height</Label>
          <span className="text-pencil tabular-nums font-mono text-[11px]">
            {height.toFixed(1)} m
          </span>
        </div>
        <Slider
          id="art-height"
          min={0}
          max={wallHeight}
          step={0.1}
          value={height}
          onChange={(val) => setHeight(val)}
        />
        {heightIssues.map((issue) => (
          <p
            key={issue.code}
            data-testid="issue-height"
            className="text-xs text-danger"
          >
            {issue.message}
          </p>
        ))}
      </div>

      {/* Width input (meters) */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="art-width">Width (meters)</Label>
        <Input
          id="art-width"
          type="number"
          tabular
          min={0.1}
          max={wallLength}
          step={0.1}
          value={width}
          onChange={(e) => setWidth(parseFloat(e.target.value) || 0.1)}
        />
      </div>

      {/* Story */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="art-story">Story / Description</Label>
        <textarea
          id="art-story"
          rows={3}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Story or description of artwork"
          className="w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-xs text-graphite placeholder:text-pencil transition-colors duration-fast focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="flex-1"
        >
          {existingArtwork ? "Save changes" : "Add artwork"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {existingArtwork && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
