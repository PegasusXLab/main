// The landing conveyor's artworks (T-129, T-148): public-domain paintings from The Metropolitan
// Museum of Art Open Access (CC0). Titles, artists, dates and media match the Met Collection API
// (collectionapi.metmuseum.org/public/collection/v1/objects/<metId>). Each "Did you know?" fact is
// written in our own words from the Met source linked next to it. Credits: public/landing/CREDITS.md.

export interface ShowcaseArt {
  title: string;
  artist: string;
  date: string;
  medium: string;
  metId: number;
  /** Conveyor image (small, loaded with the page). */
  small: string;
  /** Lightbox image (~1600 px WebP), loaded only when the lightbox opens. */
  large: string;
  alt: string;
  /** One or two sentences, at most 240 characters. */
  fact: string;
  /** The Met page the fact comes from. */
  factSource: string;
  metUrl: string;
  /** Frame size on the conveyor. */
  frameClassName: string;
}

const met = (id: number) =>
  `https://www.metmuseum.org/art/collection/search/${id}`;

export const SHOWCASE_ART: readonly ShowcaseArt[] = [
  {
    title: "Study of a Young Woman",
    artist: "Johannes Vermeer",
    date: "ca. 1665–67",
    medium: "Oil on canvas",
    metId: 437879,
    small: "/landing/pearl-earring.jpg",
    large: "/landing/large/study-young-woman.webp",
    alt: "A young woman in a pale blue wrap looks back over her shoulder against a dark background.",
    fact: "Not a commissioned portrait but a tronie: a study of an intriguing face, often in fanciful dress. It is a close cousin of Vermeer's Girl with a Pearl Earring in The Hague.",
    factSource: met(437879),
    metUrl: met(437879),
    frameClassName: "h-40 w-28",
  },
  {
    title: "Water Lilies",
    artist: "Helena de Kay",
    date: "ca. 1870–77",
    medium: "Oil on canvas",
    metId: 899646,
    small: "/landing/water-lilies.jpg",
    large: "/landing/large/water-lilies.webp",
    alt: "White water lilies with yellow centers float on dark water, painted in loose strokes.",
    fact: "De Kay studied with Winslow Homer and John La Farge and co-founded the Art Students League and the Society of American Artists. This loose study echoes La Farge's flower paintings of the 1860s.",
    factSource: met(899646),
    metUrl: met(899646),
    frameClassName: "h-28 w-44",
  },
  {
    title: "Under the Wave off Kanagawa (The Great Wave)",
    artist: "Katsushika Hokusai",
    date: "ca. 1830–32",
    medium: "Woodblock print; ink and color on paper",
    metId: 45434,
    small: "/landing/great-wave.jpg",
    large: "/landing/large/great-wave.webp",
    alt: "A huge blue wave curls over three boats, with snow-capped Mount Fuji small in the distance.",
    fact: "The printers layered imported Prussian blue with traditional indigo to deepen the wave without dulling it. The Met's sheet is probably one of the earliest impressions ever printed.",
    factSource: "https://www.metmuseum.org/essays/hokusai-great-wave",
    metUrl: met(45434),
    frameClassName: "h-36 w-36",
  },
  {
    title: "The Harvesters",
    artist: "Pieter Bruegel the Elder",
    date: "1565",
    medium: "Oil on wood",
    metId: 435809,
    small: "/landing/harvesters.jpg",
    large: "/landing/large/harvesters.webp",
    alt: "Peasants cut and stack golden wheat and rest under a pear tree, above a wide summer valley.",
    fact: "One of six paintings of the times of the year made for an Antwerp merchant's country house. Five survive, and this is the only one in the United States.",
    factSource:
      "https://archived.metmuseum.org/art/online-features/metkids/explore/435809/Pieter-Bruegel-the-Elder-The-Harvesters",
    metUrl: met(435809),
    frameClassName: "h-32 w-52",
  },
  {
    title: "Self-Portrait",
    artist: "Rembrandt van Rijn",
    date: "1660",
    medium: "Oil on canvas",
    metId: 437397,
    small: "/landing/self-portrait.jpg",
    large: "/landing/large/self-portrait.webp",
    alt: "Rembrandt, in a black beret and brown coat, looks out from a dim background.",
    fact: "Painted at 54, a few years after he was forced into bankruptcy. Rembrandt left every sign of age in place, building up thick paint around his brow, eyes and chin.",
    factSource: met(437397),
    metUrl: met(437397),
    frameClassName: "h-40 w-28",
  },
  {
    title: "Sunflowers",
    artist: "Vincent van Gogh",
    date: "1887",
    medium: "Oil on canvas",
    metId: 436524,
    small: "/landing/sunflowers.jpg",
    large: "/landing/large/sunflowers.webp",
    alt: "Two cut sunflower heads lie on a blue ground, painted in thick, swirling strokes.",
    fact: "One of four sunflower still lifes painted in Paris in 1887. Paul Gauguin owned two of them and hung them above his bed, then sold them to pay for his trip to the South Seas.",
    factSource: met(436524),
    metUrl: met(436524),
    frameClassName: "h-28 w-48",
  },
];
