import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { AuthForm, validateAuthForm } from "./AuthForm";

describe("validateAuthForm", () => {
  it("accepts a valid register payload", () => {
    expect(
      validateAuthForm("register", {
        name: "Ada",
        email: "ada@example.com",
        password: "password1",
      }),
    ).toEqual({});
  });

  it("requires an email-shaped address", () => {
    const errors = validateAuthForm("login", {
      name: "",
      email: "not-an-email",
      password: "x",
    });
    expect(errors.email).toBe("Enter a valid email address.");
  });

  it("requires 8+ characters on register", () => {
    const errors = validateAuthForm("register", {
      name: "",
      email: "a@b.co",
      password: "short",
    });
    expect(errors.password).toBe("Password must be at least 8 characters.");
  });

  it("requires a non-empty password on login", () => {
    const errors = validateAuthForm("login", {
      name: "",
      email: "a@b.co",
      password: "",
    });
    expect(errors.password).toBe("Enter your password.");
  });

  it("limits the display name length", () => {
    const errors = validateAuthForm("register", {
      name: "x".repeat(61),
      email: "a@b.co",
      password: "password1",
    });
    expect(errors.name).toBeDefined();
  });
});

describe("AuthForm", () => {
  it("renders register fields including the optional name", () => {
    const html = renderToString(<AuthForm mode="register" />);
    expect(html).toContain('id="register-name"');
    expect(html).toContain('id="register-email"');
    expect(html).toContain('id="register-password"');
    expect(html).toContain("Create free account");
    expect(html).toContain("At least 8 characters");
  });

  it("renders login fields without the name field", () => {
    const html = renderToString(<AuthForm mode="login" />);
    expect(html).toContain('id="login-email"');
    expect(html).toContain('id="login-password"');
    expect(html).toContain("Log in");
    expect(html).not.toContain('id="login-name"');
  });

  it("keeps labels associated with inputs via htmlFor", () => {
    const html = renderToString(<AuthForm mode="login" />);
    expect(html).toContain('for="login-email"');
    expect(html).toContain('id="login-email"');
  });

  it("renders the submit button as a submit control", () => {
    const html = renderToString(<AuthForm mode="register" />);
    expect(html).toContain('type="submit"');
  });
});
