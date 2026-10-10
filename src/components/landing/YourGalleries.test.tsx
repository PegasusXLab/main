import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import {
  formatGalleryDate,
  GalleryCard,
  YourGalleries,
  YourGalleriesEmpty,
  YourGalleriesList,
} from "./YourGalleries";
import type { UserGallery } from "@/components/auth/authClient";

const GALLERIES: UserGallery[] = [
  {
    id: "g1",
    title: "First Show",
    createdAt: "2026-10-10T12:00:00.000Z",
    editUrl: "/edit/g1?key=k-1",
    viewUrl: "/g/g1",
  },
  {
    id: "g2",
    title: "Second Show",
    createdAt: "2026-10-01T12:00:00.000Z",
    editUrl: "/edit/g2?key=k-2",
  },
];

describe("formatGalleryDate", () => {
  it("formats an ISO timestamp with Intl", () => {
    expect(formatGalleryDate("2026-10-10T12:00:00.000Z")).toMatch(/2026/);
    expect(formatGalleryDate("2026-10-10T12:00:00.000Z")).toContain("Oct");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatGalleryDate("not-a-date")).toBe("");
  });
});

describe("GalleryCard", () => {
  it("renders title, date and View/Edit links", () => {
    const html = renderToString(<GalleryCard gallery={GALLERIES[0]} />);
    expect(html).toContain("First Show");
    expect(html).toContain("2026");
    expect(html).toContain('href="/g/g1"');
    expect(html).toContain("View");
    expect(html).toContain('href="/edit/g1?key=k-1"');
    expect(html).toContain("Edit");
  });

  it("omits the View link when there is no viewUrl", () => {
    const html = renderToString(<GalleryCard gallery={GALLERIES[1]} />);
    expect(html).not.toContain("View");
    expect(html).toContain('href="/edit/g2?key=k-2"');
  });
});

describe("YourGalleriesList", () => {
  it("renders one card per gallery", () => {
    const html = renderToString(<YourGalleriesList galleries={GALLERIES} />);
    expect(html).toContain("First Show");
    expect(html).toContain("Second Show");
  });

  it("renders an empty list container for no galleries", () => {
    const html = renderToString(<YourGalleriesList galleries={[]} />);
    expect(html).toContain("<ul");
    expect(html).not.toContain("<li");
  });
});

describe("YourGalleriesEmpty", () => {
  it("explains the empty state and offers Create a gallery", () => {
    const html = renderToString(<YourGalleriesEmpty onStartBlank={() => {}} />);
    expect(html).toContain("No galleries yet.");
    expect(html).toContain("Create a gallery");
  });
});

describe("YourGalleries", () => {
  it("always shows the section heading, and Lifecycle loads the list", () => {
    const html = renderToString(<YourGalleries onStartBlank={() => {}} />);
    expect(html).toContain("Your galleries");
    expect(html).toContain("Loading…");
  });
});
