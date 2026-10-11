"use client";

// Device editor (object panel): turn a piece of furniture into something visitors use. A video
// screen (upload an MP4, size the screen), a listening station (a list of songs with covers), or a
// guestbook (the line that invites visitors to sign). Changes write through updateObject.

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Music, Plus, Trash2, Upload, X } from "lucide-react";
import type { GalleryObject, ObjectDevice, Track } from "@/lib/schema/types";
import { DEVICE_LABELS, DEVICE_PRESETS, type DeviceKind } from "@/lib/devices";
import { songDisplayName } from "@/audio/tracks";
import { uploadArtwork } from "@/upload/UploadButton";
import { Input, Label, Select, Slider } from "@/components/ui";
import { MAX_AUDIO_BYTES } from "@/lib/audioLimit";

const MAX_VIDEO_BYTES = 4 * 1024 * 1024;

/** Open the file picker without keeping an <input type="file"> in the panel. */
function pickFile(accept: string, onFile: (f: File) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.onchange = () => {
    const f = input.files?.[0];
    if (f) onFile(f);
  };
  input.click();
}
const MAX_TRACKS = 12;

async function postFile(endpoint: string, file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? `Upload failed (${res.status})`);
  return { url: data.url };
}

/** "Nights - Frank Ocean.mp3" → { title: "Nights", artist: "Frank Ocean" }. */
export function trackFromFileName(name: string): Pick<Track, "title" | "artist"> {
  const display = songDisplayName(name);
  const [title, ...rest] = display.split(" - ");
  const artist = rest.join(" - ").trim();
  return artist ? { title: title.trim(), artist } : { title: display.trim() };
}

function videoAspect(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const done = (a: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(a) && a > 0.2 && a < 4 ? a : 9 / 16);
    };
    v.onloadedmetadata = () => done(v.videoHeight / v.videoWidth);
    v.onerror = () => done(9 / 16);
    v.src = url;
  });
}

const small = "text-[10px] leading-snug text-pencil";
const iconBtn =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-pencil transition-colors hover:bg-plaster hover:text-graphite disabled:opacity-30";

export function DeviceFields({
  object,
  onChange,
}: {
  object: GalleryObject;
  onChange: (device: ObjectDevice | undefined) => void;
}) {
  const device = object.device;
  return (
    <div data-testid="device-fields" className="flex flex-col gap-3 rounded-[2px] border border-hairline bg-paper/60 p-2.5">
      <div className="flex flex-col gap-1">
        <Label htmlFor="device-kind">Interactive</Label>
        <Select
          id="device-kind"
          value={device?.kind ?? ""}
          onChange={(e) => {
            const k = e.target.value as DeviceKind | "";
            onChange(k ? structuredClone(DEVICE_PRESETS[k].object.device) : undefined);
          }}
          className="text-xs"
        >
          <option value="">Nothing on top (just the object)</option>
          {(Object.keys(DEVICE_LABELS) as DeviceKind[]).map((k) => (
            <option key={k} value={k}>
              {DEVICE_LABELS[k]}
            </option>
          ))}
        </Select>
        <span className={small}>Sits on top of this object; visitors click the piece to use it.</span>
      </div>
      {device?.kind === "tv" ? <TvFields device={device} onChange={onChange} /> : null}
      {device?.kind === "turntable" ? <TurntableFields device={device} onChange={onChange} /> : null}
      {device?.kind === "guestbook" ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor="guestbook-prompt">Invitation</Label>
          <Input
            id="guestbook-prompt"
            value={device.prompt ?? ""}
            maxLength={120}
            placeholder="Leave a note for the artist."
            onChange={(e) => onChange({ ...device, prompt: e.target.value })}
            className="text-xs"
          />
          <span className={small}>Signatures appear in the panel and on the book&apos;s pages.</span>
        </div>
      ) : null}
    </div>
  );
}

