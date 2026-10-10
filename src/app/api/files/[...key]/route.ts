import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

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
  _request: Request,
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

    return new NextResponse(Buffer.from(obj.bytes), {
      status: 200,
      headers: {
        "Content-Type": obj.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
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
