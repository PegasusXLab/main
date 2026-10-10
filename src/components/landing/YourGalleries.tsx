"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  listMyGalleries,
  type UserGallery,
} from "@/components/auth/authClient";

export interface YourGalleriesProps {
  onStartBlank: () => void;
}

export function formatGalleryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

type GalleriesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; galleries: UserGallery[] };

/** "Your galleries" for a logged-in creator (T-122): only mounted when signed in. */
export function YourGalleries({ onStartBlank }: YourGalleriesProps) {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<GalleriesState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    listMyGalleries().then((result) => {
      if (!active) return;
      if ("error" in result) {
        setState({ status: "error" });
      } else {
        setState({ status: "ready", galleries: result.galleries });
      }
    });
    return () => {
      active = false;
    };
  }, [reload]);

  const hasGalleries = state.status === "ready" && state.galleries.length > 0;

  return (
    <section
      aria-labelledby="your-galleries-heading"
      className="mx-auto w-full max-w-6xl px-5 md:px-10"
    >
      <div className={hasGalleries ? "border-t border-hairline pt-5" : ""}>
        <h2 id="your-galleries-heading" className="text-lg font-medium">
          Your galleries
        </h2>

        {state.status === "loading" && (
          <p className="mt-6 text-sm text-pencil">Loading…</p>
        )}

        {state.status === "error" && (
          <div className="mt-6 border border-hairline bg-paper p-6">
            <p className="text-sm text-pencil">
              Couldn&apos;t load your galleries.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReload((value) => value + 1)}
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        )}

        {state.status === "ready" && state.galleries.length === 0 && (
          <YourGalleriesEmpty onStartBlank={onStartBlank} />
        )}

        {hasGalleries && <YourGalleriesList galleries={state.galleries} />}
      </div>
    </section>
  );
}

export function YourGalleriesList({ galleries }: { galleries: UserGallery[] }) {
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {galleries.map((gallery) => (
        <li key={gallery.id}>
          <GalleryCard gallery={gallery} />
        </li>
      ))}
    </ul>
  );
}

export function GalleryCard({ gallery }: { gallery: UserGallery }) {
  const date = formatGalleryDate(gallery.createdAt);
  return (
    <div className="border border-hairline bg-paper p-5">
      <h3 className="text-[15px] font-medium">{gallery.title}</h3>
      <p className="mt-1 text-sm text-pencil">{date || "…"}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {gallery.viewUrl && (
          <Link
            href={gallery.viewUrl}
            className="inline-flex h-8 items-center rounded-[2px] border border-hairline bg-transparent px-3 text-sm font-medium text-graphite transition-colors hover:bg-plaster focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          >
            View
          </Link>
        )}
        <Link
          href={gallery.editUrl}
          className="inline-flex h-8 items-center rounded-[2px] bg-accent px-3 text-sm font-medium text-paper transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

export function YourGalleriesEmpty({
  onStartBlank,
}: {
  onStartBlank: () => void;
}) {
  return (
    <div className="mt-6 border border-hairline bg-paper p-6">
      <p className="text-sm text-pencil">No galleries yet.</p>
      <p className="mt-1 text-sm leading-relaxed text-pencil">
        Publish a room and it will show up here for you and your visitors.
      </p>
      <Button onClick={onStartBlank} className="mt-4" size="sm">
        Create a gallery
        <Plus className="ml-1.5 size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
