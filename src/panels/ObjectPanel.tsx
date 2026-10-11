"use client";

import React, { useMemo, useState } from "react";
import { useGalleryStore } from "@/store/gallery";
import { uploadArtwork, UploadButton } from "@/upload/UploadButton";
import { compile } from "@/lib/compile/compile";
import type { CompileIssue } from "@/lib/compile/frames";
import type { Artwork, Room, VoiceOverData, Wall } from "@/lib/schema/types";
import { Button, Input, Label, Select, Slider } from "@/components/ui";
import { VoiceoverControl } from "./VoiceoverControl";
import { InspectFields, cleanInspectDetails } from "./InspectFields";
import { isInspectable } from "@/lib/inspect";
import type { InspectFact } from "@/lib/schema/types";

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

// Decode locally before upload, and release the temporary URL on every outcome.
async function animatedPoster(
  file: File,
): Promise<{ poster: File; aspect: number }> {
  const localUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  const source =
    file.type === "image/gif" || /\.gif$/i.test(file.name)
      ? new Image()
      : video;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          finish(
            new Error("Could not read this animation. Try another GIF or MP4."),
          ),
        15000,
      );
      function finish(error?: Error) {
        clearTimeout(timer);
        source.onload = null;
        source.onerror = null;
        video.onloadeddata = null;
        if (error) reject(error);
        else resolve();
      }
      source.onerror = () =>
        finish(new Error("Could not decode this GIF or MP4."));
      if (source instanceof HTMLImageElement) source.onload = () => finish();
      else video.onloadeddata = () => finish();
      source.src = localUrl;
    });
    const width =
      source instanceof HTMLImageElement
        ? source.naturalWidth
        : video.videoWidth;
    const height =
      source instanceof HTMLImageElement
        ? source.naturalHeight
        : video.videoHeight;
    const aspect = height / width;
    if (!Number.isFinite(aspect) || aspect < 0.2 || aspect > 5)
      throw new Error(
        "Animated art must have an aspect ratio between 0.2 and 5.",
      );
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1024 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a poster.");
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Could not create a poster.")),
        "image/webp",
        0.85,
      ),
    );
    return {
      poster: new File([blob], "poster.webp", { type: blob.type }),
      aspect,
    };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(localUrl);
  }
}

const WALL_OPTIONS: { value: Wall; label: string }[] = [
  { value: "n", label: "North" },
  { value: "e", label: "East" },
  { value: "s", label: "South" },
  { value: "w", label: "West" },
];

export function ObjectPanel(props: ObjectPanelProps) {
  const target = props.artworkId ?? props.artwork?.id ?? "new";
  return <ObjectPanelForm key={props.roomId + ":" + target} {...props} />;
}

