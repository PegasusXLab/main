#!/usr/bin/env node
// Seeds the Galleriverse showcase: "Midnight Static", an album you can walk through. Five rooms
// that use every feature: artist profile, room music + titles + looks, voiceovers, paintings with
// details and links, an album wall whose covers play their songs, a listening station (turntable
// on a console), a screening room (TV on a media cabinet), sculpture, and a guestbook.
//
//   node tests/e2e/seed-showcase.mjs [baseUrl] [--voices]
//
// baseUrl defaults to http://localhost:3000. --voices asks the server to generate the room and
// piece voiceovers with ElevenLabs (needs ELEVENLABS_API_KEY on the server; uses credits). Prints
// the view link and the edit link (keep the edit link private: it carries the edit key).
// Media is served from /public/showcase and /public/landing (see their CREDITS.md).

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:3000").replace(/\/$/, "");
const withVoices = args.includes("--voices");

const now = new Date().toISOString();
const S = "/showcase";
const cover = (id) => ({ small: `${S}/${id}-512.webp`, medium: `${S}/${id}-1024.webp`, large: `${S}/${id}-1024.webp` });
const painting = (id) => ({ small: `/landing/large/${id}.webp`, medium: `/landing/large/${id}.webp`, large: `/landing/large/${id}.webp` });
const track = (id, title) => ({ title, artist: "Vic Googe", url: `${S}/${id}.wav`, coverUrl: `${S}/${id}-512.webp` });

const TRACKS = {
  midnight: track("midnight-static", "Midnight Static"),
  neon: track("neon-tide", "Neon Tide"),
  moons: track("paper-moons", "Paper Moons"),
  bloom: track("late-bloom", "Late Bloom"),
};

const rooms = [
  {
    id: "arrival",
    name: "Arrival",
    description: "Welcome in. Midnight Static is four songs about the hour when the city hums and nobody's watching.",
    x: 0, y: 0, w: 7, d: 6, wallHeight: 3.2,
    wallColor: "#1b1d2a", floor: "marble", lighting: "moody", look: "noir", wallFinish: "plaster",
    titleFont: "syne", titleColor: "#ffd9a8", titleStyle: "depth", titlePosition: "top-left",
    music: { url: TRACKS.midnight.url, title: "Midnight Static - Vic Googe" },
  },
  {
    id: "album-wall",
    name: "The Album Wall",
    description: "Every cover plays its song. Open one, press play, and the room changes key.",
    x: 7, y: 0, w: 8, d: 6, wallHeight: 3.2,
    wallColor: "#f3efe6", floor: "wood", lighting: "gallery", look: "museum", wallFinish: "smooth",
    titleFont: "playfair", titleColor: "#1f2a44", titleStyle: "depth", titlePosition: "center",
    music: { url: TRACKS.neon.url, title: "Neon Tide - Vic Googe" },
  },
  {
    id: "listening-room",
    name: "Listening Room",
    description: "Sit down. Put a record on. The turntable plays through the whole room.",
    x: 0, y: 6, w: 7, d: 6, wallHeight: 3,
    wallColor: "#2a1f1a", floor: "wood", lighting: "warm", look: "film", wallFinish: "brick",
    titleFont: "cormorant", titleColor: "#f6d7a7", titleStyle: "depth", titlePosition: "center",
    music: { url: TRACKS.moons.url, title: "Paper Moons - Vic Googe" },
  },
  {
    id: "screening-room",
    name: "Screening Room",
    description: "The visualizer for Late Bloom, on loop. Turn the sound on from its panel.",
    x: 7, y: 6, w: 8, d: 6, wallHeight: 3,
    wallColor: "#111216", floor: "concrete", lighting: "moody", look: "film", wallFinish: "concrete",
    titleFont: "mono", titleColor: "#9fb8ff", titleStyle: "depth", titlePosition: "top-left",
    music: { url: TRACKS.bloom.url, title: "Late Bloom - Vic Googe" },
  },
  {
    id: "influences",
    name: "Influences & Guestbook",
    description: "The paintings that sat next to the synth while this record was made. Sign the book on your way out.",
    x: 0, y: 12, w: 15, d: 5, wallHeight: 3.2,
    wallColor: "#ece6da", floor: "wood", lighting: "gallery", look: "museum", wallFinish: "plaster",
    titleFont: "fraunces", titleColor: "#3b2e1e", titleStyle: "depth", titlePosition: "center",
    music: { trackId: "soft-drift" },
  },
];

const art = (o) => ({ type: "image", inspectable: true, artist: "Vic Googe", story: "", ...o });

