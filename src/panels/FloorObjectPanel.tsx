"use client";

import React, { useState } from "react";
import { libraryEntry } from "@/lib/objects/library";
import { useGalleryStore } from "@/store/gallery";
import { clampObjectPosition, computeObjectFootprint } from "@/editor2d/FloorObjects";
import type { GalleryObject, ObjectSource } from "@/lib/schema/types";
import { Button, Input, Label, Slider, Toggle } from "@/components/ui";
import { VoiceoverControl } from "./VoiceoverControl";
import { InspectFields } from "./InspectFields";
import { DeviceFields } from "./DeviceFields";
import { isInspectable, safeLink } from "@/lib/inspect";

export interface FloorObjectPanelProps {
  objectId: string;
  object?: GalleryObject;
  onReplace?: (roomId: string) => void;
  onDeleted?: () => void;
  onCancel?: () => void;
  className?: string;
}

/** Plain-words source line for a placed object (T-132). Pure, unit-tested. */
export function objectSourceLabel(source: ObjectSource): string {
  if (source.kind === "library") {
    const entry = libraryEntry(source.libraryId);
    return `Library: ${entry?.name ?? source.libraryId}`;
  }
  if (source.kind === "model") {
    return source.origin === "upload" ? "3D file" : "3D from photo";
  }
  return "Cut-out";
}

const PLINTH_OPTIONS = [
  { value: "none", label: "None" },
  { value: "box", label: "Box" },
  { value: "cylinder", label: "Round" },
] as const;

/**
 * Edit a placed free-standing object (T-132): height, rotation, plinth, and the
 * title/artist/story plaque fields. Everything writes through updateObject, so
 * undo/redo covers all of it (T-076).
 */
