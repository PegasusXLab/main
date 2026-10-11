import { describe, expect, it } from "vitest";
import { trackDisplay, useSpinStore } from "./spinStore";

describe("spinStore", () => {
  it("plays, holds and stops a chosen track", () => {
    const t = { title: "Neon Tide", artist: "Vic", url: "/n.wav" };
    useSpinStore.getState().setHold(true);
    useSpinStore.getState().play(t, "station");
    expect(useSpinStore.getState()).toMatchObject({ track: t, sourceId: "station", hold: false });
    useSpinStore.getState().setAudible(true);
    useSpinStore.getState().stop();
    expect(useSpinStore.getState()).toMatchObject({ track: null, sourceId: null, audible: false });
    expect(trackDisplay(t)).toBe("Neon Tide - Vic");
    expect(trackDisplay({ title: "Solo", url: "/s.wav" })).toBe("Solo");
  });
});
