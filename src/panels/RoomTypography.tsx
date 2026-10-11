"use client";

// Room title typography (editor): the typeface for the room's arrival title and plaques (curated
// or uploaded), a live preview, and where the title floats in the viewer.

import React, { useEffect, useRef, useState } from "react";
import type { Room } from "@/lib/schema/types";
import { CURATED_FONTS, CUSTOM_FONT_ID, getFontFamily, loadCustomFont } from "@/lib/fonts";
import { FONT_HINT, isSafeFontUrl } from "@/lib/fontLimit";
import { uploadFont } from "@/upload/uploadFont";
import { Button, Label, Select } from "@/components/ui";

const POSITIONS: { id: NonNullable<Room["titlePosition"]>; label: string; cell: string }[] = [
  { id: "top-left", label: "Top Left", cell: "col-start-1 row-start-1" },
  { id: "center", label: "Center", cell: "col-start-2 row-start-1" },
  { id: "top-right", label: "Top Right", cell: "col-start-3 row-start-1" },
  { id: "bottom-left", label: "Bottom Left", cell: "col-start-1 row-start-2" },
  { id: "bottom-right", label: "Bottom Right", cell: "col-start-3 row-start-2" },
];

export function RoomTypography({
  room,
  onChange,
}: {
  room: Room;
  onChange: (patch: Partial<Room>) => void;
}) {
  const fontId = room.titleFont ?? "archivo";
  const position = room.titlePosition ?? "top-left";
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fontId === CUSTOM_FONT_ID) void loadCustomFont(room.customFontUrl);
  }, [fontId, room.customFontUrl]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadFont(file);
      onChange({ titleFont: CUSTOM_FONT_ID, customFontUrl: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const hasUpload = isSafeFontUrl(room.customFontUrl);

  return (
    <div className="flex flex-col gap-2.5 rounded-[2px] border border-hairline/80 bg-paper/60 p-2.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="room-font-select" className="text-xs font-semibold text-graphite">
          Room title
        </Label>
        <span className="text-[10px] uppercase tracking-wider text-pencil">
          {fontId === CUSTOM_FONT_ID
            ? "Your font"
            : (CURATED_FONTS.find((f) => f.id === fontId)?.vibe ?? "Curated")}
        </span>
      </div>

      {/* Live preview in the chosen face */}
      <div
        data-testid="room-font-preview"
        className="truncate rounded-[2px] bg-graphite px-3 py-2.5 text-xl leading-tight text-paper"
        style={{ fontFamily: getFontFamily(fontId, room.customFontUrl) }}
      >
        {room.name || "Room title"}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="room-font-select" className="text-[11px] text-pencil">
          Typeface
        </Label>
        <Select
          id="room-font-select"
          value={fontId}
          onChange={(e) => onChange({ titleFont: e.target.value })}
        >
          {CURATED_FONTS.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name} ({font.vibe})
            </option>
          ))}
          <option value={CUSTOM_FONT_ID}>Upload your own…</option>
        </Select>
      </div>

      {fontId === CUSTOM_FONT_ID ? (
        <div className="flex flex-col gap-1">
          <input
            ref={fileRef}
            id="room-custom-font-input"
            type="file"
            accept=".woff2,.woff,.otf,.ttf,font/woff2,font/woff,font/otf,font/ttf"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="text-xs"
            >
              {uploading ? "Uploading…" : hasUpload ? "Replace font…" : "Upload font…"}
            </Button>
            <span className="text-[11px] text-pencil">
              {hasUpload ? "Font uploaded" : FONT_HINT}
            </span>
          </div>
          {error ? (
            <p role="alert" className="text-[11px] text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-pencil" id="room-title-position-label">
          Position in the viewer
        </span>
        <div
          role="radiogroup"
          aria-labelledby="room-title-position-label"
          className="grid grid-cols-3 grid-rows-2 gap-1 rounded-[2px] bg-plaster p-1"
        >
          {POSITIONS.map((pos) => {
            const active = position === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ titlePosition: pos.id })}
                className={`${pos.cell} rounded-[2px] border px-1.5 py-1 text-[11px] font-medium transition-colors duration-[var(--duration-fast)] ${
                  active
                    ? "border-accent bg-accent-subtle text-accent"
                    : "border-hairline bg-paper text-pencil hover:text-graphite"
                }`}
              >
                {pos.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
