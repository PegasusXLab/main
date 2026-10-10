import { ImageResponse } from "next/og";
import { getGalleryMeta } from "./galleryMeta";

// Link-preview card for a shared gallery (T-136): design-system colours, public data only.
export const alt = "A Galleriverse 3D gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLASTER = "#eff0ee";
const GRAPHITE = "#1e2022";
const PENCIL = "#7d8085";
const KLEIN = "#002fa7";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meta = await getGalleryMeta(id);
  const title = meta?.title ?? "Galleriverse";
  const subtitle = meta
    ? `${meta.rooms} ${meta.rooms === 1 ? "room" : "rooms"} · walk through it in your browser`
    : "Draw a room. Hang your work. Open the doors.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PLASTER,
          color: GRAPHITE,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", width: 96, height: 12, background: KLEIN }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? 64 : 84,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: PENCIL }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 36, fontWeight: 700 }}>
          Galleriverse
        </div>
      </div>
    ),
    size,
  );
}
