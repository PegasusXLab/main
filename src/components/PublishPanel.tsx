"use client";

import { useState } from "react";
import type { Gallery } from "@/lib/schema/types";
import {
  publishGallery,
  saveGallery,
  type PublishResult,
} from "./publishClient";
import { Button, Input, Label } from "@/components/ui";

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
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          readOnly
          aria-label={label}
          value={path}
          tabular
          className="min-w-0 flex-1 bg-plaster text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigator.clipboard.writeText(full())}
        >
          Copy
        </Button>
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
      <Button
        type="button"
        variant="primary"
        onClick={submit}
        disabled={busy}
        className="w-full"
      >
        {busy ? "Working…" : published ? "Save changes" : "Publish"}
      </Button>
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-xs font-medium text-graphite">
          Saved.
        </p>
      )}
      {published && (
        <>
          <LinkRow label="View link" path={`/g/${id}`} />
          <LinkRow label="Edit link" path={`/edit/${id}?key=${editKey}`} />
          <p className="text-xs text-pencil">
            The edit link is secret: anyone with it can change this gallery.
            Share only the view link.
          </p>
        </>
      )}
    </section>
  );
}