const artworks = [
  // Arrival: the hero cover
  art({
    id: "hero-midnight-static", roomId: "arrival", placement: { wall: "n", offset: 3.5, height: 1.65 },
    width: 2.0, aspect: 1, image: cover("midnight-static"), title: "Midnight Static",
    story: "The title track came out of a broken radio left on overnight: the static under the music became the music. Four songs, recorded between 1 and 4 a.m.",
    facts: [
      { label: "Release", value: "October 17, 2026" },
      { label: "Format", value: "LP · 4 tracks" },
      { label: "Label", value: "Self-released" },
      { label: "Recorded", value: "Atlanta, GA" },
    ],
    link: "https://open.spotify.com/", action: "presave", track: TRACKS.midnight,
  }),
  // Album wall: one cover per song, each with its own action
  art({
    id: "cover-neon-tide", roomId: "album-wall", placement: { wall: "n", offset: 1.8, height: 1.6 },
    width: 1.4, aspect: 1, image: cover("neon-tide"), title: "Neon Tide",
    story: "Single. Written on the BeltLine after a storm, when the puddles held the signs.",
    facts: [{ label: "Length", value: "0:44 loop" }, { label: "Tempo", value: "88 BPM" }],
    link: "https://open.spotify.com/", action: "stream", track: TRACKS.neon,
  }),
  art({
    id: "cover-paper-moons", roomId: "album-wall", placement: { wall: "n", offset: 4.0, height: 1.6 },
    width: 1.4, aspect: 1, image: cover("paper-moons"), title: "Paper Moons",
    story: "The slow one. Five moons, one waning, one full; the record's quietest corner.",
    facts: [{ label: "Length", value: "0:39 loop" }, { label: "Tempo", value: "74 BPM" }],
    link: "https://bandcamp.com/", action: "buy", price: "$1", track: TRACKS.moons,
  }),
  art({
    id: "cover-late-bloom", roomId: "album-wall", placement: { wall: "n", offset: 6.2, height: 1.6 },
    width: 1.4, aspect: 1, image: cover("late-bloom"), title: "Late Bloom",
    story: "Brightest song on the record. The bell melody was a voice memo hummed on the way home.",
    facts: [{ label: "Length", value: "0:42 loop" }, { label: "Tempo", value: "92 BPM" }],
    link: "https://www.youtube.com/", action: "watch", track: TRACKS.bloom,
  }),
  art({
    id: "vinyl-midnight-static", roomId: "album-wall", placement: { wall: "e", offset: 3, height: 1.55 },
    width: 1.6, aspect: 1, image: cover("midnight-static"), title: "Midnight Static (vinyl)",
    story: "Pressed on smoke-clear 180 g vinyl with a printed inner sleeve. 300 copies.",
    facts: [{ label: "Edition", value: "300 copies" }, { label: "Format", value: "12\" · 180 g" }],
    link: "https://bandcamp.com/", action: "buy", price: "$28", track: TRACKS.midnight,
  }),
  // Listening room: an influence above the console
  art({
    id: "listening-great-wave", roomId: "listening-room", placement: { wall: "w", offset: 3, height: 2.0 },
    width: 1.5, aspect: 1076 / 1600, image: painting("great-wave"),
    title: "Under the Wave off Kanagawa", artist: "Katsushika Hokusai",
    story: "The rhythm section of Neon Tide is this print: the big wave is the kick, the little boats are the hats.",
    facts: [{ label: "Date", value: "ca. 1830–32" }, { label: "Medium", value: "Woodblock print" }, { label: "Collection", value: "The Met (CC0)" }],
    link: "https://www.metmuseum.org/art/collection/search/45434", action: "learn",
  }),
  // Influences: paintings along the long south wall
  ...[
    ["water-lilies", "Water Lilies", "Helena de Kay", "ca. 1870–77", "899646", 1048 / 1600, "Paper Moons borrowed its palette: deep water, pale light, nothing in a hurry."],
    ["sunflowers", "Sunflowers", "Vincent van Gogh", "1887", "436524", 1130 / 1600, "Late Bloom's cover started as a sketch of these, turned until they became a single flower."],
    ["harvesters", "The Harvesters", "Pieter Bruegel the Elder", "1565", "435809", 1179 / 1600, "A whole afternoon in one frame. The album tries to do that with a night."],
    ["self-portrait", "Self-Portrait", "Rembrandt van Rijn", "1660", "437397", 1600 / 1319, "Honest light, no flattery. The mixes stayed raw because of this face."],
    ["study-young-woman", "Study of a Young Woman", "Johannes Vermeer", "ca. 1665–67", "437879", 1600 / 1429, "The quiet before the drop: the room tone at the start of Midnight Static."],
  ].map(([id, title, artist, date, met, aspect, story], i) =>
    art({
      id: `influence-${id}`, roomId: "influences",
      placement: { wall: "s", offset: 1.8 + i * 2.85, height: 1.6 },
      width: aspect > 1 ? 1.1 : 1.6, aspect, image: painting(id), title, artist, story,
      facts: [{ label: "Date", value: date }, { label: "Collection", value: "The Met (CC0)" }],
      link: `https://www.metmuseum.org/art/collection/search/${met}`, action: "learn",
    }),
  ),
];

