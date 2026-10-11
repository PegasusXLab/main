import { describe, expect, it, vi } from "vitest";
import { MAX_FONT_BYTES } from "@/lib/fontLimit";
import { uploadFont, validateFontFile } from "./uploadFont";

describe("validateFontFile", () => {
  it("accepts the four font types within the size cap", () => {
    for (const ext of ["woff2", "woff", "otf", "TTF"])
      expect(validateFontFile({ name: `a.${ext}`, size: 1000 })).toBeNull();
  });
  it("rejects other files and oversize fonts", () => {
    expect(validateFontFile({ name: "a.svg", size: 10 })).toMatch(/woff2/);
    expect(validateFontFile({ name: "a.woff2", size: MAX_FONT_BYTES + 1 })).toMatch(/1.5 MB/);
  });
});

describe("uploadFont", () => {
  it("returns the stored URL", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ url: "/api/files/fonts/x.woff2" }), { status: 201 }),
    );
    const file = new File([new Uint8Array(20)], "f.woff2");
    await expect(uploadFont(file, fetchImpl as unknown as typeof fetch)).resolves.toEqual({
      url: "/api/files/fonts/x.woff2",
    });
    expect(fetchImpl).toHaveBeenCalledWith("/api/upload/font", expect.objectContaining({ method: "POST" }));
  });
  it("surfaces the server's error", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Invalid font" }), { status: 400 }),
    );
    await expect(
      uploadFont(new File([new Uint8Array(20)], "f.woff2"), fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow("Invalid font");
  });
});
