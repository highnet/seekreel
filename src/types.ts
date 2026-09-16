/**
 * The shapes the tool passes around.
 *
 * These are the contract between the four halves of seekreel — config, render,
 * audio, encode — and they are written down here rather than inferred so that
 * changing the config format is a compile error in every place that reads it,
 * not a surprise twenty minutes into a render.
 */

/** Containers seekreel can write. Each one is a key of FORMATS in formats.ts. */
export type FormatName = "mp4" | "webm" | "mov" | "gif";

export interface Size {
  width: number;
  height: number;
}

export interface EncodeSettings {
  crf: number;
  preset: string;
  audioBitrate: string;
  /** Keyframe interval, in frames. */
  keyint: number;
  /** Palette size for gif variants. */
  gifColors: number;
}

/** A variant as written in a config file: everything optional but the intent. */
export interface VariantInput {
  name?: string;
  format?: FormatName;
  ratio?: string;
  size?: string;
  fit?: "contain" | "cover";
  audio?: boolean;
  fps?: number;
  background?: string;
  /** Raw ffmpeg filter strings, from before ratio/size existed. */
  scale?: string;
  pad?: string;
}

/** A variant after loadConfig has filled in the defaults and rejected mistakes. */
export interface Variant {
  name: string;
  format: FormatName;
  /** Width over height, or null to keep the render's own shape. */
  ratio: number | null;
  size: Size | null;
  fit: "contain" | "cover";
  audio: boolean;
  fps: number | null;
  background: string;
  scale: string | null;
  pad: string | null;
}

/** A JSON cue sheet, rendered by python. */
export interface CuesAudio {
  engine: "cues";
  /** Absolute path to the WAV this engine writes. */
  wav: string;
  cues: string;
}

/** A Strudel pattern, rendered offline in Chromium. */
export interface StrudelAudio {
  engine: "strudel";
  wav: string;
  pattern: string;
  /** The Strudel bundle, fetched into the project by `seekreel strudel`. */
  bundle: string;
  /** Cycles per second: the only number tying the pattern's grid to seconds. */
  cps: number;
  sampleRate: number;
  /** Normalisation target, 0 to 1. */
  peak: number;
  fadeIn: number;
  fadeOut: number;
  /** Seeds the noise voices, so two renders of one pattern are one WAV. */
  seed: number;
}

export type AudioConfig = CuesAudio | StrudelAudio;

/** A config file as written, before defaults and resolution. */
export interface ConfigInput {
  name?: string;
  stage?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  out?: string;
  probe?: string;
  deliver?: string;
  readySelector?: string;
  frameTimeoutMs?: number;
  audio?: (Partial<CuesAudio> & Partial<StrudelAudio> & { engine?: string }) | null;
  background?: string;
  variants?: VariantInput[];
  encode?: Partial<EncodeSettings>;
  poster?: number | null;
  /** WebGL takes a moment to hand over a painted frame; see render.ts. */
  webgl?: boolean;
}

/** A config after loadConfig: every path absolute, every default filled in. */
export interface Config {
  name: string;
  stage: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  out: string;
  probe: string;
  deliver: string;
  readySelector: string;
  frameTimeoutMs: number;
  audio: AudioConfig | null;
  background: string;
  variants: Variant[];
  encode: EncodeSettings;
  poster: number | null;
  webgl: boolean;

  /** The directory the config file lives in. Every path resolves against it. */
  root: string;
  file: string;
  frames: number;
  stagePath: string;
  outDir: string;
  probeDir: string;
  deliverDir: string;
}

export interface Format {
  ext: string;
  /** The ffmpeg encoder name, used to check whether this build can write it. */
  encoder: string;
  audio: boolean;
  video: (config: Config) => string[];
  audioArgs: (config: Config) => string[];
}

/**
 * An error the user can fix — a bad config, a missing file, a pattern that will
 * not evaluate. These print as a message; anything else prints as a stack,
 * because anything else is this tool's bug.
 */
export interface ExpectedError extends Error {
  expected: true;
}

export function expected(message: string): ExpectedError {
  return Object.assign(new Error(message), { expected: true as const });
}
