import { describe, it, expect, vi } from "vitest";
import { fitWithin, resizeImage, MAX_FILE_SIZE } from "./resizeImage";

describe("fitWithin (pure size math)", () => {
  it("never upscales when dimensions are already smaller than max", () => {
    expect(fitWithin(300, 200, 512)).toEqual({ width: 300, height: 200 });
    expect(fitWithin(300, 200, 1024)).toEqual({ width: 300, height: 200 });
    expect(fitWithin(300, 200, 2048)).toEqual({ width: 300, height: 200 });
  });

  it("scales down landscape image so longest side equals max", () => {
    const res = fitWithin(2000, 1000, 512);
    expect(res.width).toBe(512);
    expect(res.height).toBe(256);
  });

  it("scales down portrait image so longest side equals max", () => {
    const res = fitWithin(1000, 2000, 512);
    expect(res.width).toBe(256);
    expect(res.height).toBe(512);
  });

  it("scales down square image so longest side equals max", () => {
    const res = fitWithin(3000, 3000, 2048);
    expect(res.width).toBe(2048);
    expect(res.height).toBe(2048);
  });

  it("preserves exact dimension when longest side equals max", () => {
    expect(fitWithin(512, 256, 512)).toEqual({ width: 512, height: 256 });
    expect(fitWithin(256, 512, 512)).toEqual({ width: 256, height: 512 });
  });

  it("throws on non-positive input dimensions or max", () => {
    expect(() => fitWithin(0, 100, 512)).toThrow("positive");
    expect(() => fitWithin(100, -10, 512)).toThrow("positive");
    expect(() => fitWithin(100, 100, 0)).toThrow("positive");
  });
});

describe("resizeImage validation", () => {
  it("rejects files over 20 MB", async () => {
    const bigFile = new Blob([new Uint8Array(10)], { type: "image/png" });
    Object.defineProperty(bigFile, "size", { value: MAX_FILE_SIZE + 1 });

    await expect(resizeImage(bigFile)).rejects.toThrow(
      "File exceeds 20 MB limit",
    );
  });

  it("rejects non-image mime types", async () => {
    const textFile = new Blob(["hello world"], { type: "text/plain" });
    await expect(resizeImage(textFile)).rejects.toThrow("File is not an image");

    const pdfFile = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    await expect(resizeImage(pdfFile)).rejects.toThrow("File is not an image");
  });

  it("rejects invalid file inputs", async () => {
    // @ts-expect-error testing invalid input
    await expect(resizeImage(null)).rejects.toThrow("Invalid file");
  });
});

describe("resizeImage processing", () => {
  function createFakeFns(width: number, height: number) {
    const renderedSizes: { width: number; height: number }[] = [];
    const loadImageFn = vi.fn().mockResolvedValue({
      source: { name: "fake-image" },
      width,
      height,
    });
    const renderWebPFn = vi.fn().mockImplementation(async (_src, w, h) => {
      renderedSizes.push({ width: w, height: h });
      return new Blob([`fake-webp-${w}x${h}`], { type: "image/webp" });
    });
    return { loadImageFn, renderWebPFn, renderedSizes };
  }

  it("resizes high-resolution image (>= 2048px) and includes large", async () => {
    const file = new Blob([new Uint8Array(100)], { type: "image/jpeg" });
    // 4000x2000 landscape image
    const { loadImageFn, renderWebPFn, renderedSizes } = createFakeFns(
      4000,
      2000,
    );

    const result = await resizeImage(file, { loadImageFn, renderWebPFn });

    expect(loadImageFn).toHaveBeenCalledWith(file);
    // Aspect = height / width
    expect(result.aspect).toBe(2000 / 4000); // 0.5
    expect(result.aspect).toBe(0.5);

    // Small: longest 512 => 512 x 256
    expect(renderedSizes[0]).toEqual({ width: 512, height: 256 });
    expect(result.small.type).toBe("image/webp");

    // Medium: longest 1024 => 1024 x 512
    expect(renderedSizes[1]).toEqual({ width: 1024, height: 512 });
    expect(result.medium.type).toBe("image/webp");

    // Large: longest 2048 => 2048 x 1024
    expect(result.large).toBeDefined();
    expect(result.large?.type).toBe("image/webp");
    expect(renderedSizes[2]).toEqual({ width: 2048, height: 1024 });
  });

  it("omits large when image longest side is smaller than 2048px", async () => {
    const file = new Blob([new Uint8Array(100)], { type: "image/png" });
    // 1600x1200 image (< 2048px)
    const { loadImageFn, renderWebPFn, renderedSizes } = createFakeFns(
      1600,
      1200,
    );

    const result = await resizeImage(file, { loadImageFn, renderWebPFn });

    expect(result.aspect).toBeCloseTo(1200 / 1600); // 0.75
    expect(result.large).toBeUndefined();
    expect("large" in result).toBe(false);

    // Small: 512 x 384
    expect(renderedSizes[0]).toEqual({ width: 512, height: 384 });
    // Medium: 1024 x 768
    expect(renderedSizes[1]).toEqual({ width: 1024, height: 768 });
  });

  it("never upscales small images", async () => {
    const file = new Blob([new Uint8Array(100)], { type: "image/png" });
    // 300x200 image (smaller than 512)
    const { loadImageFn, renderWebPFn, renderedSizes } = createFakeFns(
      300,
      200,
    );

    const result = await resizeImage(file, { loadImageFn, renderWebPFn });

    expect(result.aspect).toBe(200 / 300);
    expect(result.large).toBeUndefined();

    // Both small and medium maintain 300x200 without upscaling
    expect(renderedSizes[0]).toEqual({ width: 300, height: 200 });
    expect(renderedSizes[1]).toEqual({ width: 300, height: 200 });
  });
});
