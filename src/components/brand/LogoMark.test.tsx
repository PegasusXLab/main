import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { LogoMark } from "./LogoMark";

describe("LogoMark (T-159)", () => {
  it("is decorative: hidden from screen readers, the wordmark carries the name", () => {
    const html = renderToString(<LogoMark />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('viewBox="0 0 32 32"');
    expect(html).toContain("size-6");
  });

  it("draws the same shapes as the tab icon (src/app/icon.svg)", () => {
    const icon = fs.readFileSync(
      path.join(process.cwd(), "src/app/icon.svg"),
      "utf8",
    );
    const html = renderToString(<LogoMark />);
    for (const points of icon.match(/points="[^"]+"/g) ?? []) {
      expect(html).toContain(points);
    }
    for (const fill of ["#EFF0EE", "#FFFFFF", "#DCDEDB", "#C4C7C3", "#002FA7"]) {
      expect(icon).toContain(fill);
      expect(html).toContain(fill);
    }
  });
});
