"use client";

import { useState } from "react";
import type { Gallery } from "@/lib/schema/types";
import {
  publishGallery,
  saveGallery,
  type PublishResult,
} from "./publishClient";

export interface PublishPanelProps {
  gallery: Gallery;
  id?: string;
  editKey?: string;
  onPublished?: (result: PublishResult) => void;
}

function LinkRow({ label, path }: { label: string; path: string }) {
  const full = () => `${window.location.origin}${path}`;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          aria-label={label}
          value={path}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(full())}
          className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

export function PublishPanel({
  gallery,
  id: initialId,
  editKey: initialKey,
  onPublished,
}: PublishPanelProps) {
  const [id, setId] = useState(initialId);
  const [editKey, setEditKey] = useState(initialKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  async function submit() {
    setBusy(true);
    setError(undefined);
    setSaved(false);
    try {
      if (id && editKey) {
        await saveGallery(id, editKey, gallery);
        setSaved(true);
      } else {
        const result = await publishGallery(gallery);
        setId(result.id);
        setEditKey(result.editKey);
        onPublished?.(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const published = id && editKey;

  return (
    <section aria-label="Publish" className="flex flex-col gap-3 p-4">
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Working…" : published ? "Save changes" : "Publish"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-green-700">
          Saved.
        </p>
      )}
      {published && (
        <>
          <LinkRow label="View link" path={`/g/${id}`} />
          <LinkRow label="Edit link" path={`/edit/${id}?key=${editKey}`} />
          <p className="text-xs text-amber-700">
            The edit link is secret: anyone with it can change this gallery.
            Share only the view link.
          </p>
        </>
      )}
    </section>
  );
}
