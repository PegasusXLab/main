import { describe, expect, it } from "vitest";
import { mailFailureReason } from "./pending";

describe("mailFailureReason", () => {
  it("names the kind of Gmail failure without anything secret", () => {
    expect(
      mailFailureReason({
        code: "EAUTH",
        responseCode: 535,
        command: "AUTH PLAIN",
        message:
          "535-5.7.8 Username and Password not accepted for me@gmail.com",
      }),
    ).toBe("EAUTH 535 AUTH PLAIN");
    expect(mailFailureReason({ code: "ETIMEDOUT" })).toBe("ETIMEDOUT");
  });

  it("falls back to 'error' and strips odd characters", () => {
    expect(mailFailureReason(new Error("boom"))).toBe("error");
    expect(mailFailureReason(undefined)).toBe("error");
    expect(mailFailureReason({ code: "E<script>" })).toBe("Escript");
  });
});