function ObjectPanelForm({
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
  const [media, setMedia] = useState<Artwork["media"]>(existingArtwork?.media);
  const [animated, setAnimated] = useState(Boolean(existingArtwork?.media));
  const [uploading, setUploading] = useState(false);
  const [frameStyle, setFrameStyle] = useState<"frame" | "tv">(
    existingArtwork?.frameStyle ?? "frame",
  );
  const [title, setTitle] = useState(existingArtwork?.title ?? "");
  const [artist, setArtist] = useState(existingArtwork?.artist ?? "");
  const [story, setStory] = useState(existingArtwork?.story ?? "");
  const [voiceOver, setVoiceOver] = useState<VoiceOverData | undefined>(
    existingArtwork?.voiceOver,
  );
  const [inspectable, setInspectable] = useState(
    existingArtwork ? isInspectable(existingArtwork, "artwork") : true,
  );
  const [facts, setFacts] = useState<InspectFact[]>(existingArtwork?.facts ?? []);
  const [link, setLink] = useState(existingArtwork?.link ?? "");
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
    setMedia(existingArtwork.media);
    setAnimated(Boolean(existingArtwork.media));
    setFrameStyle(existingArtwork.frameStyle ?? "frame");
    setTitle(existingArtwork.title);
    setArtist(existingArtwork.artist);
    setStory(existingArtwork.story);
    setVoiceOver(existingArtwork.voiceOver);
    setInspectable(isInspectable(existingArtwork, "artwork"));
    setFacts(existingArtwork.facts ?? []);
    setLink(existingArtwork.link ?? "");
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

  const handleAnimatedUpload = async (file: File) => {
    setUploading(true);
    setFormError(null);
    try {
      if (file.size > 4 * 1024 * 1024)
        throw new Error(
          "Animated art can be up to 4 MB. Try a shorter clip (10-15 s at 720p) or a smaller GIF.",
        );
      const { poster, aspect: nextAspect } = await animatedPoster(file);
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/upload/media", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Animation upload failed");
      const uploaded = await uploadArtwork(poster);
      setImage(uploaded.image);
      setAspect(nextAspect);
      setMedia({
        kind: result.kind,
        url: result.url,
        posterUrl: uploaded.image.medium,
        aspect: nextAspect,
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Animation upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (uploading) return;
    if (animated && !media) {
      setFormError("Please upload a GIF or MP4");
      return;
    }
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
      media: animated ? media : undefined,
      frameStyle,
      title: title.trim() || "Untitled",
      artist: artist.trim(),
      story: story.trim(),
      voiceOver,
      inspectable,
      ...cleanInspectDetails(facts, link),
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
          role="alert"
          data-testid="object-panel-error"
          className="text-xs font-medium text-danger"
        >
          {formError}
        </div>
      )}

      {/* Image Upload */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="art-media-type">Artwork format</Label>
        <Select
          id="art-media-type"
          value={animated ? "animated" : "image"}
          disabled={uploading}
          onChange={(e) => {
            setAnimated(e.target.value === "animated");
            setFormError(null);
          }}
        >
          <option value="image">Image</option>
          <option value="animated">Animated (GIF or MP4)</option>
        </Select>
        {animated ? (
          <>
            <Label htmlFor="art-animation">
              Upload GIF or MP4 (up to 4 MB)
            </Label>
            <Input
              id="art-animation"
              type="file"
              accept="image/gif,video/mp4,.gif,.mp4"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleAnimatedUpload(file);
              }}
            />
            {uploading && <p role="status">Uploading animation and poster…</p>}
            {media?.kind === "video" && (
              <video
                src={media.url}
                poster={media.posterUrl}
                muted
                loop
                autoPlay
                playsInline
                className="max-h-40"
                aria-label="Animated artwork preview"
              />
            )}

            {media?.kind === "gif" && (
              // eslint-disable-next-line @next/next/no-img-element -- GIF must retain its animation
              <img
                src={media.url}
                alt="Animated artwork preview"
                className="max-h-40"
              />
            )}
          </>
        ) : (
          <UploadButton
            onUploaded={({ image: uploadedImage, aspect: uploadedAspect }) => {
              setImage(uploadedImage);
              setAspect(uploadedAspect);
              setFormError(null);
            }}
          />
        )}
        <Label htmlFor="art-frame-style">Frame style</Label>
        <Select
          id="art-frame-style"
          value={frameStyle}
          onChange={(e) => setFrameStyle(e.target.value as "frame" | "tv")}
        >
          <option value="frame">Frame</option>
          <option value="tv">TV</option>
        </Select>
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

      {/* Inspection: switch, story, audio guide, details, link */}
      <InspectFields
        idPrefix="art"
        inspectable={inspectable}
        onInspectableChange={setInspectable}
        facts={facts}
        onFactsChange={setFacts}
        link={link}
        onLinkChange={setLink}
      >
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

      {/* Voiceover / Audio Guide */}
      <VoiceoverControl
        trigger="Plays the first time a visitor opens this artwork each visit; they can replay it from its panel."
        label="Artwork Audio Guide / Voiceover"
        value={voiceOver}
        defaultText={story}
        onChange={setVoiceOver}
      />

      </InspectFields>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={uploading}
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
