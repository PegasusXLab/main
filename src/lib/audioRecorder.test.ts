import { describe, expect, it } from "vitest";
import { audioBufferToWav } from "./audioRecorder";
import { detectAudioType } from "@/app/api/upload/audio/route";

describe("audioBufferToWav", () => {
  it("encodes an AudioBuffer into a valid RIFF WAVE blob detected by detectAudioType", async () => {
    // Mock minimal AudioBuffer
    const sampleRate = 44100;
    const length = 4410; // 0.1s
    const channelData = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((i / sampleRate) * 440 * 2 * Math.PI); // 440 Hz tone
    }

    const mockBuffer = {
      sampleRate,
      numberOfChannels: 1,
      length,
      getChannelData: () => channelData,
    } as unknown as AudioBuffer;

    const wavBlob = audioBufferToWav(mockBuffer);
    expect(wavBlob.type).toBe("audio/wav");

    const arrayBuf = await wavBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    // Verify RIFF header
    const type = detectAudioType(bytes);
    expect(type).toEqual({ contentType: "audio/wav", ext: "wav" });
  });
});
