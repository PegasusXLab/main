"use client";

import { checkModelSize } from "@/lib/modelLimit";

export interface UploadedModel {
  url: string;
  filename: string;
  size: number;
}

/** Client-side checks before a .glb leaves the browser (T-132). Pure, unit-tested. */
export function validateModelFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".glb")) {
    return "Please choose a .glb file (a binary glTF export)";
  }
  return checkModelSize(file.size);
}

export interface XhrLike {
  open(method: string, url: string): void;
  send(body: FormData): void;
  upload: { onprogress: ((e: { loaded: number; total: number }) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  status: number;
  responseText: string;
}

/**
 * POST a .glb to /api/upload/model with upload progress (fetch has no upload
 * progress events, so this uses XHR like a plain form post). The server
 * re-checks the size and the glTF magic bytes.
 */
export function uploadModel(
  file: File,
  onProgress?: (fraction: number) => void,
  makeXhr: () => XhrLike = () =>
    new XMLHttpRequest() as unknown as XhrLike,
): Promise<UploadedModel> {
  const problem = validateModelFile(file);
  if (problem) return Promise.reject(new Error(problem));

  return new Promise((resolve, reject) => {
    const xhr = makeXhr();
    xhr.open("POST", "/api/upload/model");
    xhr.upload.onprogress = (e) => {
      if (e.total > 0) onProgress?.(Math.min(1, e.loaded / e.total));
    };
    xhr.onload = () => {
      let body: { url?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText) as typeof body;
      } catch {
        // fall through to the status check below
      }
      if (xhr.status === 413) {
        reject(new Error(body.error ?? "That 3D file is too large"));
        return;
      }
      if (xhr.status === 400) {
        reject(new Error(body.error ?? "The server rejected that 3D file"));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300 || !body.url) {
        reject(new Error(`Upload failed (${xhr.status})`));
        return;
      }
      resolve({ url: body.url, filename: file.name, size: file.size });
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    const form = new FormData();
    form.append("file", file, file.name);
    xhr.send(form);
  });
}
