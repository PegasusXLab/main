// Custom title fonts (room typography). Fonts are small; 1.5 MB covers a full family file while
// keeping a visitor's first paint quick. Type comes from the file's signature, never its name.

export const MAX_FONT_BYTES = 1.5 * 1024 * 1024;

export const FONT_TOO_LARGE = "Fonts can be up to 1.5 MB. Try a .woff2 or a single weight.";

export const FONT_HINT = ".woff2, .woff, .otf or .ttf up to 1.5 MB";

/** The error to show for a file of `size` bytes, or null when it may be uploaded. */
export function checkFontSize(size: number): string | null {
  return size > MAX_FONT_BYTES ? FONT_TOO_LARGE : null;
}

/** Font type from the first 4 bytes (WOFF2, WOFF, OpenType CFF, TrueType), or null. */
export function detectFontType(bytes: Uint8Array): { contentType: string; ext: string } | null {
  if (bytes.length < 12) return null;
  const tag = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (tag === "wOF2") return { contentType: "font/woff2", ext: "woff2" };
  if (tag === "wOFF") return { contentType: "font/woff", ext: "woff" };
  if (tag === "OTTO") return { contentType: "font/otf", ext: "otf" };
  if (tag === "true" || (bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0))
    return { contentType: "font/ttf", ext: "ttf" };
  return null;
}

/**
 * Only fonts we stored ourselves are ever loaded on a gallery page: same-origin, under
 * /api/files/fonts/, with a plain file name. Anything else (third-party URLs, quotes, parens)
 * is refused, so a published gallery can't inject CSS or track visitors through a font URL.
 */
export const SAFE_FONT_URL = /^\/api\/files\/fonts\/[A-Za-z0-9_-]{1,64}\.(woff2|woff|otf|ttf)$/;

export function isSafeFontUrl(url: string | undefined): url is string {
  return typeof url === "string" && SAFE_FONT_URL.test(url);
}
