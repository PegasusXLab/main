"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { newGallery } from "@/lib/schema/defaults";
import { useGalleryStore } from "@/store/gallery";
import { parseEditLink } from "@/components/parseEditLink";

export default function Home() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [error, setError] = useState<string>();

  function createBlank() {
    useGalleryStore.getState().loadGallery(newGallery());
    router.push("/edit/local");
  }

  function openLink(e: FormEvent) {
    e.preventDefault();
    const path = parseEditLink(link);
    if (!path) {
      setError("That doesn't look like an edit link (…/edit/<id>?key=<key>).");
      return;
    }
    router.push(path);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Pegasus</h1>

      <button
        type="button"
        onClick={createBlank}
        className="rounded bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700"
      >
        New blank gallery
      </button>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">Templates</span>
        <div className="flex gap-2">
          {["Hall", "Loft"].map((name) => (
            <button
              key={name}
              type="button"
              disabled
              className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-400"
            >
              {name} (coming soon)
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={openLink} className="flex flex-col gap-2">
        <label
          htmlFor="edit-link"
          className="text-sm font-medium text-zinc-600"
        >
          Open edit link
        </label>
        <div className="flex gap-2">
          <input
            id="edit-link"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setError(undefined);
            }}
            placeholder="https://…/edit/abc?key=…"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "edit-link-error" : undefined}
            className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            Open
          </button>
        </div>
        {error && (
          <p id="edit-link-error" role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