function TvFields({
  device,
  onChange,
}: {
  device: Extract<ObjectDevice, { kind: "tv" }>;
  onChange: (d: ObjectDevice) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_VIDEO_BYTES) {
      setError("Videos can be up to 4 MB. Try a shorter clip (15-30 s at 720p).");
      return;
    }
    setBusy(true);
    try {
      const [aspect, { url }] = await Promise.all([videoAspect(file), postFile("/api/upload/media", file)]);
      onChange({ ...device, video: { url, aspect } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        data-testid="tv-upload"
        disabled={busy}
        onClick={() => pickFile("video/mp4", (f) => void onFile(f))}
        className="inline-flex items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-hairline px-2.5 py-2 text-xs text-graphite transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? "Uploading…" : device.video.url ? "Replace video (MP4)" : "Upload a video (MP4, up to 4 MB)"}
      </button>
      {device.video.url ? <span className={small}>Plays on a loop, muted until a visitor turns the sound on.</span> : null}
      {error ? <span className="text-[10px] text-danger">{error}</span> : null}
      <div className="flex flex-col gap-1">
        <Label htmlFor="tv-screen">{`Screen width · ${device.screen.toFixed(1)} m`}</Label>
        <Slider
          id="tv-screen"
          min={0.6}
          max={2.2}
          step={0.1}
          value={device.screen}
          onChange={(v) => onChange({ ...device, screen: v })}
        />
      </div>
    </div>
  );
}

function TurntableFields({
  device,
  onChange,
}: {
  device: Extract<ObjectDevice, { kind: "turntable" }>;
  onChange: (d: ObjectDevice) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tracks = device.tracks;
  const set = (next: Track[]) => onChange({ ...device, tracks: next });
  const patch = (i: number, p: Partial<Track>) => set(tracks.map((t, k) => (k === i ? { ...t, ...p } : t)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= tracks.length) return;
    const next = tracks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  const addSong = async (file: File) => {
    setError(null);
    if (file.size > MAX_AUDIO_BYTES) {
      setError("Songs can be up to 4 MB (MP3 or M4A work best).");
      return;
    }
    setBusy("Uploading song…");
    try {
      const { url } = await postFile("/api/upload/audio", file);
      set([...tracks, { ...trackFromFileName(file.name), url }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  };
  const addCover = async (i: number, file: File) => {
    setError(null);
    setBusy("Uploading cover…");
    try {
      const { image } = await uploadArtwork(file);
      patch(i, { coverUrl: image.small });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{`Records · ${tracks.length}`}</Label>
      {tracks.map((t, i) => (
        <div key={`${t.url}-${i}`} className="flex items-start gap-1.5 rounded-[2px] border border-hairline bg-paper p-1.5">
          <button
            type="button"
            title="Cover art"
            aria-label={`Cover for ${t.title || `song ${i + 1}`}`}
            onClick={() => {
              pickFile("image/*", (f) => void addCover(i, f));
            }}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-plaster text-pencil hover:text-accent"
          >
            {t.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Input
              aria-label={`Song ${i + 1} title`}
              value={t.title}
              maxLength={120}
              placeholder="Title"
              onChange={(e) => patch(i, { title: e.target.value })}
              className="h-7 text-xs"
            />
            <Input
              aria-label={`Song ${i + 1} artist`}
              value={t.artist ?? ""}
              maxLength={120}
              placeholder="Artist"
              onChange={(e) => patch(i, { artist: e.target.value || undefined })}
              className="h-7 text-xs"
            />
          </div>
          <div className="flex flex-col">
            <button type="button" className={iconBtn} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={iconBtn}
              aria-label="Move down"
              disabled={i === tracks.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${iconBtn} hover:text-danger`}
              aria-label={`Remove ${t.title || `song ${i + 1}`}`}
              onClick={() => set(tracks.filter((_, k) => k !== i))}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
      {tracks.length < MAX_TRACKS ? (
        <button
          type="button"
          data-testid="turntable-add-song"
          disabled={Boolean(busy)}
          onClick={() => pickFile("audio/*", (f) => void addSong(f))}
          className="inline-flex items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-hairline px-2.5 py-2 text-xs text-graphite transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {busy ?? "Add a song (MP3, M4A, WAV)"}
        </button>
      ) : null}
      {error ? (
        <span className="flex items-center gap-1 text-[10px] text-danger">
          <X className="h-3 w-3" aria-hidden="true" /> {error}
        </span>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="turntable-accent">Light color</Label>
        <input
          id="turntable-accent"
          type="color"
          value={device.accent ?? "#e8b04a"}
          onChange={(e) => onChange({ ...device, accent: e.target.value })}
          className="h-6 w-10 cursor-pointer rounded border border-hairline bg-paper"
        />
      </div>
    </div>
  );
}

/** Album wall (artwork panel): the song this cover plays when a visitor opens it. */
export function TrackField({ track, onChange }: { track?: Track; onChange: (t: Track | undefined) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_AUDIO_BYTES) {
      setError("Songs can be up to 4 MB (MP3 or M4A work best).");
      return;
    }
    setBusy(true);
    try {
      const { url } = await postFile("/api/upload/audio", file);
      onChange({ ...trackFromFileName(file.name), url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div data-testid="track-field" className="flex flex-col gap-1.5">
      <Label>Song (album wall, optional)</Label>
      {track ? (
        <div className="flex items-center gap-1.5">
          <Input
            aria-label="Song title"
            value={track.title}
            maxLength={120}
            onChange={(e) => onChange({ ...track, title: e.target.value })}
            className="h-7 text-xs"
          />
          <Input
            aria-label="Song artist"
            value={track.artist ?? ""}
            maxLength={120}
            placeholder="Artist"
            onChange={(e) => onChange({ ...track, artist: e.target.value || undefined })}
            className="h-7 text-xs"
          />
          <button type="button" className={`${iconBtn} hover:text-danger`} aria-label="Remove song" onClick={() => onChange(undefined)}>
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => pickFile("audio/*", (f) => void onFile(f))}
          className="inline-flex items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-hairline px-2.5 py-2 text-xs text-graphite transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <Music className="h-3.5 w-3.5" aria-hidden="true" /> {busy ? "Uploading…" : "Attach a song to this cover"}
        </button>
      )}
      <span className={small}>Visitors can play it from the cover&apos;s panel; it takes over the room&apos;s music.</span>
      {error ? <span className="text-[10px] text-danger">{error}</span> : null}
    </div>
  );
}