export function FloorObjectPanel({
  objectId,
  object: propObject,
  onReplace,
  onDeleted,
  onCancel,
  className = "",
}: FloorObjectPanelProps) {
  const storeObjects = useGalleryStore((s) => s.gallery.objects);
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const updateObject = useGalleryStore((s) => s.updateObject);
  const removeObject = useGalleryStore((s) => s.removeObject);

  const object =
    propObject ?? (storeObjects ?? []).find((o) => o.id === objectId);
  const room = (storeRooms ?? []).find((r) => r.id === object?.roomId);
  // Link field draft (per object), so a half-typed URL is never stored.
  const [linkState, setLinkState] = useState<{ id?: string; value: string }>({ value: "" });
  const linkDraft = linkState.id === object?.id ? linkState.value : (object?.link ?? "");
  const setLinkDraft = (value: string) => setLinkState({ id: object?.id, value });

  if (!object) {
    return (
      <div
        data-testid="floor-object-panel-missing"
        className="p-4 text-xs text-pencil"
      >
        Object not found.
      </div>
    );
  }

  // Same bounds as dragging the marker on the plan (edge margin + half the footprint).
  const side = computeObjectFootprint(object);
  const posRange = (dim: number) => ({
    min: clampObjectPosition(dim, 0, side),
    max: clampObjectPosition(dim, dim, side),
  });
  const xRange = posRange(room?.w ?? 0);
  const yRange = posRange(room?.d ?? 0);
  const setPosition = (x: number, y: number) =>
    updateObject(object.id, {
      position: { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 },
    });

  const handleDelete = () => {
    removeObject(object.id);
    onDeleted?.();
  };

  return (
    <div
      data-testid="floor-object-panel"
      className={`flex flex-col gap-4 p-4 text-sm text-graphite ${className}`}
    >
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <h2 className="font-semibold text-graphite">Edit object</h2>
        <span
          data-testid="floor-object-source"
          className="text-xs text-pencil"
        >
          {objectSourceLabel(object.source)}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onReplace?.(object.roomId)}
        >
          Replace…
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>

      {/* Height */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <Label htmlFor="floor-object-height">Height</Label>
          <span className="text-pencil tabular-nums font-mono text-[11px]">
            {object.height.toFixed(2)} m
          </span>
        </div>
        <Slider
          id="floor-object-height"
          min={0.2}
          max={3.0}
          step={0.05}
          value={object.height}
          onChange={(val) => updateObject(object.id, { height: val })}
        />
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <Label htmlFor="floor-object-rotation">Rotation</Label>
          <span className="text-pencil tabular-nums font-mono text-[11px]">
            {Math.round(object.rotation)}°
          </span>
        </div>
        <Slider
          id="floor-object-rotation"
          min={0}
          max={345}
          step={15}
          value={object.rotation}
          onChange={(val) => updateObject(object.id, { rotation: val })}
        />
      </div>

      {/* Position X */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <Label htmlFor="floor-object-pos-x">Position X</Label>
          <span className="text-pencil tabular-nums font-mono text-[11px]">
            {object.position.x.toFixed(2)} m
          </span>
        </div>
        <Slider
          id="floor-object-pos-x"
          min={xRange.min}
          max={xRange.max}
          step={0.05}
          value={object.position.x}
          onChange={(val) => setPosition(val, object.position.y)}
        />
      </div>

      {/* Position Y */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <Label htmlFor="floor-object-pos-y">Position Y</Label>
          <span className="text-pencil tabular-nums font-mono text-[11px]">
            {object.position.y.toFixed(2)} m
          </span>
        </div>
        <Slider
          id="floor-object-pos-y"
          min={yRange.min}
          max={yRange.max}
          step={0.05}
          value={object.position.y}
          onChange={(val) => setPosition(object.position.x, val)}
        />
      </div>

      {/* Center in room */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="floor-object-center-btn"
          className="text-xs"
          disabled={!room}
          onClick={() => room && setPosition(room.w / 2, room.d / 2)}
        >
          Center in room
        </Button>
      </div>

      {/* Plinth shape */}
      <div className="flex flex-col gap-1.5">
        <Label id="floor-object-plinth-label">Plinth</Label>
        <div
          role="group"
          aria-labelledby="floor-object-plinth-label"
          className="flex gap-1"
        >
          {PLINTH_OPTIONS.map((opt) => (
            <Toggle
              key={opt.value}
              size="sm"
              pressed={object.plinth.shape === opt.value}
              onPressedChange={() => {
                if (object.plinth.shape !== opt.value) {
                  updateObject(object.id, {
                    plinth: {
                      shape: opt.value,
                      height:
                        opt.value === "none" ? 0 : object.plinth.height || 0.8,
                    },
                  });
                }
              }}
              aria-pressed={object.plinth.shape === opt.value}
            >
              {opt.label}
            </Toggle>
          ))}
        </div>
      </div>

      {/* Plinth height */}
      {object.plinth.shape !== "none" ? (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <Label htmlFor="floor-object-plinth-height">Plinth height</Label>
            <span className="text-pencil tabular-nums font-mono text-[11px]">
              {object.plinth.height.toFixed(2)} m
            </span>
          </div>
          <Slider
            id="floor-object-plinth-height"
            min={0.2}
            max={1.5}
            step={0.05}
            value={object.plinth.height}
            onChange={(val) =>
              updateObject(object.id, {
                plinth: { ...object.plinth, height: val },
              })
            }
          />
        </div>
      ) : null}

      {/* Cut-out depth (cutout only) */}
      {object.source.kind === "cutout" &&
        (() => {
          const cutoutSource = object.source as Extract<
            ObjectSource,
            { kind: "cutout" }
          >;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <Label htmlFor="floor-object-cutout-depth">Cut-out depth</Label>
                <span className="text-pencil tabular-nums font-mono text-[11px]">
                  {`${cutoutSource.depth.toFixed(2)} m`}
                </span>
              </div>
              <Slider
                id="floor-object-cutout-depth"
                min={0.01}
                max={0.3}
                step={0.01}
                value={cutoutSource.depth}
                onChange={(val) =>
                  updateObject(object.id, {
                    source: {
                      ...cutoutSource,
                      depth: val,
                    },
                  })
                }
              />
            </div>
          );
        })()}

      {/* Title */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="floor-object-title">Title</Label>
        <Input
          id="floor-object-title"
          type="text"
          value={object.title}
          onChange={(e) => updateObject(object.id, { title: e.target.value })}
          placeholder="Untitled"
        />
      </div>

      {/* Artist */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="floor-object-artist">Artist</Label>
        <Input
          id="floor-object-artist"
          type="text"
          value={object.artist}
          onChange={(e) => updateObject(object.id, { artist: e.target.value })}
          placeholder="Artist name"
        />
      </div>

      {/* Interactive device on top: video screen, listening station, guestbook */}
      <DeviceFields
        object={object}
        onChange={(device) =>
          updateObject(object.id, device ? { device, inspectable: true } : { device: undefined })
        }
      />

      {/* Inspection: switch, story, audio guide, details, link */}
      <InspectFields
        idPrefix="floor-object"
        inspectable={isInspectable(object, "object")}
        onInspectableChange={(on) => updateObject(object.id, { inspectable: on })}
        facts={object.facts ?? []}
        onFactsChange={(facts) => updateObject(object.id, { facts })}
        link={linkDraft}
        onLinkChange={(next) => {
          setLinkDraft(next);
          // Store only a valid https link (or clear it); a half-typed one stays local.
          const t = next.trim();
          if (!t) updateObject(object.id, { link: undefined });
          else if (safeLink(t)) updateObject(object.id, { link: t });
        }}
        action={object.action}
        onActionChange={(a) => updateObject(object.id, { action: a === "learn" ? undefined : a })}
        price={object.price ?? ""}
        onPriceChange={(p) => updateObject(object.id, { price: p.trim() ? p : undefined })}
      >
      {/* Story */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="floor-object-story">Story / Description</Label>
        <textarea
          id="floor-object-story"
          rows={3}
          value={object.story}
          onChange={(e) => updateObject(object.id, { story: e.target.value })}
          placeholder="Story or description of this object"
          className="w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-xs text-graphite placeholder:text-pencil transition-colors duration-fast focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        />
      </div>

      {/* Voiceover / Audio Guide */}
      <VoiceoverControl
        trigger="Plays the first time a visitor opens this object each visit; they can replay it from its panel."
        key={object.id}
        label="Exhibit Audio Guide / Voiceover"
        value={object.voiceOver}
        defaultText={object.story}
        onChange={(voiceOver) => updateObject(object.id, { voiceOver })}
      />
      </InspectFields>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onReplace?.(object.roomId)}
        >
          Replace…
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          Delete
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );
}
