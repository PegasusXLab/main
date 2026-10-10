import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

/**
 * Parse a single `Range: bytes=a-b` header (also `a-` and `-n` suffix ranges).
 * Returns null for no/unsupported/multi ranges (serve the full 200), "unsatisfiable"
 * when it can't be met (416), else the inclusive byte span. Media seeking and Safari
 * playback need 206 responses (T-144).
 */
function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | "unsatisfiable" | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null; // unknown unit or multi-range: ignore, serve 200
  const [, a, b] = m;
  if (a === "" && b === "") return null;
  let start: number;
  let end: number;
  if (a === "") {
    const n = Number(b);
    if (n === 0) return "unsatisfiable";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) {
    return "unsatisfiable";
  }
  return { start, end };
}

function isTraversal(segment: string): boolean {
  if (segment === ".." || segment === ".") return true;
  if (
    segment.includes("..") ||
    segment.includes("/") ||
    segment.includes("\\") ||
    segment.includes("\0")
  ) {
    return true;
  }
  try {
    const decoded = decodeURIComponent(segment);
    if (
      decoded === ".." ||
      decoded === "." ||
      decoded.includes("..") ||
      decoded.includes("/") ||
      decoded.includes("\\") ||
      decoded.includes("\0")
    ) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ key?: string[] }> },
) {
  const { key } = await context.params;
  if (!key || key.length === 0) {
    return new NextResponse("Bad Request: missing path", { status: 400 });
  }

  if (key.some(isTraversal)) {
    return new NextResponse("Bad Request: path traversal refused", {
      status: 400,
    });
  }

  const objectKey = key.join("/");
  if (objectKey.endsWith(".meta.json") || key[0] === "users") {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const storage = getStorage();
    const obj = await storage.getObject(objectKey);

    if (!obj || !obj.public) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const bytes = Buffer.from(obj.bytes);
    const baseHeaders = {
      "Content-Type": obj.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      // Browsers must use the stored (magic-byte-checked) type, never sniff HTML/JS (T-123).
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    };
    const range = parseRange(request.headers.get("range"), bytes.length);
    if (range === "unsatisfiable") {
      return new NextResponse(null, {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${bytes.length}` },
      });
    }
    if (range) {
      const chunk = bytes.subarray(range.start, range.end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${range.start}-${range.end}/${bytes.length}`,
          "Content-Length": String(chunk.length),
        },
      });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: baseHeaders,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("traversal")) {
      return new NextResponse("Bad Request: path traversal refused", {
        status: 400,
      });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
