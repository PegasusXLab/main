import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getStorage } from "@/lib/storage";
import {
  listUserGalleries,
  recordGalleryOwner,
  updateGalleryTitleInIndex,
  userGalleriesKey,
} from "./ownership";

describe("ownership", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-ownership-"));
    vi.stubEnv("PEGASUS_DATA_DIR", dataDir);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("records a gallery under the user's private index and lists it", async () => {
    const storage = getStorage();
    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-1",
        title: "First Show",
        createdAt: "2026-10-10T12:00:00Z",
        editUrl: "/edit/gal-1?key=secret-key-1",
        viewUrl: "/g/gal-1",
      },
      storage,
    );

    const list = await listUserGalleries("user-1", storage);
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({
      id: "gal-1",
      title: "First Show",
      createdAt: "2026-10-10T12:00:00Z",
      editUrl: "/edit/gal-1?key=secret-key-1",
      viewUrl: "/g/gal-1",
    });

    // The index file is under users/galleries/
    const obj = await storage.getObject(userGalleriesKey("user-1"));
    expect(obj).not.toBeNull();
    expect(obj?.public).toBe(false);
  });

  it("lists galleries sorted newest first", async () => {
    const storage = getStorage();
    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-old",
        title: "Older Show",
        createdAt: "2026-10-09T10:00:00Z",
        editUrl: "/edit/gal-old?key=k1",
      },
      storage,
    );
    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-new",
        title: "Newer Show",
        createdAt: "2026-10-10T10:00:00Z",
        editUrl: "/edit/gal-new?key=k2",
      },
      storage,
    );

    const list = await listUserGalleries("user-1", storage);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("gal-new");
    expect(list[1].id).toBe("gal-old");
  });

  it("only returns the caller's own galleries and does not leak others", async () => {
    const storage = getStorage();
    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-1",
        title: "User 1 Show",
        createdAt: "2026-10-10T10:00:00Z",
        editUrl: "/edit/gal-1?key=k1",
      },
      storage,
    );
    await recordGalleryOwner(
      {
        userId: "user-2",
        id: "gal-2",
        title: "User 2 Show",
        createdAt: "2026-10-10T11:00:00Z",
        editUrl: "/edit/gal-2?key=k2",
      },
      storage,
    );

    const user1List = await listUserGalleries("user-1", storage);
    expect(user1List).toHaveLength(1);
    expect(user1List[0].id).toBe("gal-1");

    const user2List = await listUserGalleries("user-2", storage);
    expect(user2List).toHaveLength(1);
    expect(user2List[0].id).toBe("gal-2");

    const user3List = await listUserGalleries("user-3", storage);
    expect(user3List).toEqual([]);
  });

  it("updates title in owner's index on save", async () => {
    const storage = getStorage();
    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-1",
        title: "Original Title",
        createdAt: "2026-10-10T10:00:00Z",
        editUrl: "/edit/gal-1?key=k1",
      },
      storage,
    );

    const updated = await updateGalleryTitleInIndex(
      "gal-1",
      "Edited Title",
      storage,
    );
    expect(updated).toBe(true);

    const list = await listUserGalleries("user-1", storage);
    expect(list[0].title).toBe("Edited Title");
  });

  it("returns false when updating a non-existent gallery", async () => {
    const storage = getStorage();
    const updated = await updateGalleryTitleInIndex(
      "nonexistent",
      "Title",
      storage,
    );
    expect(updated).toBe(false);
  });
});
