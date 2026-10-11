import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import { titleFontVariables } from "./titleFonts";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1e2022",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://galleriverse.vercel.app"),
  title: "Galleriverse: draw a room, hang your work, open the doors",
  description:
    "Galleriverse turns a simple floor plan into a 3D gallery anyone can walk through from a link.",
  // Note: no root `openGraph` here — with cacheComponents, a root openGraph made
  // Next try to statically resolve /edit/[id]'s metadata at build (it reads
  // searchParams), failing the production build (reviewer-3 bisected, T-134).
  // Next still emits og:type=website and the opengraph-image by default.
  twitter: {
    card: "summary_large_image",
    title: "Galleriverse: draw a room, hang your work, open the doors",
    description:
      "Galleriverse turns a simple floor plan into a 3D gallery anyone can walk through from a link.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${archivo.variable} ${geist.variable} ${titleFontVariables}`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
