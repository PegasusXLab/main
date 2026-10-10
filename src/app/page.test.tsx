import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { parseEditLink } from "@/components/parseEditLink";
import { TEMPLATES, instantiateTemplate } from "@/fixtures/templates";
import { validate } from "@/lib/schema/validate";
import { saveAutosave } from "@/store/autosave";
import { useGalleryStore } from "@/store/gallery";
import Home from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("start screen", () => {
  it("shows the blank-gallery button, enabled templates and the link input", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Galleriverse");
    expect(html).toContain("New blank gallery");
    expect(html).toContain("Hall");
    expect(html).toContain("Journey");
    expect(html).not.toContain("coming soon");
    expect(html).toContain("Open edit link");
  });

  it("accepts relative and full edit links in the Open edit link input", () => {
    const html = renderToString(<Home />);
    // type=text + inputMode=url so `/edit/<id>?key=<key>` reaches parseEditLink
    expect(html).toContain('id="edit-link"');
    expect(html).toContain('type="text"');
    expect(html).toContain('inputMode="url"');
  });

  it("hides the Your galleries section for logged-out visitors", () => {
    const html = renderToString(<Home />);
    expect(html).not.toContain("Your galleries");
  });

  it("overwrites pegasus:gallery:local when creating blank or opening template", () => {
    const data = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    const prevWindow = (globalThis as unknown as { window?: unknown }).window;
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: fakeStorage,
    };

    try {
      // Stale autosave initially present
      fakeStorage.setItem(
        "pegasus:gallery:local",
        JSON.stringify({ id: "old-stale" }),
      );

      const instantiated = instantiateTemplate(TEMPLATES[0].template);
      saveAutosave(instantiated, "local");

      expect(fakeStorage.getItem("pegasus:gallery:local")).not.toContain(
        "old-stale",
      );
      expect(fakeStorage.getItem("pegasus:gallery:local")).toContain(
        instantiated.id,
      );
    } finally {
      (globalThis as unknown as { window: unknown }).window = prevWindow;
    }
  });
});

describe("templates validation and instantiation", () => {
  for (const tmpl of TEMPLATES) {
    it(`validates template '${tmpl.id}'`, () => {
      const res = validate(tmpl.template);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.gallery.artworks).toHaveLength(0);
      }
    });

    it(`instantiates template '${tmpl.id}' with fresh IDs and valid schema`, () => {
      const g1 = instantiateTemplate(tmpl.template);
      const g2 = instantiateTemplate(tmpl.template);

      expect(g1.id).not.toBe(g2.id);
      expect(g1.rooms[0].id).not.toBe(g2.rooms[0].id);
      expect(g1.entranceRoomId).toBe(g1.rooms[0].id);
      expect(g1.artworks).toEqual([]);

      const v1 = validate(g1);
      expect(v1.ok).toBe(true);

      // Can be loaded into store without error
      useGalleryStore.getState().loadGallery(g1);
      expect(useGalleryStore.getState().gallery.id).toBe(g1.id);
    });
  }
});

describe("parseEditLink", () => {
  it.each([
    ["https://galliverse.vercel.app/edit/abc_1?key=k-9", "/edit/abc_1?key=k-9"],
    ["http://localhost:3000/edit/abc?key=k", "/edit/abc?key=k"],
    ["  /edit/abc?key=k  ", "/edit/abc?key=k"],
    ["/edit/abc?x=1&key=k", "/edit/abc?key=k"],
  ])("accepts %s", (input, path) => expect(parseEditLink(input)).toBe(path));

  it.each([
    "",
    "hello",
    "/edit/abc",
    "/edit/abc?key=",
    "/g/abc?key=k",
    "https://evil.com/?next=/edit/abc?key=k",
  ])("rejects %j", (input) => expect(parseEditLink(input)).toBeNull());
});