const lib = (libraryId) => ({ kind: "library", libraryId });
const FLOOR = { shape: "none", height: 0 };
const decor = (o) => ({ title: "", artist: "", story: "", inspectable: false, plinth: FLOOR, ...o });

const objects = [
  // Arrival
  decor({ id: "arrival-chair", roomId: "arrival", position: { x: 1.4, y: 3.4 }, rotation: 150, height: 1.169, source: lib("chair-lounge") }),
  decor({ id: "arrival-plant", roomId: "arrival", position: { x: 0.6, y: 0.7 }, rotation: 0, height: 0.267, plinth: { shape: "box", height: 0.8 }, source: lib("plant-succulent") }),
  decor({ id: "arrival-lamp", roomId: "arrival", position: { x: 6.4, y: 0.6 }, rotation: 0, height: 0.802, source: lib("lamp-oil") }),
  // Album wall
  decor({ id: "album-bench", roomId: "album-wall", position: { x: 4, y: 2.8 }, rotation: 180, height: 0.889, source: lib("bench-painted") }),
  // Listening room: the turntable on a console against the west wall, two chairs facing it
  {
    id: "listening-station", roomId: "listening-room", position: { x: 5.3, y: 5.6 }, rotation: 180, height: 0.9,
    plinth: FLOOR, source: lib("console-classic"), title: "Listening station", artist: "Vic Googe",
    story: "Pick a record. It plays through the whole room, and the platter spins while it does.",
    inspectable: true,
    facts: [{ label: "Records", value: "4" }, { label: "Speed", value: "33⅓ RPM" }],
    device: { kind: "turntable", accent: "#e8b04a", tracks: [TRACKS.midnight, TRACKS.neon, TRACKS.moons, TRACKS.bloom] },
  },
  decor({ id: "listening-chair-a", roomId: "listening-room", position: { x: 4.4, y: 2.4 }, rotation: 20, height: 1.169, source: lib("chair-lounge") }),
  decor({ id: "listening-chair-b", roomId: "listening-room", position: { x: 1.8, y: 3.4 }, rotation: 60, height: 1.169, source: lib("chair-lounge") }),
  decor({ id: "listening-table", roomId: "listening-room", position: { x: 3.2, y: 3.6 }, rotation: 0, height: 0.491, source: lib("table-coffee-round") }),
  decor({ id: "listening-lamp", roomId: "listening-room", position: { x: 0.5, y: 5.4 }, rotation: 0, height: 0.802, source: lib("lamp-oil") }),
  // Screening room: TV on a media cabinet against the east wall, seats facing it
  {
    id: "screening-tv", roomId: "screening-room", position: { x: 7.6, y: 3 }, rotation: 270, height: 0.6,
    plinth: FLOOR, source: lib("cabinet-modern"), title: "Late Bloom (visualizer)", artist: "Vic Googe",
    story: "A solar flare caught by NASA's Solar Dynamics Observatory, looped under Late Bloom: the brightest song gets the brightest thing we've ever filmed. Turn the sound on from here; the room's music steps aside.",
    inspectable: true,
    facts: [{ label: "Footage", value: "NASA SDO · public domain" }, { label: "Runtime", value: "1:10 loop" }],
    link: "https://www.youtube.com/", action: "watch",
    device: { kind: "tv", screen: 1.5, video: { url: `${S}/sun-eruption.mp4`, posterUrl: `${S}/late-bloom-512.webp`, aspect: 9 / 16 } },
  },
  decor({ id: "screening-bench", roomId: "screening-room", position: { x: 4.2, y: 3 }, rotation: 90, height: 0.889, source: lib("bench-painted") }),
  decor({ id: "screening-ottoman-a", roomId: "screening-room", position: { x: 4.4, y: 1.9 }, rotation: 0, height: 0.624, source: lib("ottoman-leather") }),
  decor({ id: "screening-ottoman-b", roomId: "screening-room", position: { x: 4.4, y: 4.2 }, rotation: 0, height: 0.624, source: lib("ottoman-leather") }),
  // Influences: sculpture + the guestbook
  {
    id: "influences-bust", roomId: "influences", position: { x: 5.8, y: 2.4 }, rotation: 0, height: 0.515,
    plinth: { shape: "box", height: 1.0 }, source: lib("bust-marble"), title: "Marble bust", artist: "Unknown",
    story: "Stood on the studio shelf through every session. Never complained about a take.",
    inspectable: true, facts: [{ label: "Model", value: "Poly Haven (CC0)" }],
  },
  {
    id: "influences-horse", roomId: "influences", position: { x: 9.2, y: 2.4 }, rotation: 20, height: 0.221,
    plinth: { shape: "box", height: 1.0 }, source: lib("statue-horse"), title: "Horse statuette", artist: "Unknown",
    story: "A flea-market find. The gallop rhythm is hiding in Late Bloom's hi-hats.",
    inspectable: true, facts: [{ label: "Model", value: "Poly Haven (CC0)" }],
  },
  {
    id: "guestbook", roomId: "influences", position: { x: 1.0, y: 2.5 }, rotation: 90, height: 0.78,
    plinth: FLOOR, source: lib("table-side"), title: "Guestbook", artist: "",
    story: "Thanks for walking through. Leave a note; it shows up in the book for the next visitor.",
    inspectable: true,
    device: { kind: "guestbook", prompt: "Which song stuck with you?" },
  },
  decor({ id: "influences-plant", roomId: "influences", position: { x: 14.4, y: 0.6 }, rotation: 0, height: 0.267, plinth: { shape: "box", height: 0.8 }, source: lib("plant-succulent") }),
];

