import { readFile } from "node:fs/promises";
import { join } from "node:path";
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

type FontWeight = 400 | 700;

// Archivo Regular + Bold, latin subset (T-139). SIL Open Font License 1.1, see ./fonts/OFL.txt.
// Read once per server instance. If a file can't be read, that weight is skipped and the
// card falls back to the default font instead of failing.
function loadFont(file: string): Promise<ArrayBuffer | null> {
  return readFile(join(process.cwd(), "src/app/g/[id]/fonts", file))
    .then(
      (buf) =>
        buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength,
        ) as ArrayBuffer,
    )
    .catch(() => null);
}

const archivo: Promise<{ weight: FontWeight; data: ArrayBuffer | null }[]> =
  Promise.all([
    loadFont("Archivo-Regular-latin.woff").then((data) => ({
      weight: 400 as const,
      data,
    })),
    loadFont("Archivo-Bold-latin.woff").then((data) => ({
      weight: 700 as const,
      data,
    })),
  ]);

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [meta, loaded] = await Promise.all([getGalleryMeta(id), archivo]);
  const fonts = loaded.flatMap(({ weight, data }) =>
    data ? [{ name: "Archivo", data, weight, style: "normal" as const }] : [],
  );
  // Only switch to Archivo when both weights loaded, so a missing file can't make the
  // subtitle bold or the title regular.
  const family = fonts.length === 2 ? "Archivo" : undefined;
  const title = meta?.title ?? "Galleriverse";
  const subtitle = meta
    ? `${meta.rooms} ${meta.rooms === 1 ? "room" : "rooms"} · walk through it in your browser`
    : "Draw a room. Hang your work. Open the doors.";

  return new ImageResponse(
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
        fontFamily: family,
      }}
    >
      <div
        style={{ display: "flex", width: 96, height: 12, background: KLEIN }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 64 : 84,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 32,
            fontWeight: 400,
            color: PENCIL,
          }}
        >
          {subtitle}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        Galleriverse
      </div>
    </div>,
    { ...size, fonts: family ? fonts : undefined },
  );
}
