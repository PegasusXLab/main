import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EMAIL_RE,
  fetchMe,
  loginUser,
  logoutUser,
  registerUser,
} from "./authClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("registerUser", () => {
  it("POSTs to /api/auth/register and returns the created user", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(201, { id: "u-1", email: "ada@example.com", name: "Ada" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await registerUser({
      email: "ada@example.com",
      password: "password1",
      name: "Ada",
    });

    expect(result.user?.id).toBe("u-1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/auth/register");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "ada@example.com",
      password: "password1",
      name: "Ada",
    });
  });

  it("drops a blank name", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(201, { id: "u-2", email: "a@b.co", name: null }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await registerUser({ email: "a@b.co", password: "password1", name: "  " });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      email: "a@b.co",
      password: "password1",
    });
  });

  it("surfaces the server message for a 409 duplicate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(409, {
          error: "An account with this email already exists",
        }),
      ),
    );
    const result = await registerUser({
      email: "a@b.co",
      password: "password1",
    });
    expect(result.user).toBeUndefined();
    expect(result.error).toBe("An account with this email already exists");
  });
});

describe("loginUser", () => {
  it("maps an unlabelled 401 to the enumeration-safe message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, null)));
    const result = await loginUser({ email: "a@b.co", password: "nope" });
    expect(result.error).toBe("Email or password is incorrect.");
  });

  it("keeps the server message for a 503 not-configured response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(503, { error: "Accounts not configured" }),
        ),
    );
    const result = await loginUser({ email: "a@b.co", password: "x" });
    expect(result.error).toBe("Accounts not configured");
  });

  it("falls back gracefully when the network fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("failed to fetch")),
    );
    const result = await loginUser({ email: "a@b.co", password: "x" });
    expect(result.error).toContain("Could not reach the server");
  });
});

describe("fetchMe", () => {
  it("returns the user when logged in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          id: "u-1",
          email: "ada@example.com",
          name: "Ada",
        }),
      ),
    );
    const user = await fetchMe();
    expect(user?.email).toBe("ada@example.com");
  });

  it("returns null when not logged in", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, null)));
    expect(await fetchMe()).toBeNull();
  });
});

describe("logoutUser", () => {
  it("POSTs to /api/auth/logout", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await logoutUser();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });
});

describe("EMAIL_RE", () => {
  it.each(["ada@example.com", "a+b@sub.domain.co"])("accepts %s", (email) =>
    expect(EMAIL_RE.test(email)).toBe(true),
  );

  it.each(["", "not-an-email", "a@b", "@b.co", "a b@c.co"])(
    "rejects %j",
    (email) => expect(EMAIL_RE.test(email)).toBe(false),
  );
});
