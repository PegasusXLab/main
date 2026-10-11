/**
 * Convert an AudioBuffer to a standard 16-bit PCM RIFF WAVE Blob.
 * Guaranteed to pass server-side magic byte inspection (detectAudioType).
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const dataLength = samples.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  // 1. "RIFF" chunk descriptor
  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(8, "WAVE");

  // 2. "fmt " sub-chunk
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * bytesPerSample, true); // ByteRate
  view.setUint16(32, bytesPerSample, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // 3. "data" sub-chunk
  writeAscii(36, "data");
  view.setUint32(40, dataLength, true);

  // Write 16-bit linear PCM samples clamped between -1.0 and 1.0
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

export class LiveRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not supported in this browser.");
    }
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(100);
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error("No active recording session"));
        return;
      }

      this.recorder.onstop = async () => {
        try {
          this.stream?.getTracks().forEach((t) => t.stop());
          const rawBlob = new Blob(this.chunks, { type: this.recorder?.mimeType || "audio/webm" });

          // Convert to universal RIFF WAVE using AudioContext if available
          if (typeof window !== "undefined" && (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            const arrayBuf = await rawBlob.arrayBuffer();
            const decoded = await ctx.decodeAudioData(arrayBuf);
            const wavBlob = audioBufferToWav(decoded);
            await ctx.close();
            resolve(wavBlob);
          } else {
            resolve(rawBlob);
          }
        } catch {
          // Fallback to raw recorded blob if decode fails
          const rawBlob = new Blob(this.chunks, { type: "audio/webm" });
          resolve(rawBlob);
        }
      };

      this.recorder.stop();
    });
  }

  cancel(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
    this.chunks = [];
  }
}
