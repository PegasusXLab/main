export interface ElevenLabsVoiceOption {
  id: string;
  name: string;
  persona: string;
  description: string;
  category: "curated" | "custom";
}

/** Curated preset voices tailored to art galleries, exhibitions, and museum docents. */
export const CURATED_VOICES: ElevenLabsVoiceOption[] = [
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "Marcus",
    persona: "The Classical Historian",
    description: "Deep, scholarly, British cadence — authoritative and measured.",
    category: "curated",
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    persona: "The Contemporary Curator",
    description: "Poised, elegant, clear — sophisticated contemporary gallery tone.",
    category: "curated",
  },
  {
    id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    persona: "The Evocative Storyteller",
    description: "Rich, resonant, expressive — dramatic narratives and lore.",
    category: "curated",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    persona: "The Meditative Docent",
    description: "Gentle, serene, whisper-soft — introspective and calm.",
    category: "curated",
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    name: "Liam",
    persona: "The Modern Critic",
    description: "Articulate, engaging, direct — modern museum audio guide.",
    category: "curated",
  },
];

export const DEFAULT_VOICE = CURATED_VOICES[1]; // Rachel
