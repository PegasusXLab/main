import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ShowcaseLightbox, wrapIndex } from "./ShowcaseLightbox";
import { SHOWCASE_ART } from "./showcaseArt";

const noop = () => {};

describe("wrapIndex", () => {
  it("cycles forward and wraps both ways", () => {
    expect(wrapIndex(0, 6)).toBe(0);
    expect(wrapIndex(5 + 1, 6)).toBe(0);
    expect(wrapIndex(0 - 1, 6)).toBe(5);
    expect(wrapIndex(-7, 6)).toBe(5);
  });
});

describe("ShowcaseLightbox", () => {
  it("renders nothing while closed", () => {
    expect(
      renderToString(
        <ShowcaseLightbox index={null} onIndexChange={noop} onClose={noop} />,
      ),
    ).toBe("");
  });

  it("shows the painting, its wall label, the fact and the Met link", () => {
    const art = SHOWCASE_ART[2];
    const html = renderToString(
      <ShowcaseLightbox index={2} onIndexChange={vi.fn()} onClose={vi.fn()} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(`aria-label="${art.title}, ${art.artist}"`);
    expect(html).toContain(`src="${art.large}"`);
    expect(html).toContain(`url(${art.small})`); // small image shows until the large loads
    expect(html).toContain("object-contain"); // uncropped
    expect(html).toContain(art.date);
    expect(html).toContain(art.medium.replace("&", "&amp;"));
    expect(html).toContain("Did you know?");
    expect(html).toContain(`href="${art.metUrl}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(`3<!-- --> / <!-- -->${SHOWCASE_ART.length}`);
    expect(html).toContain('aria-label="Previous artwork"');
    expect(html).toContain('aria-label="Next artwork"');
    expect(html).toContain('aria-label="Close"');
  });
});

describe("SHOWCASE_ART", () => {
  const publicDir = path.resolve(__dirname, "../../../public");

  it("hangs six works", () => {
    expect(SHOWCASE_ART).toHaveLength(6);
  });

  it.each(SHOWCASE_ART.map((a) => [a.title, a] as const))(
    "%s has alt text, a sourced fact ≤ 240 chars and real image files",
    (_title, art) => {
      expect(art.alt.length).toBeGreaterThan(10);
      expect(art.fact.length).toBeGreaterThan(20);
      expect(art.fact.length).toBeLessThanOrEqual(240);
      expect(art.factSource).toMatch(
        /^https:\/\/(archived\.|www\.)?metmuseum\.org\//,
      );
      expect(art.metUrl).toBe(
        `https://www.metmuseum.org/art/collection/search/${art.metId}`,
      );
      expect(fs.existsSync(path.join(publicDir, art.small))).toBe(true);
      expect(art.large).toMatch(/^\/landing\/large\/[a-z-]+\.webp$/);
      const large = path.join(publicDir, art.large);
      expect(fs.existsSync(large)).toBe(true);
      expect(fs.statSync(large).size).toBeLessThanOrEqual(400 * 1024);
    },
  );
});
