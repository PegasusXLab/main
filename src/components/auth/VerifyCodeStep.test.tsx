import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { cleanCode, VerifyCodeStep } from "./VerifyCodeStep";
import { AuthForm } from "./AuthForm";

describe("cleanCode", () => {
  it("keeps digits only, at most 6 (pasting '123 456' works)", () => {
    expect(cleanCode("123 456")).toBe("123456");
    expect(cleanCode("12-34-56-78")).toBe("123456");
    expect(cleanCode("abc")).toBe("");
  });
});

describe("VerifyCodeStep", () => {
  it("tells people where the code went, with a one-time-code field and a resend countdown", () => {
    const html = renderToString(
      <VerifyCodeStep
        idPrefix="register"
        email="ada@example.com"
        onVerified={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(html).toContain("Check your email");
    expect(html).toContain("ada@example.com");
    expect(html).toMatch(/autocomplete="one-time-code"/i);
    expect(html).toMatch(/inputmode="numeric"/i);
    expect(html).toMatch(/maxlength="6"/i);
    expect(html).toContain("Verify and continue");
    expect(html).toMatch(/Send a new code in (<!-- -->)?60(<!-- -->)?s/);
    expect(html).toContain("Use a different email");
  });

  it("shows why it opened (e.g. from the login form)", () => {
    const html = renderToString(
      <VerifyCodeStep
        idPrefix="login"
        email="ada@example.com"
        initialInfo="Your email isn't verified yet, so we sent you a new code."
        initialResendIn={0}
        onVerified={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(html).toContain("isn&#x27;t verified yet");
    expect(html).toMatch(/>Send a new code</);
  });
});

describe("AuthForm honeypot", () => {
  it("register has a hidden, untabbable 'website' field; login doesn't", () => {
    const reg = renderToString(<AuthForm mode="register" />);
    expect(reg).toContain('name="website"');
    expect(reg).toContain('tabindex="-1"');
    expect(reg).toContain('aria-hidden="true"');
    expect(renderToString(<AuthForm mode="login" />)).not.toContain(
      'name="website"',
    );
  });
});
