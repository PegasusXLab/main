"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { UserMenu } from "@/components/auth/UserMenu";
import {
  fetchMe,
  logoutUser,
  type AuthUser,
} from "@/components/auth/authClient";
import { Hero } from "@/components/landing/Hero";
import { Showcase } from "@/components/landing/Showcase";
import { startBlankGallery } from "@/components/landing/startGallery";
import { parseEditLink } from "@/components/parseEditLink";
import { TEMPLATES, instantiateTemplate } from "@/fixtures/templates";
import { useGalleryStore } from "@/store/gallery";
import { saveAutosave } from "@/store/autosave";

function templateRoomCount(template: Record<string, unknown>): number {
  const rooms = (template as { rooms?: unknown[] }).rooms;
  return Array.isArray(rooms) ? rooms.length : 0;
}

export default function Home() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [error, setError] = useState<string>();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetchMe().then((me) => {
      if (active) setUser(me);
    });
    return () => {
      active = false;
    };
  }, []);

  function createBlank() {
    startBlankGallery();
    router.push("/edit/local");
  }

  function openTemplate(templateRaw: Record<string, unknown>) {
    const instantiated = instantiateTemplate(templateRaw);
    useGalleryStore.getState().loadGallery(instantiated);
    saveAutosave(instantiated, "local");
    router.push("/edit/local");
  }

  function openLink(event: FormEvent) {
    event.preventDefault();
    const path = parseEditLink(link);
    if (!path) {
      setError("That doesn't look like an edit link (…/edit/<id>?key=<key>).");
      return;
    }
    router.push(path);
  }

  function handleLogout() {
    void logoutUser().then(() => setUser(null));
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-plaster text-graphite">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-paper px-4 py-4 md:px-10">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-[-0.02em]"
        >
          Galleriverse
        </Link>
        <nav aria-label="Account" className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : user === undefined ? (
            <span className="hidden text-sm text-pencil sm:inline">
              Checking…
            </span>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-pencil transition-colors hover:text-graphite sm:inline"
              >
                Already have a gallery?
              </Link>
              <Link
                href="/register"
                className="inline-flex h-8 items-center rounded-[2px] bg-accent px-3 text-sm font-medium text-paper transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <Showcase />

      <Hero
        user={user}
        onAuthSuccess={createBlank}
        onStartBlank={createBlank}
      />

      <section
        aria-labelledby="templates-heading"
        className="mx-auto w-full max-w-6xl px-5 md:px-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
          <h2 id="templates-heading" className="text-lg font-medium">
            Start from a template
          </h2>
          <Button variant="outline" onClick={createBlank}>
            New blank gallery
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((template) => {
            const rooms = templateRoomCount(template.template);
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => openTemplate(template.template)}
                className="group border border-hairline bg-paper p-5 text-left transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              >
                <span className="block text-[15px] font-medium">
                  {template.name}
                </span>
                <span className="mt-1 block text-sm text-pencil">
                  {rooms} {rooms === 1 ? "room" : "rooms"} · empty walls, ready
                  to hang
                </span>
                <ArrowUpRight
                  className="mt-3 size-4 text-pencil transition-colors group-hover:text-accent"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <form
          onSubmit={openLink}
          className="mt-20 flex max-w-xl flex-col gap-3 border-t border-hairline pt-5 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Label htmlFor="edit-link">Open edit link</Label>
            <Input
              id="edit-link"
              type="text"
              inputMode="url"
              autoComplete="off"
              value={link}
              onChange={(event) => {
                setLink(event.target.value);
                setError(undefined);
              }}
              placeholder="https://galleriverse.app/edit/…"
              className="mt-2 bg-paper"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "edit-link-error" : undefined}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={!link.trim()}
            className="h-10"
          >
            Open
          </Button>
        </form>
        {error && (
          <p
            id="edit-link-error"
            role="alert"
            className="mt-2 text-sm text-danger"
          >
            {error}
          </p>
        )}
      </section>

      <footer className="mt-24 border-t border-hairline bg-paper px-4 py-5 text-sm text-pencil md:px-10">
        Galleriverse — a quiet place for work to be seen.
      </footer>
    </main>
  );
}
