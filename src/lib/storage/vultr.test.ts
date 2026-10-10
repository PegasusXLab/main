import { describe, it, expect, vi, beforeEach } from "vitest";
import { VultrStorage } from "./vultr";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

describe("VultrStorage", () => {
  const config = {
    endpoint: "https://ewr1.vultrobjects.com",
    bucket: "pegasus-test",
    accessKey: "TEST_ACCESS_KEY",
    secretKey: "TEST_SECRET_KEY",
  };

  let storage: VultrStorage;
  let sendMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = new VultrStorage(config);
    sendMock = vi.fn();
    // Replace S3Client.prototype.send with sendMock
    vi.spyOn(S3Client.prototype, "send").mockImplementation(
      sendMock as unknown as typeof S3Client.prototype.send,
    );
  });

  it("publicUrl is a same-origin /api/files path, never the bucket URL (T-072)", () => {
    expect(storage.publicUrl("images/photo.webp")).toBe(
      "/api/files/images/photo.webp",
    );
    expect(storage.publicUrl("/images/photo.webp")).toBe(
      "/api/files/images/photo.webp",
    );
    expect(storage.publicUrl("images/photo.webp")).not.toContain(
      "vultrobjects.com",
    );
  });

  it("sets public-read ACL on public putObject", async () => {
    sendMock.mockResolvedValueOnce({});
    const data = new TextEncoder().encode("image data");

    await storage.putObject("images/photo.webp", data, "image/webp", {
      public: true,
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input.Bucket).toBe("pegasus-test");
    expect(command.input.Key).toBe("images/photo.webp");
    expect(command.input.ContentType).toBe("image/webp");
    expect(command.input.ACL).toBe("public-read");
    expect(command.input.Metadata?.public).toBe("true");
  });

  it("omits public-read ACL on private putObject", async () => {
    sendMock.mockResolvedValueOnce({});
    const data = new TextEncoder().encode('{"title":"test"}');

    await storage.putObject("galleries/1.json", data, "application/json", {
      public: false,
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input.Bucket).toBe("pegasus-test");
    expect(command.input.Key).toBe("galleries/1.json");
    expect(command.input.ACL).toBeUndefined();
    expect(command.input.Metadata?.public).toBe("false");
  });

  it("retrieves object data and metadata in getObject", async () => {
    const rawBytes = new TextEncoder().encode("artwork bytes");
    sendMock.mockResolvedValueOnce({
      Body: {
        transformToByteArray: vi.fn().mockResolvedValue(rawBytes),
      },
      ContentType: "image/webp",
      Metadata: {
        public: "true",
      },
    });

    const result = await storage.getObject("images/photo.webp");
    expect(result).not.toBeNull();
    expect(result?.contentType).toBe("image/webp");
    expect(result?.public).toBe(true);
    expect(new TextDecoder().decode(result?.bytes)).toBe("artwork bytes");
  });

  it("returns null when S3 throws NoSuchKey", async () => {
    const notFoundError = new Error("The specified key does not exist.");
    notFoundError.name = "NoSuchKey";
    sendMock.mockRejectedValueOnce(notFoundError);

    const result = await storage.getObject("missing.webp");
    expect(result).toBeNull();
  });

  it("never logs or leaks secret credentials in thrown errors", async () => {
    const s3Error = new Error(`Connection failed with key ${config.secretKey}`);
    s3Error.name = "AccessDenied";
    sendMock.mockRejectedValueOnce(s3Error);

    await expect(
      storage.putObject("test.txt", new Uint8Array(), "text/plain"),
    ).rejects.toThrowError();

    try {
      await storage.putObject("test.txt", new Uint8Array(), "text/plain");
    } catch (err: unknown) {
      const message = String(err);
      expect(message).not.toContain(config.secretKey);
      expect(message).not.toContain(config.accessKey);
    }
  });

  it("logs name, message, status and S3 Code on failure, never key material (T-037)", async () => {
    const err = Object.assign(
      new Error("The specified bucket does not exist"),
      {
        name: "NoSuchBucket",
        Code: "NoSuchBucket",
        $metadata: { httpStatusCode: 404 },
      },
    );
    sendMock.mockRejectedValueOnce(err);
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      storage.putObject("images/a.webp", new Uint8Array([1]), "image/webp"),
    ).rejects.toThrow("Vultr storage operation failed (NoSuchBucket)");

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(logSpy.mock.calls[0]);
    expect(logged).toContain("NoSuchBucket");
    expect(logged).toContain("The specified bucket does not exist");
    expect(logged).toContain("404");
    expect(logged).toContain("putObject");
    expect(logged).not.toContain(config.accessKey);
    expect(logged).not.toContain(config.secretKey);
    logSpy.mockRestore();
  });

  it("does not log a plain not-found on getObject", async () => {
    sendMock.mockRejectedValueOnce(
      Object.assign(new Error("nope"), { name: "NoSuchKey" }),
    );
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await storage.getObject("missing.json")).toBeNull();
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("redacts configured keys and endpoint even when the S3 error message contains them", async () => {
    const err = Object.assign(
      new Error(
        `SignatureDoesNotMatch for ${config.accessKey} with ${config.secretKey} at ${config.endpoint} (ewr1.vultrobjects.com)`,
      ),
      {
        name: "SignatureDoesNotMatch",
        Code: `Bad ${config.accessKey}`,
        $metadata: { httpStatusCode: 403 },
      },
    );
    sendMock.mockRejectedValueOnce(err);
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      storage.putObject("a.webp", new Uint8Array([1]), "image/webp"),
    ).rejects.toThrow("Vultr storage operation failed");

    const logged = JSON.stringify(logSpy.mock.calls);
    expect(logged).toContain("SignatureDoesNotMatch");
    expect(logged).toContain("[redacted]");
    expect(logged).toContain("403");
    for (const secret of [
      config.accessKey,
      config.secretKey,
      config.endpoint,
      "ewr1.vultrobjects.com",
    ]) {
      expect(logged).not.toContain(secret);
    }
    logSpy.mockRestore();
  });
});
