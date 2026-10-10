import { describe, expect, it } from "vitest";

describe("test setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});

describe("deliberately failing (CI proof, will be removed)", () => {
  it("fails on purpose", () => {
    expect(1 + 1).toBe(3);
  });
});
