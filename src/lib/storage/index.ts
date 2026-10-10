import { LocalStorage } from "./local";
import { VultrStorage } from "./vultr";

export interface PutObjectOptions {
  public?: boolean;
}

export interface StorageObject {
  bytes: Uint8Array;
  contentType: string;
  public?: boolean;
}

export interface Storage {
  putObject(
    key: string,
    bytes: Uint8Array | Buffer,
    contentType: string,
    options?: PutObjectOptions,
  ): Promise<void>;
  getObject(key: string): Promise<StorageObject | null>;
  publicUrl(key: string): string;
}

export { LocalStorage } from "./local";
export { VultrStorage, type VultrStorageConfig } from "./vultr";

export function getStorage(
  env: Record<string, string | undefined> = process.env,
): Storage {
  const {
    VULTR_S3_ENDPOINT,
    VULTR_S3_BUCKET,
    VULTR_S3_ACCESS_KEY,
    VULTR_S3_SECRET_KEY,
  } = env;

  if (
    VULTR_S3_ENDPOINT &&
    VULTR_S3_BUCKET &&
    VULTR_S3_ACCESS_KEY &&
    VULTR_S3_SECRET_KEY
  ) {
    return new VultrStorage({
      endpoint: VULTR_S3_ENDPOINT,
      bucket: VULTR_S3_BUCKET,
      accessKey: VULTR_S3_ACCESS_KEY,
      secretKey: VULTR_S3_SECRET_KEY,
    });
  }

  return new LocalStorage();
}
