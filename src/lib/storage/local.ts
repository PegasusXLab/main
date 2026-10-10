import fs from "node:fs/promises";
import path from "node:path";
import type { Storage, StorageObject, PutObjectOptions } from "./index";

interface LocalMetadata {
  contentType: string;
  public: boolean;
}

export class LocalStorage implements Storage {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.join(process.cwd(), ".data");
  }

  private resolveKey(key: string): string {
    if (!key || typeof key !== "string") {
      throw new Error("Invalid storage key: key must be a non-empty string");
    }
    if (key.includes("\0")) {
      throw new Error(
        "Invalid storage key: path traversal refused (null byte)",
      );
    }
    const segments = key.split(/[/\\]/);
    for (const segment of segments) {
      if (segment === ".." || segment === ".") {
        throw new Error("Invalid storage key: path traversal refused");
      }
      try {
        const decoded = decodeURIComponent(segment);
        if (
          decoded === ".." ||
          decoded === "." ||
          decoded.includes("..") ||
          decoded.includes("/") ||
          decoded.includes("\\")
        ) {
          throw new Error("Invalid storage key: path traversal refused");
        }
      } catch {
        throw new Error(
          "Invalid storage key: path traversal refused (malformed encoding)",
        );
      }
    }

    const cleanKey = key.replace(/^\/+/, "");
    const resolvedBase = path.resolve(this.baseDir);
    const targetPath = path.resolve(this.baseDir, cleanKey);

    if (
      targetPath !== resolvedBase &&
      !targetPath.startsWith(resolvedBase + path.sep)
    ) {
      throw new Error("Invalid storage key: path traversal refused");
    }

    return targetPath;
  }

  async putObject(
    key: string,
    bytes: Uint8Array | Buffer,
    contentType: string,
    options?: PutObjectOptions,
  ): Promise<void> {
    const targetPath = this.resolveKey(key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, bytes);

    const meta: LocalMetadata = {
      contentType: contentType || "application/octet-stream",
      public: Boolean(options?.public),
    };
    await fs.writeFile(targetPath + ".meta.json", JSON.stringify(meta), "utf8");
  }

  async getObject(key: string): Promise<StorageObject | null> {
    const targetPath = this.resolveKey(key);
    try {
      const data = await fs.readFile(targetPath);
      let meta: LocalMetadata = {
        contentType: "application/octet-stream",
        public: false,
      };

      try {
        const metaRaw = await fs.readFile(targetPath + ".meta.json", "utf8");
        meta = JSON.parse(metaRaw);
      } catch {
        // If meta file is missing, fallback to default non-public metadata
      }

      return {
        bytes: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
        contentType: meta.contentType || "application/octet-stream",
        public: Boolean(meta.public),
      };
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "ENOENT"
      ) {
        return null;
      }
      throw err;
    }
  }

  publicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    return `/api/files/${cleanKey}`;
  }
}
