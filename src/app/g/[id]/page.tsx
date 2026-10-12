import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { buildGalleryMetadata, getGalleryMeta } from "./galleryMeta";
import { ViewerClient } from "./ViewerClient";

// Shared /g/<id> links show the gallery's own title (T-136).
export async function generateMetadata({ params }: PageProps<"/g/[id]">): Promise<Metadata> {
  const { id } = await params;
  return buildGalleryMetadata(id, await getGalleryMeta(id));
}

// The metadata reads `params` (URL data) while the viewer shell is otherwise prerenderable.
// Next 16 (Cache Components) wants that made explicit on the page: this marker defers to request
// time inside Suspense, so the metadata streams in and the shell still prerenders.
async function Connection() {
  await connection();
  return null;
}

export default function ViewerPage() {
  return (
    <>
      <ViewerClient />
      <Suspense>
        <Connection />
      </Suspense>
    </>
  );
}
