import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pegasus",
  description: "Build a 3D gallery from a simple 2D floor plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
