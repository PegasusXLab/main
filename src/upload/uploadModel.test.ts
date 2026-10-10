import { describe, it, expect, vi } from "vitest";
import { uploadModel, validateModelFile, type XhrLike } from "./uploadModel";

function glbFile(name = "vase.glb", size = 100): File {
  const bytes = new Uint8Array(size);
  bytes[0] = 0x67;
  bytes[1] = 0x6c;
  bytes[2] = 0x54;
  bytes[3] = 0x46;
  return new File([bytes], name, { type: "model/gltf-binary" });
}

function fakeXhr(status: number, body: object): XhrLike & {
  fireLoad: () => void;
} {
  let onload: (() => void) | null = null;
  return {
    open: vi.fn(),
    send: vi.fn(),
    upload: { onprogress: null },
    get onload() {
      return onload;
    },
    set onload(fn: (() => void) | null) {
      onload = fn;
    },
    onerror: null,
    status,
    responseText: JSON.stringify(body),
    fireLoad: () => onload?.(),
  };
}

describe("validateModelFile", () => {
  it("accepts a small .glb", () => {
    expect(validateModelFile(glbFile())).toBeNull();
  });

  it("rejects non-.glb names", () => {
    expect(validateModelFile(glbFile("vase.obj"))).toContain(".glb");
  });

  it("rejects files over 4 MB", () => {
    expect(validateModelFile(glbFile("big.glb", 4 * 1024 * 1024 + 1))).toContain(
      "4 MB",
    );
  });
});

describe("uploadModel", () => {
  it("rejects before sending when the file is invalid", async () => {
    const send = vi.fn();
    await expect(
      uploadModel(glbFile("vase.obj"), undefined, () => ({
        ...fakeXhr(201, {}),
        send,
      })),
    ).rejects.toThrow(".glb");
    expect(send).not.toHaveBeenCalled();
  });

  it("resolves with the server URL and reports progress", async () => {
    const progress: number[] = [];
    const xhr = fakeXhr(201, { url: "/api/files/models/abc.glb" });
    const pending = uploadModel(glbFile(), (f) => progress.push(f), () => xhr);
    xhr.upload.onprogress?.({ loaded: 50, total: 100 });
    xhr.fireLoad();
    await expect(pending).resolves.toEqual({
      url: "/api/files/models/abc.glb",
      filename: "vase.glb",
      size: 100,
    });
    expect(progress).toEqual([0.5]);
  });

  it("surfaces server errors in plain words", async () => {
    const xhr = fakeXhr(400, { error: "Invalid 3D file" });
    const pending = uploadModel(glbFile(), undefined, () => xhr);
    xhr.fireLoad();
    await expect(pending).rejects.toThrow("Invalid 3D file");
  });
});
