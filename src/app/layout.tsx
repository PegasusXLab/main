import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
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
  // Note: the root `openGraph` is kept minimal — `type` and `url` only (og:title,
  // og:description and og:image are inherited). A fuller root openGraph made Next
  // try to statically resolve /edit/[id]'s metadata at build (it reads searchParams),
  // failing the production build (reviewer-3 bisected, T-134).
  openGraph: {
    type: "website",
    url: "https://galleriverse.vercel.app",
  },
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
      className={`h-full antialiased ${archivo.variable} ${geist.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
