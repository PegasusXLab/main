"use client";

// Viewer (F8, plan.md §3.5): /g/<id> loads a published gallery and tours it in 3D.
// Read-only: no editing UI, and the edit key is never needed or shown.

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Gallery } from "@/lib/schema/types";
import { validate } from "@/lib/schema/validate";
import { TourView } from "@/viewer3d/TourView";

type Load =
  | { state: "loading" }
  | { state: "missing" }
  | { state: "error" }
  | { state: "ready"; gallery: Gallery };

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-graphite text-pencil font-sans">
      {children}
    </div>
  );
}

// With Cache Components on, useParams() must run inside a Suspense boundary (Next 16.4 docs).
export default function ViewerPage() {
  return (
    <Suspense fallback={<Centered>Loading gallery…</Centered>}>
      <Viewer />
    </Suspense>
  );
}

function Viewer() {
  const { id } = useParams<{ id: string }>();
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/galleries/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setLoad({ state: "missing" });
        if (!res.ok) return setLoad({ state: "error" });
        const result = validate(await res.json());
        setLoad(
          result.ok
            ? { state: "ready", gallery: result.gallery }
            : { state: "error" },
        );
      })
      .catch(() => !cancelled && setLoad({ state: "error" }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (load.state === "loading") return <Centered>Loading gallery…</Centered>;
  if (load.state === "missing")
    return (
      <Centered>
        <div className="max-w-sm rounded-[2px] border border-hairline/20 bg-graphite/90 p-6 text-center shadow-xl">
          <p className="text-base font-semibold text-paper">
            This gallery doesn’t exist.
          </p>
          <p className="mt-1.5 text-xs text-pencil">
            Check the link you were given.
          </p>
        </div>
      </Centered>
    );
  if (load.state === "error")
    return (
      <Centered>
        <div className="max-w-sm rounded-[2px] border border-hairline/20 bg-graphite/90 p-6 text-center text-sm font-medium text-danger shadow-xl">
          This gallery couldn’t be loaded. Try again later.
        </div>
      </Centered>
    );
  return <TourView gallery={load.gallery} />;
}
