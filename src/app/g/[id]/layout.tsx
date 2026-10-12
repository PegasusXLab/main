import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { buildGalleryMetadata, getGalleryMeta } from "./galleryMeta";

// Shared /g/<id> links show the gallery's own title (T-136). The page itself is unchanged.
export async function generateMetadata({
  params,
}: LayoutProps<"/g/[id]">): Promise<Metadata> {
  const { id } = await params;
  return buildGalleryMetadata(id, await getGalleryMeta(id));
}

// The metadata reads `params` (runtime data) while the viewer shell is otherwise prerenderable.
// Next 16 (Cache Components) wants that choice made explicit: this marker defers to request time
// so the metadata streams in, and the shell still prerenders.
async function Connection() {
  await connection();
  return null;
}

export default function GalleryLayout({ children }: LayoutProps<"/g/[id]">) {
  return (
    <>
      {children}
      <Suspense>
        <Connection />
      </Suspense>
    </>
  );
}
