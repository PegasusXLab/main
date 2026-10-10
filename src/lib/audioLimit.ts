// Audio uploads go through a Vercel function, whose request body limit is ~4.5 MB (a bigger
// body fails with 413 FUNCTION_PAYLOAD_TOO_LARGE before our code runs). Cap at 4 MB so the
// limit we state is the one users actually hit, with our own message (T-125).

export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export const AUDIO_TOO_LARGE =
  "Audio files can be up to 4 MB. Try a shorter clip or a 128 kbps MP3.";

export const AUDIO_HINT = "MP3, WAV, OGG or M4A, up to 4 MB";

/** The error to show for a file of `size` bytes, or null when it may be uploaded. */
export function checkAudioSize(size: number): string | null {
  return size > MAX_AUDIO_BYTES ? AUDIO_TOO_LARGE : null;
}
