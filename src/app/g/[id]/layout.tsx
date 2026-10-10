import type { Metadata } from "next";
import { buildGalleryMetadata, getGalleryMeta } from "./galleryMeta";

// Shared /g/<id> links show the gallery's own title (T-136). The page itself is unchanged.
export async function generateMetadata({
  params,
}: LayoutProps<"/g/[id]">): Promise<Metadata> {
  const { id } = await params;
  return buildGalleryMetadata(id, await getGalleryMeta(id));
}

export default function GalleryLayout({ children }: LayoutProps<"/g/[id]">) {
  return children;
}
