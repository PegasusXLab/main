import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import sampleGallery from "@/fixtures/sample-3room.json";
import { POST } from "./route";
import { GET, PUT } from "./[id]/route";

describe("Galleries API Route Handlers", () => {
  const localDataDir = path.join(process.cwd(), ".data");

  beforeEach(async () => {
    await fs.mkdir(localDataDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(localDataDir, { recursive: true, force: true });
  });

  it("completes the full lifecycle: create -> read -> update with key", async () => {
    // 1. Create (POST /api/galleries)
    const postReq = new Request("http://localhost:3000/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleGallery),
    });

    const postRes = await POST(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();

    expect(postData.id).toBeDefined();
    expect(postData.id).not.toBe(sampleGallery.id);
    expect(postData.editKey).toBeDefined();
    expect(postData.viewUrl).toBe(`/g/${postData.id}`);
    expect(postData.editUrl).toBe(
      `/edit/${postData.id}?key=${postData.editKey}`,
    );

    const galleryId = postData.id;
    const editKey = postData.editKey;

    // 2. Read (GET /api/galleries/[id])
    const getRes = await GET(
      new Request(`http://localhost:3000/api/galleries/${galleryId}`),
      {
        params: Promise.resolve({ id: galleryId }),
      },
    );

    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.id).toBe(galleryId);
    expect(getData.title).toBe(sampleGallery.title);
    expect(getData.editKey).toBeUndefined();
    expect(getData.keyHash).toBeUndefined();

    // 3. Update with valid key (PUT /api/galleries/[id])
    const updatedGallery = {
      ...getData,
      title: "Updated Gallery Title",
    };

    const putReq = new Request(
      `http://localhost:3000/api/galleries/${galleryId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-edit-key": editKey,
        },
        body: JSON.stringify(updatedGallery),
      },
    );

    const putRes = await PUT(putReq, {
      params: Promise.resolve({ id: galleryId }),
    });

    expect(putRes.status).toBe(200);
    const putData = await putRes.json();
    expect(putData.id).toBe(galleryId);
    expect(putData.title).toBe("Updated Gallery Title");
    expect(Date.parse(putData.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(getData.updatedAt),
    );
  });

  it("rejects PUT with wrong or missing key with 403", async () => {
    // Create first
    const postReq = new Request("http://localhost:3000/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleGallery),
    });
    const postRes = await POST(postReq);
    const { id } = await postRes.json();

    // PUT without header
    const noKeyReq = new Request(`http://localhost:3000/api/galleries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sampleGallery),
    });
    const noKeyRes = await PUT(noKeyReq, {
      params: Promise.resolve({ id }),
    });
    expect(noKeyRes.status).toBe(403);

    // PUT with wrong key
    const wrongKeyReq = new Request(
      `http://localhost:3000/api/galleries/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-edit-key": "incorrect-key",
        },
        body: JSON.stringify(sampleGallery),
      },
    );
    const wrongKeyRes = await PUT(wrongKeyReq, {
      params: Promise.resolve({ id }),
    });
    expect(wrongKeyRes.status).toBe(403);
  });

  it("returns 404 for missing gallery on GET", async () => {
    const res = await GET(
      new Request("http://localhost:3000/api/galleries/nonexistent"),
      {
        params: Promise.resolve({ id: "nonexistent" }),
      },
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid body on POST", async () => {
    const invalidDoc = {
      ...sampleGallery,
      rooms: [], // invalid: gallery needs at least one room
    };

    const req = new Request("http://localhost:3000/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidDoc),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.issues).toBeDefined();
    expect(data.issues.length).toBeGreaterThan(0);
  });

  it("returns 400 when image data URLs are provided (ADR-009)", async () => {
    const docWithDataUrl = {
      ...sampleGallery,
      artworks: [
        {
          ...sampleGallery.artworks[0],
          image: {
            small: "data:image/webp;base64,UklGRkAAAABXRUJQVlA4...",
            medium: "data:image/webp;base64,UklGRkAAAABXRUJQVlA4...",
          },
        },
      ],
    };

    const req = new Request("http://localhost:3000/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docWithDataUrl),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.issues).toBeDefined();
    expect(data.issues[0].message).toContain("Image data URLs not allowed");
  });

  it("returns 413 when body exceeds size limit", async () => {
    const hugeBody = "x".repeat(1024 * 1024 + 10);
    const req = new Request("http://localhost:3000/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: hugeBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });
});
