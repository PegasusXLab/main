import type { Gallery } from "@/lib/schema/types";

export interface PublishResult {
  id: string;
  editKey: string;
  viewUrl: string;
  editUrl: string;
}

async function fail(res: Response): Promise<never> {
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as {
      issues?: { path: string; message: string }[];
    };
    const issues = (body.issues ?? [])
      .map((i) => (i.path ? `${i.path}: ${i.message}` : i.message))
      .join("; ");
    throw new Error(`Gallery is invalid: ${issues || "validation failed"}`);
  }
  if (res.status === 403) throw new Error("Wrong or missing edit key");
  if (res.status === 413) throw new Error("Gallery is too large to save");
  throw new Error(`Request failed (${res.status})`);
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function publishGallery(gallery: Gallery): Promise<PublishResult> {
  const res = await fetch("/api/galleries", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(gallery),
  });
  if (!res.ok) return fail(res);
  return (await res.json()) as PublishResult;
}

export async function saveGallery(
  id: string,
  editKey: string,
  gallery: Gallery,
): Promise<void> {
  const res = await fetch(`/api/galleries/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { ...JSON_HEADERS, "x-edit-key": editKey },
    body: JSON.stringify(gallery),
  });
  if (!res.ok) await fail(res);
}
