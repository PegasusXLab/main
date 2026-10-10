export interface ResizedImages {
  small: Blob;
  medium: Blob;
  large?: Blob;
  aspect: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeImageOptions {
  loadImageFn?: (
    file: Blob,
  ) => Promise<{ source: unknown; width: number; height: number }>;
  renderWebPFn?: (
    source: unknown,
    width: number,
    height: number,
  ) => Promise<Blob>;
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Calculates dimensions scaled so the longest side is at most `max`.
 * Never upscales. Aspect ratio is preserved.
 */
export function fitWithin(w: number, h: number, max: number): ImageDimensions {
  if (w <= 0 || h <= 0 || max <= 0) {
    throw new Error("Dimensions and max must be positive numbers");
  }
  const longest = Math.max(w, h);
  if (longest <= max) {
    return { width: Math.round(w), height: Math.round(h) };
  }
  const scale = max / longest;
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}

export async function defaultLoadImage(
  file: Blob,
): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      throw new Error("Failed to decode image");
    }
  }

  if (typeof Image !== "undefined") {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          source: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  }

  throw new Error("Image loading is not supported in this environment");
}

export async function defaultRenderWebP(
  source: unknown,
  width: number,
  height: number,
  quality = 0.85,
): Promise<Blob> {
  if (typeof document === "undefined" || !document.createElement) {
    throw new Error("Canvas rendering is not supported in this environment");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to encode canvas to WebP"));
        }
      },
      "image/webp",
      quality,
    );
  });
}

/**
 * Resizes an image file into small (<=512px), medium (<=1024px), and optional large (<=2048px)
 * WebP blobs. Never upscales. Large is omitted when original longest side < 2048px.
 * Aspect is height / width of the original.
 */
export async function resizeImage(
  file: Blob | File,
  options?: ResizeImageOptions,
): Promise<ResizedImages> {
  if (!file || typeof file.size !== "number") {
    throw new Error("Invalid file provided");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 20 MB limit");
  }

  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("File is not an image");
  }

  const loadFn = options?.loadImageFn ?? defaultLoadImage;
  const renderFn = options?.renderWebPFn ?? defaultRenderWebP;

  const { source, width, height } = await loadFn(file);

  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions");
  }

  const aspect = height / width;
  const smallDims = fitWithin(width, height, 512);
  const mediumDims = fitWithin(width, height, 1024);

  const [smallBlob, mediumBlob] = await Promise.all([
    renderFn(source, smallDims.width, smallDims.height),
    renderFn(source, mediumDims.width, mediumDims.height),
  ]);

  const result: ResizedImages = {
    small: smallBlob,
    medium: mediumBlob,
    aspect,
  };

  const longest = Math.max(width, height);
  if (longest >= 2048) {
    const largeDims = fitWithin(width, height, 2048);
    result.large = await renderFn(source, largeDims.width, largeDims.height);
  }

  return result;
}