const gallery = {
  id: "showcase-midnight-static",
  version: 1,
  title: "Midnight Static — an album you can walk through",
  entranceRoomId: "arrival",
  look: "noir",
  rooms,
  artworks,
  objects,
  creator: {
    name: "Vic Googe",
    bio: "Producer and visual artist from Atlanta. Midnight Static is my first record, built as a place you can walk through: every room is a song.",
    links: [
      { url: "https://open.spotify.com/" },
      { url: "https://www.instagram.com/" },
      { url: "https://bandcamp.com/" },
      { url: "https://www.youtube.com/" },
    ],
  },
  createdAt: now,
  updatedAt: now,
};

// Voiceovers (optional): room arrivals + the hero cover + the listening station.
const SCRIPTS = {
  "room:arrival":
    "Welcome to Midnight Static. This record was made between one and four in the morning, and this gallery is the place it lives. Every room is a song. Take your time.",
  "room:album-wall":
    "This is the album wall. Open any cover and press play: the song takes over the room.",
  "room:listening-room":
    "The listening room. Put a record on at the console, then sit back.",
  "room:screening-room":
    "The screening room. The visualizer for Late Bloom is playing. Turn the sound on from its panel.",
  "room:influences":
    "These are the paintings that sat next to the synth while the record was made. On your way out, sign the guestbook.",
  "art:hero-midnight-static":
    "Midnight Static came out of a broken radio left on overnight. The static under the music became the music.",
  "obj:listening-station":
    "Pick any record from the list. It plays through the whole room, and the platter spins while it does.",
};

async function voice(text) {
  const res = await fetch(`${base}/api/narration/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId: "21m00Tcm4TlvDq8ikWAM" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error ?? `narration failed (${res.status})`);
  return { text, audioUrl: data.url, voiceId: data.voiceId, voiceName: data.voiceName, source: "elevenlabs" };
}

async function main() {
  if (withVoices) {
    console.log("Generating voiceovers with ElevenLabs…");
    for (const [key, text] of Object.entries(SCRIPTS)) {
      const [kind, id] = key.split(":");
      try {
        const vo = await voice(text);
        if (kind === "room") rooms.find((r) => r.id === id).narration = vo;
        if (kind === "art") artworks.find((a) => a.id === id).voiceOver = vo;
        if (kind === "obj") objects.find((o) => o.id === id).voiceOver = vo;
        console.log(`  ✓ ${key}`);
      } catch (e) {
        console.log(`  ✗ ${key}: ${e.message} (continuing without it)`);
      }
    }
  }
  const res = await fetch(`${base}/api/galleries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gallery),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Publish failed:", res.status, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log(`\nShowcase published to ${base}`);
  console.log(`  View: ${base}${data.viewUrl}`);
  console.log(`  Edit: ${base}${data.editUrl}   (private: carries the edit key)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
