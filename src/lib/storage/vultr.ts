import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type { Storage, StorageObject, PutObjectOptions } from "./index";

export interface VultrStorageConfig {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

export class VultrStorage implements Storage {
  private endpoint: string;
  private bucket: string;
  private client: S3Client;

  constructor(config: VultrStorageConfig) {
    this.endpoint = config.endpoint;
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: "us-east-1",
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });
  }

  /**
   * Logs what's needed to diagnose an S3 failure: name, message, HTTP status and S3 Code.
   * Never logs credentials, env values or the request (T-037).
   */
  private logError(operation: string, key: string, err: unknown): void {
    const e = (err ?? {}) as {
      name?: string;
      message?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };
    console.error("[storage:vultr] operation failed", {
      operation,
      key,
      name: e.name,
      message: e.message,
      httpStatusCode: e.$metadata?.httpStatusCode,
      code: e.Code,
    });
  }

  private sanitizeError(err: unknown): Error {
    const genericMessage = "Vultr storage operation failed";
    if (err instanceof Error) {
      const errorName = err.name || "Error";
      return new Error(`${genericMessage} (${errorName})`);
    }
    return new Error(genericMessage);
  }

  private isNotFoundError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    if (
      "name" in err &&
      (err.name === "NoSuchKey" || err.name === "NotFound")
    ) {
      return true;
    }
    if (
      "$metadata" in err &&
      (err as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode === 404
    ) {
      return true;
    }
    return false;
  }

  async putObject(
    key: string,
    bytes: Uint8Array | Buffer,
    contentType: string,
    options?: PutObjectOptions,
  ): Promise<void> {
    const cleanKey = key.replace(/^\/+/, "");
    try {
      const isPublic = Boolean(options?.public);
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
        Body: bytes,
        ContentType: contentType,
        ...(isPublic ? { ACL: "public-read" } : {}),
        Metadata: {
          public: isPublic ? "true" : "false",
        },
      });
      await this.client.send(command);
    } catch (err: unknown) {
      this.logError("putObject", cleanKey, err);
      throw this.sanitizeError(err);
    }
  }

  async getObject(key: string): Promise<StorageObject | null> {
    const cleanKey = key.replace(/^\/+/, "");
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      const response = await this.client.send(command);
      if (!response.Body) {
        return null;
      }
      const bytes = await response.Body.transformToByteArray();
      const contentType = response.ContentType || "application/octet-stream";
      const isPublic = response.Metadata?.public === "true";
      return {
        bytes,
        contentType,
        public: isPublic,
      };
    } catch (err: unknown) {
      if (this.isNotFoundError(err)) {
        return null;
      }
      this.logError("getObject", cleanKey, err);
      throw this.sanitizeError(err);
    }
  }

  publicUrl(key: string): string {
    const cleanEndpoint = this.endpoint.replace(/\/+$/, "");
    const cleanKey = key.replace(/^\/+/, "");
    return `${cleanEndpoint}/${this.bucket}/${cleanKey}`;
  }
}
