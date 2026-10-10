// 3D model uploads go through a Vercel function, whose request body limit is ~4.5 MB (a bigger
// body fails with 413 FUNCTION_PAYLOAD_TOO_LARGE before our code runs). Cap at 4 MB so the
// limit we state is the one users actually hit, with our own message (T-132, same shape as T-125).

export const MAX_MODEL_BYTES = 4 * 1024 * 1024;

export const MODEL_TOO_LARGE =
  "3D files can be up to 4 MB. Try a smaller export or decimate the mesh first.";

export const MODEL_HINT = ".glb up to 4 MB, e.g. from Polycam or Scaniverse";

/** The error to show for a file of `size` bytes, or null when it may be uploaded. */
export function checkModelSize(size: number): string | null {
  return size > MAX_MODEL_BYTES ? MODEL_TOO_LARGE : null;
}
