// Interactive devices that sit on a host object (a TV on a media cabinet, a turntable on a
// console, a guestbook on a side table). Pure sizes and defaults shared by compile, the 3D
// renderer and the editor.

import type { GalleryObject, ObjectDevice, Track } from "./schema/types";

/** Bezel + foot under a TV screen (meters). */
export const TV_STAND = 0.09;
export const TURNTABLE_SIZE = { w: 0.46, d: 0.36, h: 0.14 } as const;
export const GUESTBOOK_SIZE = { w: 0.56, d: 0.4, h: 0.1 } as const;

/** How tall the device stands above its host's top. */
export function deviceHeight(d: ObjectDevice): number {
  switch (d.kind) {
    case "tv":
      return TV_STAND + d.screen * d.video.aspect;
    case "turntable":
      return TURNTABLE_SIZE.h;
    case "guestbook":
      return GUESTBOOK_SIZE.h;
  }
}

export const DEVICE_LABELS: Record<ObjectDevice["kind"], string> = {
  tv: "Video screen",
  turntable: "Listening station",
  guestbook: "Guestbook",
};

/** The tracks a piece can play (a turntable's list, or an album cover's one song). */
export function playableTracks(device?: ObjectDevice, track?: Track): Track[] {
  if (device?.kind === "turntable") return device.tracks.filter((t) => t.url);
  return track?.url ? [track] : [];
}

export type DeviceKind = ObjectDevice["kind"];

/** What "+ Add → Video screen / Listening station / Guestbook" places: host furniture + device. */
export interface DevicePreset {
  libraryId: string;
  /** Host height (meters); furniture scales with it. */
  height: number;
  object: Pick<GalleryObject, "title" | "story" | "inspectable" | "plinth"> & { device: ObjectDevice };
}

export const DEVICE_PRESETS: Record<DeviceKind, DevicePreset> = {
  tv: {
    libraryId: "cabinet-modern",
    height: 0.6,
    object: {
      title: "Now showing",
      story: "",
      inspectable: true,
      plinth: { shape: "none", height: 0 },
      device: { kind: "tv", video: { url: "", aspect: 9 / 16 }, screen: 1.3 },
    },
  },
  turntable: {
    libraryId: "console-classic",
    height: 0.9,
    object: {
      title: "Listening station",
      story: "Pick a record. It plays through the room.",
      inspectable: true,
      plinth: { shape: "none", height: 0 },
      device: { kind: "turntable", tracks: [], accent: "#e8b04a" },
    },
  },
  guestbook: {
    libraryId: "table-side",
    height: 0.78,
    object: {
      title: "Guestbook",
      story: "",
      inspectable: true,
      plinth: { shape: "none", height: 0 },
      device: { kind: "guestbook", prompt: "Leave a note for the artist." },
    },
  },
};
