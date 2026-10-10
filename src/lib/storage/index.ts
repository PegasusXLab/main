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

/**
 * Picks the storage backend (ADR-008): Vultr Object Storage when all four VULTR_S3_* variables are
 * set, otherwise local disk under `.data/` (or PEGASUS_DATA_DIR, used by tests for isolation).
 * Values are trimmed. A malformed endpoint fails fast with a message naming the variable, never its value.
 */
export function getStorage(
  env: Record<string, string | undefined> = process.env,
): Storage {
  const read = (name: string) => env[name]?.trim() || undefined;
  const endpoint = read("VULTR_S3_ENDPOINT");
  const bucket = read("VULTR_S3_BUCKET");
  const accessKey = read("VULTR_S3_ACCESS_KEY");
  const secretKey = read("VULTR_S3_SECRET_KEY");

  if (endpoint && bucket && accessKey && secretKey) {
    assertHttpsEndpoint(endpoint);
    return new VultrStorage({ endpoint, bucket, accessKey, secretKey });
  }

  return new LocalStorage(read("PEGASUS_DATA_DIR"));
}

const ENDPOINT_HELP =
  "VULTR_S3_ENDPOINT must be a full https:// URL, e.g. https://<region>.vultrobjects.com";

function assertHttpsEndpoint(endpoint: string): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error(`${ENDPOINT_HELP} (it is not a valid URL)`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`${ENDPOINT_HELP} (it must start with https://)`);
  }
}
