"use client";

import React, { useRef, useState } from "react";
import { hasOverlap } from "@/editor2d/overlap";
import { snap } from "@/lib/schema/geom";
import { useGalleryStore } from "@/store/gallery";
import type { Atmosphere, Room } from "@/lib/schema/types";
import { TRACKS } from "@/audio/tracks";
import { AUDIO_HINT, checkAudioSize } from "@/lib/audioLimit";
import { Button, Input, Label, Select, Slider, Toggle } from "@/components/ui";

export interface RoomPanelProps {
  room?: Room;
  rooms?: readonly Room[];
  onAddObject?: (roomId: string) => void;
  className?: string;
}

export function RoomPanel({
  room: propRoom,
  rooms: propRooms,
  onAddObject,
  className,
}: RoomPanelProps) {
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const rooms = propRooms ?? storeRooms;
  const artworks = useGalleryStore((s) => s.gallery.artworks);
  const selection = useGalleryStore((s) => s.selection);
  const select = useGalleryStore((s) => s.select);
  const updateRoom = useGalleryStore((s) => s.updateRoom);
  const deleteRoom = useGalleryStore((s) => s.deleteRoom);

  const selectedRoomId =
    propRoom?.id ?? (selection.kind === "room" ? selection.id : null);
  const room = propRoom ?? rooms.find((r) => r.id === selectedRoomId);

  const [prevRoomId, setPrevRoomId] = useState(room?.id);
  const [invalidWidth, setInvalidWidth] = useState<string | null>(null);
  const [invalidDepth, setInvalidDepth] = useState<string | null>(null);
  const [invalidHeight, setInvalidHeight] = useState<string | null>(null);

  const [widthError, setWidthError] = useState<string | null>(null);
  const [depthError, setDepthError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [audioUrlError, setAudioUrlError] = useState<string | null>(null);

  if (room && room.id !== prevRoomId) {
    setPrevRoomId(room.id);
    setInvalidWidth(null);
    setInvalidDepth(null);
    setInvalidHeight(null);
    setWidthError(null);
    setDepthError(null);
    setHeightError(null);
    setDeleteError(null);
    setAudioUploadError(null);
  }

  if (!room) {
    return (
      <div data-testid="room-panel-empty" className="p-4 text-xs text-pencil">
        No room selected.
      </div>
    );
  }

  const handleWidthChange = (valStr: string) => {
    const val = Number(valStr);
    if (valStr.trim() === "" || isNaN(val)) {
      setInvalidWidth(valStr);
      setWidthError("Please enter a valid number");
      return;
    }
    if (val < 2) {
      setInvalidWidth(valStr);
      setWidthError("Width must be at least 2 m");
      return;
    }
    const snapped = snap(val);
    const candidate = { x: room.x, y: room.y, w: snapped, d: room.d };
    if (hasOverlap(candidate, rooms, room.id)) {
      setInvalidWidth(valStr);
      setWidthError("New width causes room to overlap an existing room");
      return;
    }
    setInvalidWidth(null);
    setWidthError(null);
    updateRoom(room.id, { w: snapped });
  };

  const handleDepthChange = (valStr: string) => {
    const val = Number(valStr);
    if (valStr.trim() === "" || isNaN(val)) {
      setInvalidDepth(valStr);
      setDepthError("Please enter a valid number");
      return;
    }
    if (val < 2) {
      setInvalidDepth(valStr);
      setDepthError("Depth must be at least 2 m");
      return;
    }
    const snapped = snap(val);
    const candidate = { x: room.x, y: room.y, w: room.w, d: snapped };
    if (hasOverlap(candidate, rooms, room.id)) {
      setInvalidDepth(valStr);
      setDepthError("New depth causes room to overlap an existing room");
      return;
    }
    setInvalidDepth(null);
    setDepthError(null);
    updateRoom(room.id, { d: snapped });
  };

  const handleHeightChange = (valStr: string) => {
    const val = Number(valStr);
    if (valStr.trim() === "" || isNaN(val)) {
      setInvalidHeight(valStr);
      setHeightError("Please enter a valid number");
      return;
    }
    if (val < 2) {
      setInvalidHeight(valStr);
      setHeightError("Wall height must be at least 2 m");
      return;
    }
    const snapped = snap(val);
    setInvalidHeight(null);
    setHeightError(null);
    updateRoom(room.id, { wallHeight: snapped });
  };

  const handleDeleteRoom = () => {
    setDeleteError(null);
    const success = deleteRoom(room.id);
    if (!success) {
      setDeleteError("Cannot delete the only remaining room.");
    }
  };

  const handleAudioFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tooLarge = checkAudioSize(file.size);
    if (tooLarge) {
      setAudioUploadError(tooLarge);
      if (audioInputRef.current) audioInputRef.current.value = "";
      return;
    }

    setAudioUploading(true);
    setAudioUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      if (data.url) {
        updateRoom(room.id, { music: { url: data.url } });
      }
    } catch (err: unknown) {
      setAudioUploadError(
        err instanceof Error ? err.message : "Failed to upload audio",
      );
    } finally {
      setAudioUploading(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const roomArtworks = artworks.filter((a) => a.roomId === room.id);

  return (
    <div
      data-testid="room-panel"
      className={`flex flex-col gap-4 text-sm text-graphite ${className ?? ""}`}
    >
      <div>
        <h2 className="text-base font-semibold text-graphite">
          Room Properties
        </h2>
        <p className="text-xs text-pencil">
          Configure dimensions, materials and lighting
        </p>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="room-name-input">Name</Label>
        <Input
          id="room-name-input"
          type="text"
          value={room.name}
          onChange={(e) => updateRoom(room.id, { name: e.target.value })}
          placeholder="Room name"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="room-desc-input">Description</Label>
        <textarea
          id="room-desc-input"
          rows={2}
          value={room.description}
          onChange={(e) => updateRoom(room.id, { description: e.target.value })}
          placeholder="Optional room description"
          className="w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-xs text-graphite placeholder:text-pencil transition-colors duration-fast focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        />
      </div>

      {/* Dimensions: Width and Depth */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="room-width-input">Width (m)</Label>
          <Input
            id="room-width-input"
            type="number"
            tabular
            step={0.5}
            min={2}
            value={invalidWidth ?? room.w}
            onChange={(e) => handleWidthChange(e.target.value)}
            className={
              widthError
                ? "border-danger focus-visible:border-danger focus-visible:ring-danger"
                : ""
            }
          />
          {widthError && (
            <span role="alert" className="text-[11px] font-medium text-danger">
              {widthError}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="room-depth-input">Depth (m)</Label>
          <Input
            id="room-depth-input"
            type="number"
            tabular
            step={0.5}
            min={2}
            value={invalidDepth ?? room.d}
            onChange={(e) => handleDepthChange(e.target.value)}
            className={
              depthError
                ? "border-danger focus-visible:border-danger focus-visible:ring-danger"
                : ""
            }
          />
          {depthError && (
            <span role="alert" className="text-[11px] font-medium text-danger">
              {depthError}
            </span>
          )}
        </div>
      </div>

      {/* Wall Height */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="room-height-input">Wall Height (m)</Label>
        <Input
          id="room-height-input"
          type="number"
          tabular
          step={0.5}
          min={2}
          value={invalidHeight ?? room.wallHeight}
          onChange={(e) => handleHeightChange(e.target.value)}
          className={
            heightError
              ? "border-danger focus-visible:border-danger focus-visible:ring-danger"
              : ""
          }
        />
        {heightError && (
          <span role="alert" className="text-[11px] font-medium text-danger">
            {heightError}
          </span>
        )}
      </div>

      {/* Wall Color */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="room-wall-color-input">Wall Color</Label>
        <div className="flex items-center gap-2">
          <input
            id="room-wall-color-picker"
            type="color"
            value={room.wallColor}
            onChange={(e) => updateRoom(room.id, { wallColor: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded-[2px] border border-hairline bg-paper p-0.5"
          />
          <Input
            id="room-wall-color-input"
            type="text"
            tabular
            value={room.wallColor}
            onChange={(e) => updateRoom(room.id, { wallColor: e.target.value })}
            placeholder="#f2efe9"
            className="flex-1 uppercase font-mono text-xs"
          />
        </div>
      </div>

      {/* Floor Preset */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="room-floor-select">Floor Preset</Label>
        <Select
          id="room-floor-select"
          value={room.floor}
          onChange={(e) =>
            updateRoom(room.id, {
              floor: e.target.value as "wood" | "concrete" | "marble",
            })
          }
        >
          <option value="wood">Wood</option>
          <option value="concrete">Concrete</option>
          <option value="marble">Marble</option>
        </Select>
      </div>

      {/* Lighting Preset */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="room-lighting-select">Lighting Preset</Label>
        <Select
          id="room-lighting-select"
          value={room.lighting}
          onChange={(e) =>
            updateRoom(room.id, {
              lighting: e.target.value as "gallery" | "warm" | "moody",
            })
          }
        >
          <option value="gallery">Gallery (Neutral / Bright)</option>
          <option value="warm">Warm (Golden / Intimate)</option>
          <option value="moody">Moody (Atmospheric / Dim)</option>
        </Select>
      </div>

      {/* Atmosphere Preset */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="room-atmosphere-select">Atmosphere Preset</Label>
        <Select
          id="room-atmosphere-select"
          value={room.atmosphere?.preset ?? "none"}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "none") {
              updateRoom(room.id, { atmosphere: undefined });
            } else {
              const currentCustom = room.atmosphere ?? {
                preset: val as Atmosphere["preset"],
                moodColor: "#ffffff",
                haze: 0.2,
                brightness: 0.8,
                lightDirection: 45,
                grain: 0,
              };
              updateRoom(room.id, {
                atmosphere: {
                  ...currentCustom,
                  preset: val as Atmosphere["preset"],
                },
              });
            }
          }}
        >
          <option value="none">None (Match lighting)</option>
          <option value="gallery-white">Gallery White</option>
          <option value="neon-bunker">Neon Bunker</option>
          <option value="golden-hour">Golden Hour</option>
          <option value="moonlit">Moonlit</option>
          <option value="custom">Custom</option>
        </Select>
      </div>

      {/* Custom Atmosphere Sliders */}
      {room.atmosphere?.preset === "custom" && (
        <div
          data-testid="custom-atmosphere-controls"
          className="flex flex-col gap-2.5 rounded-[2px] border border-hairline bg-plaster p-2.5 text-xs text-graphite"
        >
          <span className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Custom Atmosphere
          </span>

          {/* Mood Color */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="custom-mood-color">Mood Color</Label>
            <div className="flex items-center gap-1.5">
              <input
                id="custom-mood-color"
                type="color"
                value={room.atmosphere.moodColor}
                onChange={(e) =>
                  updateRoom(room.id, {
                    atmosphere: {
                      ...room.atmosphere!,
                      moodColor: e.target.value,
                    },
                  })
                }
                className="h-6 w-8 cursor-pointer rounded-[2px] border border-hairline bg-paper p-0.5"
              />
              <span className="font-mono text-[11px] text-pencil">
                {room.atmosphere.moodColor}
              </span>
            </div>
          </div>

          {/* Haze */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="custom-haze">Haze / Fog</Label>
              <span className="text-pencil tabular-nums font-mono text-[11px]">
                {Math.round(room.atmosphere.haze * 100)}%
              </span>
            </div>
            <Slider
              id="custom-haze"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.haze}
              onChange={(val) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    haze: val,
                  },
                })
              }
            />
          </div>

          {/* Brightness */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="custom-brightness">Brightness</Label>
              <span className="text-pencil tabular-nums font-mono text-[11px]">
                {Math.round(room.atmosphere.brightness * 100)}%
              </span>
            </div>
            <Slider
              id="custom-brightness"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.brightness}
              onChange={(val) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    brightness: val,
                  },
                })
              }
            />
          </div>

          {/* Light Direction */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="custom-light-direction">Light Direction</Label>
              <span className="text-pencil tabular-nums font-mono text-[11px]">
                {Math.round(room.atmosphere.lightDirection)}°
              </span>
            </div>
            <Slider
              id="custom-light-direction"
              min={0}
              max={360}
              step={1}
              value={room.atmosphere.lightDirection}
              onChange={(val) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    lightDirection: val,
                  },
                })
              }
            />
          </div>

          {/* Grain */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="custom-grain">Grain</Label>
              <span className="text-pencil tabular-nums font-mono text-[11px]">
                {Math.round(room.atmosphere.grain * 100)}%
              </span>
            </div>
            <Slider
              id="custom-grain"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.grain}
              onChange={(val) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    grain: val,
                  },
                })
              }
            />
          </div>

          {/* Glow (bloom strength; unset = derived from the look) */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="custom-glow">Glow</Label>
              <span className="text-pencil tabular-nums font-mono text-[11px]">
                {room.atmosphere.glow === undefined
                  ? "auto"
                  : `${Math.round(room.atmosphere.glow * 100)}%`}
              </span>
            </div>
            <Slider
              id="custom-glow"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.glow ?? 0.4}
              onChange={(val) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    glow: val,
                  },
                })
              }
            />
          </div>

          {/* Vignette (frame darkness; unset = derived from the look) */}          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="custom-vignette">Vignette</Label>
              <span className="text-pencil tabular-nums font-mono text-[11px]">
                {room.atmosphere.vignette === undefined
                  ? "auto"
                  : `${Math.round(room.atmosphere.vignette * 100)}%`}
              </span>
            </div>
            <Slider
              id="custom-vignette"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.vignette ?? 0.3}
              onChange={(val) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    vignette: val,
                  },
                })
              }
            />
          </div>

          {/* Artwork light (picture-spot pools; 0 = off, unset = derived) */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="custom-spots">Artwork light</Label>
              <span className="text-pencil tabular-nums font-mono text-[11px]">
                {room.atmosphere.spots === undefined
                  ? "auto"
                  : `${Math.round(room.atmosphere.spots * 100)}%`}
              </span>
            </div>
            <Slider
              id="custom-spots"
              min={0}
              max={1}
              step={0.01}
              value={room.atmosphere.spots ?? 1}
              onChange={(val) =>
                updateRoom(room.id, {
                  atmosphere: {
                    ...room.atmosphere!,
                    spots: val,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {/* Music Select */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="room-music-select">Music Track</Label>
        <Select
          id="room-music-select"
          value={room.music?.url ? "custom" : (room.music?.trackId ?? "none")}
          onChange={(e) => {
            const val = e.target.value;
            setAudioUploadError(null);
            if (val === "none") {
              updateRoom(room.id, { music: undefined });
            } else if (val === "custom") {
              updateRoom(room.id, { music: { url: room.music?.url || "" } });
            } else {
              updateRoom(room.id, { music: { trackId: val } });
            }
          }}
        >
          <option value="none">None (Silence)</option>
          {TRACKS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
          <option value="custom">Custom Audio / Upload MP3</option>
        </Select>

        {/* Custom Audio Upload & Controls */}
        {(room.music?.url !== undefined ||
          (room.music && !room.music.trackId)) && (
          <div className="mt-1 flex flex-col gap-2 rounded-[2px] border border-hairline bg-plaster/50 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-graphite">
                Custom Song / MP3
              </span>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a"
                className="hidden"
                onChange={handleAudioFileChange}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={audioUploading}
                onClick={() => audioInputRef.current?.click()}
              >
                {audioUploading
                  ? "Uploading..."
                  : room.music?.url
                    ? "Replace MP3"
                    : "Upload MP3"}
              </Button>
            </div>

            <p className="text-[10px] text-pencil">{AUDIO_HINT}</p>

            {audioUploadError && (
              <p role="alert" className="text-xs text-danger">
                {audioUploadError}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <Label htmlFor="room-audio-url" className="text-[10px]">
                Audio URL (or uploaded path)
              </Label>
              <Input
                id="room-audio-url"
                type="text"
                value={room.music?.url ?? ""}
                placeholder="/api/files/audio/... or https://.../song.mp3"
                onChange={(e) => {
                  setAudioUrlError(null);
                  updateRoom(room.id, { music: { url: e.target.value } });
                }}
              />
              <p className="text-[10px] text-pencil">
                A direct link to an audio file. Streaming pages (Apple Music,
                Spotify, YouTube) are pages, not songs — they won&apos;t play here.
              </p>
            </div>

            {audioUrlError && (
              <p role="alert" className="text-xs text-danger">
                {audioUrlError}
              </p>
            )}

            {/* Clip: which 30–60 s part plays, Instagram-story style */}
            <div className="flex flex-col gap-1.5 border-t border-hairline pt-2">
              <span className="text-[10px] font-medium text-graphite uppercase tracking-wider">
                Clip
              </span>
              <div
                role="group"
                aria-label="Clip length"
                className="flex gap-1"
              >
                {(
                  [
                    { value: undefined, label: "Full song" },
                    { value: 30, label: "30 s" },
                    { value: 45, label: "45 s" },
                    { value: 60, label: "1 min" },
                  ] as const
                ).map((opt) => (
                  <Toggle
                    key={opt.label}
                    size="sm"
                    pressed={(room.music?.length ?? undefined) === opt.value}
                    onPressedChange={() => {
                      const music = room.music ?? {};
                      if (opt.value === undefined) {
                        updateRoom(room.id, {
                          music: { trackId: music.trackId, url: music.url },
                        });
                      } else {
                        updateRoom(room.id, {
                          music: { ...music, length: opt.value },
                        });
                      }
                    }}
                    aria-pressed={(room.music?.length ?? undefined) === opt.value}
                  >
                    {opt.label}
                  </Toggle>
                ))}
              </div>
              {room.music?.length !== undefined && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="room-audio-start" className="text-[10px] shrink-0">
                    Start at
                  </Label>
                  <Input
                    id="room-audio-start"
                    type="number"
                    min={0}
                    step={1}
                    value={room.music?.start ?? 0}
                    onChange={(e) => {
                      const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                      updateRoom(room.id, {
                        music: { ...room.music, start: v },
                      });
                    }}
                    className="w-20"
                  />
                  <span className="text-[10px] text-pencil">seconds in</span>
                </div>
              )}
            </div>

            {room.music?.url && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[10px] text-pencil">Preview</span>
                <audio
                  controls
                  src={room.music.url}
                  className="h-7 w-full rounded"
                  onError={() =>
                    setAudioUrlError(
                      "That link doesn't play as audio. Use a direct MP3, WAV, OGG or M4A file URL — streaming pages (Apple Music, Spotify) won't work here.",
                    )
                  }
                  onLoadedMetadata={(e) => {
                    setAudioUrlError(null);
                    const el = e.currentTarget;
                    const start = room.music?.start ?? 0;
                    if (start > 0 && Number.isFinite(el.duration) && start < el.duration) {
                      el.currentTime = start;
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const el = e.currentTarget;
                    const length = room.music?.length;
                    if (length === undefined) return;
                    const start = room.music?.start ?? 0;
                    if (el.currentTime >= start + length) {
                      el.currentTime = start;
                    } else if (el.currentTime < start - 0.5) {
                      el.currentTime = start;
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Read-only Objects in Room List */}
      <div className="mt-1 flex flex-col gap-1.5 border-t border-hairline pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Objects in room ({roomArtworks.length})
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onAddObject?.(room.id)}
          >
            + Add object
          </Button>
        </div>
        {roomArtworks.length === 0 ? (
          <p className="text-xs text-pencil italic">No objects in this room.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {roomArtworks.map((art) => (
              <li
                key={art.id}
                onClick={() => select({ kind: "artwork", id: art.id })}
                className="flex cursor-pointer items-center justify-between rounded-[2px] bg-paper px-2 py-1.5 text-xs text-graphite border border-hairline hover:border-pencil hover:bg-plaster transition-colors duration-fast"
              >
                <div className="truncate">
                  <span className="font-medium">{art.title || "Untitled"}</span>
                  {art.artist && (
                    <span className="text-pencil ml-1">by {art.artist}</span>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-pencil font-mono">
                  {art.placement.wall.toUpperCase()} wall
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Room Button */}
      <div className="mt-3 flex flex-col gap-1 border-t border-hairline pt-3">
        {deleteError && (
          <span role="alert" className="text-xs font-medium text-danger">
            {deleteError}
          </span>
        )}
        <Button
          type="button"
          variant="destructive"
          onClick={handleDeleteRoom}
          disabled={rooms.length <= 1}
        >
          Delete room
        </Button>
      </div>
    </div>
  );
}

export default RoomPanel;
