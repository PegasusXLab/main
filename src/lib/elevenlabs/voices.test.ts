import { describe, expect, it } from "vitest";
import { shortVoiceName } from "./voices";

describe("shortVoiceName", () => {
  it("keeps only the name", () => {
    expect(shortVoiceName("Jessica - Playful, Bright, Warm")).toBe("Jessica");
    expect(shortVoiceName("Brian – Deep, Resonant")).toBe("Brian");
    expect(shortVoiceName("Bella (The Meditative Docent)")).toBe("Bella");
    expect(shortVoiceName("Mary-Kate")).toBe("Mary-Kate");
    expect(shortVoiceName("My voice")).toBe("My voice");
    expect(shortVoiceName(null)).toBe("");
  });
});
