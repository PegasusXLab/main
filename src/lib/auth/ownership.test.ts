import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getStorage } from "@/lib/storage";
import {
  decryptEditKey,
  encryptEditKey,
  getGalleryOwner,
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
        editUrl: "/edit/gal-1?key=secret-key-1",
        viewUrl: "/g/gal-1",
      },
      storage,
      () => new Date("2026-10-10T12:00:00Z"),
    );

    const list = await listUserGalleries("user-1", storage);
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({
      id: "gal-1",
      title: "First Show",
      createdAt: "2026-10-10T12:00:00.000Z",
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
        editUrl: "/edit/gal-old?key=k1",
      },
      storage,
      () => new Date("2026-10-09T10:00:00Z"),
    );
    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-new",
        title: "Newer Show",
        editUrl: "/edit/gal-new?key=k2",
      },
      storage,
      () => new Date("2026-10-10T10:00:00Z"),
    );

    const list = await listUserGalleries("user-1", storage);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe("gal-new");
    expect(list[1].id).toBe("gal-old");
  });

  it("stores the real publish time, not the gallery's own date; re-publishing keeps it (T-126)", async () => {
    const storage = getStorage();
    const publishedAt = new Date("2026-10-11T01:00:00Z"); // Sat Oct 10, 21:00 EDT
    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-1",
        title: "Tonight",
        createdAt: "2026-10-10T00:00:00.000Z", // the document's midnight date: ignored
        editUrl: "/edit/gal-1?key=k",
      },
      storage,
      () => publishedAt,
    );
    let [entry] = await listUserGalleries("user-1", storage);
    expect(entry.createdAt).toBe(publishedAt.toISOString());
    // Shown in the creator's time zone it's still Oct 10.
    expect(
      new Date(entry.createdAt).toLocaleDateString("en-US", {
        timeZone: "America/New_York",
      }),
    ).toBe("10/10/2026");

    await recordGalleryOwner(
      {
        userId: "user-1",
        id: "gal-1",
        title: "Tonight (edited)",
        editUrl: "/edit/gal-1?key=k",
      },
      storage,
      () => new Date("2026-10-12T09:00:00Z"),
    );
    [entry] = await listUserGalleries("user-1", storage);
    expect(entry.title).toBe("Tonight (edited)");
    expect(entry.createdAt).toBe(publishedAt.toISOString());
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
  describe("no edit keys at rest (T-130)", () => {
    const SECRET = "test-secret-0123456789abcdef0123456789";

    it("stores only ciphertext, but still returns the owner's editUrl", async () => {
      const storage = getStorage();
      await recordGalleryOwner(
        { userId: "user-1", id: "gal-1", title: "Show", editUrl: "/edit/gal-1?key=plain-key-123" },
        storage,
        () => new Date("2026-10-10T12:00:00Z"),
        SECRET,
      );
      const raw = Buffer.from((await storage.getObject(userGalleriesKey("user-1")))!.bytes).toString("utf8");
      expect(raw).not.toContain("plain-key-123");
      expect(raw).not.toContain("editUrl");

      const [entry] = await listUserGalleries("user-1", storage, SECRET);
      expect(entry.editUrl).toBe("/edit/gal-1?key=plain-key-123");
      expect(await getGalleryOwner("gal-1", storage)).toBe("user-1");
    });

    it("migrates a pre-T-130 entry with a plain editUrl on first read", async () => {
      const storage = getStorage();
      const legacy = [{ id: "gal-old", title: "Old", createdAt: "2026-10-10T10:00:00Z", editUrl: "/edit/gal-old?key=legacy-key", viewUrl: "/g/gal-old" }];
      await storage.putObject(userGalleriesKey("user-1"), Buffer.from(JSON.stringify(legacy)), "application/json", { public: false });

      const [entry] = await listUserGalleries("user-1", storage, SECRET);
      expect(entry.editUrl).toBe("/edit/gal-old?key=legacy-key");

      const raw = Buffer.from((await storage.getObject(userGalleriesKey("user-1")))!.bytes).toString("utf8");
      expect(raw).not.toContain("legacy-key");
      expect(raw).toContain("editKeyEnc");
    });

    it("falls back to a keyless editUrl without a secret, and rejects tampered ciphertext", async () => {
      const storage = getStorage();
      await recordGalleryOwner(
        { userId: "user-1", id: "gal-1", title: "Show", editUrl: "/edit/gal-1?key=k" },
        storage,
        undefined,
        SECRET,
      );
      const [entry] = await listUserGalleries("user-1", storage, null);
      expect(entry.editUrl).toBe("/edit/gal-1");

      const token = encryptEditKey("abc", SECRET);
      expect(decryptEditKey(token, SECRET)).toBe("abc");
      expect(decryptEditKey(token, "other-secret")).toBeNull();
      expect(decryptEditKey(token.slice(0, -2) + "xx", SECRET)).toBeNull();
    });
  });
});
