import { afterEach, describe, expect, it, vi } from "vitest";
import { mailerFromEnv, sendVerificationCode, verificationEmail } from "./send";

afterEach(() => vi.restoreAllMocks());

describe("mailerFromEnv", () => {
  it("uses Gmail when both variables are set (app password spaces removed)", () => {
    expect(
      mailerFromEnv({
        GMAIL_USER: " me@gmail.com ",
        GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop",
        NODE_ENV: "production",
      }),
    ).toEqual({
      kind: "gmail",
      user: "me@gmail.com",
      pass: "abcdefghijklmnop",
    });
  });

  it("prints to the console outside production, and is missing in production", () => {
    expect(mailerFromEnv({ NODE_ENV: "development" })).toEqual({
      kind: "console",
    });
    expect(mailerFromEnv({ NODE_ENV: "production" })).toBeNull();
    expect(
      mailerFromEnv({ NODE_ENV: "production", GMAIL_USER: "me@gmail.com" }),
    ).toBeNull();
  });
});

describe("sendVerificationCode", () => {
  it("sends the code over the Gmail transport with the agreed subject", async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    await sendVerificationCode(
      "ada@example.com",
      "123456",
      { kind: "gmail", user: "me@gmail.com", pass: "p" },
      () => ({ sendMail }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Galleriverse <me@gmail.com>",
        to: "ada@example.com",
        subject: "Your Galleriverse code: 123456",
        text: expect.stringContaining("123456"),
        html: expect.stringContaining("123456"),
      }),
    );
  });

  it("only logs the code in console mode (never through the transport)", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const makeTransport = vi.fn();
    await sendVerificationCode(
      "ada@example.com",
      "654321",
      { kind: "console" },
      makeTransport,
    );
    expect(makeTransport).not.toHaveBeenCalled();
    expect(info.mock.calls[0][0]).toContain("654321");
  });

  it("lets Gmail failures reach the caller", async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error("EAUTH"));
    await expect(
      sendVerificationCode(
        "ada@example.com",
        "123456",
        { kind: "gmail", user: "u", pass: "p" },
        () => ({ sendMail }),
      ),
    ).rejects.toThrow("EAUTH");
  });
});

describe("verificationEmail", () => {
  it("has a plain-text and an HTML body that both carry the code and the expiry", () => {
    const mail = verificationEmail("777888");
    expect(mail.text).toContain("777888");
    expect(mail.text).toContain("10 minutes");
    expect(mail.html).toContain("777888");
  });
});
