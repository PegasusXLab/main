"use client";

import { useState, type ChangeEvent } from "react";
import { resizeImage, type ResizedImages } from "./resizeImage";

export interface UploadedArtwork {
  image: { small: string; medium: string; large?: string };
  aspect: number;
}

export interface UploadButtonProps {
  onUploaded: (result: UploadedArtwork) => void;
  /** Injected in tests. */
  resize?: (file: File) => Promise<ResizedImages>;
}

/** Resize in the browser, then POST the WebP sizes to /api/upload (ADR-009). */
export async function uploadArtwork(
  file: File,
  resize: (file: File) => Promise<ResizedImages> = resizeImage,
): Promise<UploadedArtwork> {
  const { small, medium, large, aspect } = await resize(file);
  const form = new FormData();
  form.append("small", small, "small.webp");
  form.append("medium", medium, "medium.webp");
  if (large) form.append("large", large, "large.webp");

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (res.status === 413) {
    throw new Error("The image is too large to upload (2 MB limit per size)");
  }
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "The server rejected that image");
  }
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return { image: await res.json(), aspect };
}

export function UploadButton({ onUploaded, resize }: UploadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState<string>();

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ""; // lets the same file be picked again
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await uploadArtwork(file, resize);
      setPreview(result.image.small);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex w-fit cursor-pointer items-center rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 focus-within:ring-2 focus-within:ring-zinc-500">
        {busy ? "Uploading…" : "Upload image"}
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={onChange}
          className="sr-only"
        />
      </label>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Uploaded preview"
          className="h-16 w-16 rounded object-cover"
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
