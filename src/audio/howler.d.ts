declare module "howler" {
  export interface HowlOptions {
    src: string[];
    loop?: boolean;
    volume?: number;
    html5?: boolean;
    preload?: boolean;
  }

  export class Howl {
    constructor(options: HowlOptions);
    play(): number;
    stop(): void;
    unload(): void;
    fade(from: number, to: number, durationMs: number): void;
    volume(value?: number): number;
    playing(): boolean;
    on(event: string, callback: () => void): void;
    once(event: string, callback: () => void): void;
    /** Current position (s); with a value, seeks (queued until loaded). */
    seek(position?: number): number;
    duration(): number;
  }

  export const Howler: {
    volume(value?: number): number;
    mute(muted: boolean): void;
    ctx?: AudioContext;
  };
}
