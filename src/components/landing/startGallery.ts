// Shared "start a new blank gallery" flow for the landing page and the auth pages.
// Mirrors the old start-screen behaviour: load a fresh document into the store and autosave
// under the "local" key so the editor can pick it up at /edit/local.

import { newGallery } from "@/lib/schema/defaults";
import { useGalleryStore } from "@/store/gallery";
import { saveAutosave } from "@/store/autosave";

export function startBlankGallery(): void {
  const blank = newGallery();
  useGalleryStore.getState().loadGallery(blank);
  saveAutosave(blank, "local");
}
