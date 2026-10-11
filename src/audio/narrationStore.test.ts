import { describe, expect, it, beforeEach } from "vitest";
import { useNarrationStore } from "./narrationStore";

describe("useNarrationStore", () => {
  beforeEach(() => {
    useNarrationStore.getState().stopNarration();
    useNarrationStore.getState().setMuted(false);
    useNarrationStore.getState().resetSessionVisits();
  });

  it("manages visited rooms and items", () => {
    const store = useNarrationStore.getState();
    expect(store.hasVisitedRoom("r1")).toBe(false);
    store.markRoomVisited("r1");
    expect(useNarrationStore.getState().hasVisitedRoom("r1")).toBe(true);

    expect(store.hasVisitedItem("art-1")).toBe(false);
    store.markItemVisited("art-1");
    expect(useNarrationStore.getState().hasVisitedItem("art-1")).toBe(true);
  });

  it("updates playing state and track info on play", () => {
    useNarrationStore.getState().playNarration({
      url: "/api/files/audio/narration-1.mp3",
      title: "The Blue Room",
      voiceName: "Rachel",
      text: "This room was painted in 1903.",
    });

    const state = useNarrationStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.activeUrl).toBe("/api/files/audio/narration-1.mp3");
    expect(state.activeTitle).toBe("The Blue Room");
    expect(state.activeVoiceName).toBe("Rachel");
  });

  it("handles stop and pause correctly", () => {
    useNarrationStore.getState().playNarration({
      url: "/api/files/audio/test.mp3",
    });
    expect(useNarrationStore.getState().isPlaying).toBe(true);

    useNarrationStore.getState().pauseNarration();
    expect(useNarrationStore.getState().isPlaying).toBe(false);
    expect(useNarrationStore.getState().activeUrl).toBe("/api/files/audio/test.mp3");

    useNarrationStore.getState().stopNarration();
    expect(useNarrationStore.getState().isPlaying).toBe(false);
    expect(useNarrationStore.getState().activeUrl).toBeNull();
  });

  it("toggles and remembers mute state", () => {
    useNarrationStore.getState().setMuted(false);
    expect(useNarrationStore.getState().muted).toBe(false);

    useNarrationStore.getState().toggleMuted();
    expect(useNarrationStore.getState().muted).toBe(true);

    // Muted prevents playback
    useNarrationStore.getState().playNarration({ url: "/api/files/audio/test.mp3" });
    expect(useNarrationStore.getState().isPlaying).toBe(false);
  });
});
