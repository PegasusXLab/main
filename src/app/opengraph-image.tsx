import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { THEME } from "@/lib/theme";

// T-134: branded 1200x630 Open Graph / Twitter card for Galleriverse,
// built with next/og (no new dependencies). Archivo SemiBold is committed next
// to this file for deterministic rendering (the app fonts are loaded via next/font).

export const alt = "Galleriverse: draw a room, hang your work, open the doors";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Frame {
  w: number;
  h: number;
  bg: string;
  border: string;
}

const FRAMES: Frame[] = [
  { w: 88, h: 120, bg: THEME.colors.paper, border: THEME.colors.graphite },
  { w: 116, h: 76, bg: THEME.colors.kraft, border: THEME.colors.graphite },
  { w: 100, h: 100, bg: THEME.colors.graphite, border: THEME.colors.graphite },
  { w: 76, h: 112, bg: THEME.colors.accent, border: THEME.colors.graphite },
];

export default async function OgImage() {
  // Archivo SemiBold ships with the app; the route runs in the Node runtime, so
  // read it from disk (fetch of a file:// URL is not implemented in dev).
  const archivo = await readFile(
    path.join(process.cwd(), "src", "app", "Archivo-SemiBold.ttf"),
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: THEME.colors.plaster,
        color: THEME.colors.graphite,
        fontFamily: "Archivo, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            backgroundColor: THEME.colors.accent,
            borderRadius: THEME.radius.sm,
          }}
        />
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Galleriverse
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 76,
            lineHeight: 0.95,
            fontWeight: 600,
            letterSpacing: "-0.04em",
          }}
        >
          Draw a room. Hang your work.
        </div>
        <div
          style={{
            fontSize: 76,
            lineHeight: 0.95,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            color: THEME.colors.accent,
          }}
        >
          Open the doors.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
          {FRAMES.map((frame, index) => (
            <div
              key={index}
              style={{
                width: frame.w,
                height: frame.h,
                backgroundColor: frame.bg,
                border: `2px solid ${frame.border}`,
                borderRadius: THEME.radius.sm,
              }}
            />
          ))}
        </div>
        <div
          style={{
            width: "100%",
            height: 2,
            backgroundColor: THEME.colors.graphite,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
          }}
        >
          <span style={{ fontSize: 20, color: THEME.colors.pencil }}>
            145 cm
          </span>
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.18em",
              color: THEME.colors.pencil,
            }}
          >
            A QUIET PLACE FOR WORK TO BE SEEN
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Archivo",
          data: archivo,
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
}
