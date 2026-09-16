/**
 * Output formats and frame geometry.
 *
 * A variant says what it wants — an aspect ratio, a size, a frame rate, a
 * container — and this module turns that into ffmpeg arguments. Ratios are
 * resolved against the rendered frame rather than written out as filter
 * strings by hand, because "9:16" is the thing anyone actually means and
 * `scale=1080:1920,pad=1080:1920:0:420` is how they used to have to say it.
 */

import type { Config, Format, FormatName, Size, Variant } from "./types.ts";

/**
 * One entry per container we can write. `video` and `audio` take the resolved
 * config so a format can honour crf/preset without every format sharing the
 * same knobs — VP9 reads crf the same way x264 does, ProRes ignores it.
 */
export const FORMATS: Record<FormatName, Format> = {
  mp4: {
    ext: "mp4",
    encoder: "libx264",
    audio: true,
    /*
     * yuv420p and High profile because that is what every player and every
     * feed accepts; `+faststart` puts the moov atom at the front so a browser
     * can start playing before the file has finished arriving.
     */
    video: (config: Config) => [
      "-c:v", "libx264",
      "-preset", config.encode.preset,
      "-crf", String(config.encode.crf),
      "-pix_fmt", "yuv420p",
      "-profile:v", "high",
      "-level", "4.0",
      "-x264-params", `keyint=${config.encode.keyint}:min-keyint=${config.fps}:scenecut=0`,
      "-movflags", "+faststart",
    ],
    audioArgs: (config: Config) => [
      "-c:a", "aac", "-b:a", config.encode.audioBitrate, "-ar", "48000", "-ac", "2",
    ],
  },

  webm: {
    ext: "webm",
    encoder: "libvpx-vp9",
    audio: true,
    /* VP9's constant-quality mode is crf with the bitrate pinned to zero. */
    video: (config: Config) => [
      "-c:v", "libvpx-vp9",
      "-crf", String(config.encode.crf),
      "-b:v", "0",
      "-row-mt", "1",
      "-pix_fmt", "yuv420p",
      "-g", String(config.encode.keyint),
    ],
    audioArgs: (config: Config) => ["-c:a", "libopus", "-b:a", config.encode.audioBitrate],
  },

  mov: {
    ext: "mov",
    encoder: "prores_ks",
    audio: true,
    /* ProRes 422 HQ and uncompressed audio: this one is for an edit timeline,
       not for a feed, so it trades size for a file an NLE is happy with. */
    video: () => [
      "-c:v", "prores_ks",
      "-profile:v", "3",
      "-pix_fmt", "yuv422p10le",
    ],
    audioArgs: () => ["-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2"],
  },

  gif: {
    ext: "gif",
    encoder: "gif",
    audio: false,
    /* Handled by its own two-pass palette path in encode.js; a single-pass
       gif quantises to the default 216-colour web palette and looks it. */
    video: () => [],
    audioArgs: () => [],
  },
};

export const FORMAT_NAMES = Object.keys(FORMATS) as FormatName[];

export function isFormatName(name: string): name is FormatName {
  return Object.hasOwn(FORMATS, name);
}

/** Even dimensions only: H.264 cannot encode an odd one, and VP9 dislikes it. */
const even = (n: number): number => Math.max(2, Math.round(n / 2) * 2);

/**
 * Parse "9:16" (or "9x16") into a number. Returns null for anything else so
 * the caller can report the variant it came from.
 */
export function parseRatio(ratio: unknown): number | null {
  if (typeof ratio !== "string") return null;
  const match = ratio.trim().match(/^(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)$/i);
  if (!match) return null;
  const [w, h] = [Number(match[1]), Number(match[2])];
  if (!(w > 0) || !(h > 0)) return null;
  return w / h;
}

/** Parse "1080x1920" into {width, height}, or null. */
export function parseSize(size: unknown): Size | null {
  if (typeof size !== "string") return null;
  const match = size.trim().match(/^(\d+)\s*[x×]\s*(\d+)$/i);
  if (!match) return null;
  return { width: even(Number(match[1])), height: even(Number(match[2])) };
}

/**
 * The output box for a variant.
 *
 * A ratio keeps the rendered frame's longest side and grows the other one, so
 * a 1080×1080 render becomes 1080×1920 at 9:16 rather than being scaled down
 * to 608×1080 — the canvas changes shape, the picture does not shrink.
 */
export function outputSize(config: Config, variant: Variant): Size {
  if (variant.size) return variant.size;
  if (variant.ratio == null) return { width: config.width, height: config.height };

  const source = config.width / config.height;
  return variant.ratio > source
    ? { width: even(config.height * variant.ratio), height: even(config.height) }
    : { width: even(config.width), height: even(config.width / variant.ratio) };
}

/**
 * Video filters for a variant, in order.
 *
 * `fit: "contain"` (the default) never crops: the frame is scaled to fit and
 * the rest is padded with `background`. `fit: "cover"` fills the box and cuts
 * what hangs over. Raw `scale`/`pad` strings still win if a config has them,
 * because they were the only way to do this before and configs in the wild
 * use them.
 */
export function videoFilters(config: Config, variant: Variant): string[] {
  const filters: string[] = [];

  if (variant.scale || variant.pad) {
    if (variant.scale) filters.push(`scale=${variant.scale}`);
    if (variant.pad) filters.push(`pad=${variant.pad}`);
  } else {
    const { width, height } = outputSize(config, variant);
    if (width !== config.width || height !== config.height) {
      if (variant.fit === "cover") {
        filters.push(`scale=${width}:${height}:force_original_aspect_ratio=increase`);
        filters.push(`crop=${width}:${height}`);
      } else {
        filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
        filters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${variant.background}`);
      }
    }
  }

  if (variant.fps && variant.fps !== config.fps) filters.push(`fps=${variant.fps}`);
  return filters;
}
