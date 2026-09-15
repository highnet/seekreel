import { readFile } from "node:fs/promises";
import path from "node:path";
import { FORMATS, FORMAT_NAMES, parseRatio, parseSize } from "./formats.js";

/**
 * A project's config, resolved against the directory the file lives in.
 *
 * Every path in a config is relative to the config file rather than to the
 * working directory, so `seekreel build -c examples/thing/seekreel.config.json`
 * does the same thing from anywhere in the tree.
 */
const DEFAULTS = {
  stage: "stage.html",
  duration: 10,
  fps: 24,
  width: 1080,
  height: 1080,
  out: "out",
  probe: "probe",
  deliver: "deliver",
  /*
   * The stage says when a frame is final by stamping this on the document.
   * Both spellings are accepted so a page written before the tool was named
   * still renders.
   */
  readySelector: "html[data-seekreel-ready], html[data-ready]",
  /** Seconds to allow one frame. A frame that needs longer is a bug worth seeing. */
  frameTimeoutMs: 30_000,
  audio: null,
  /** Padding colour for a variant whose ratio does not match the render. */
  background: "black",
  variants: [{ name: "" }],
  encode: {
    crf: 18,
    preset: "slow",
    audioBitrate: "160k",
    /** Exactly two seconds of keyframes at 24fps, so scrubbing stays sane. */
    keyint: 48,
    /** Palette size for gif variants. 128 keeps gradients smooth at half the weight of 256. */
    gifColors: 128,
  },
  poster: null,
};

function fail(message) {
  const error = new Error(message);
  error.expected = true;
  throw error;
}

export async function loadConfig(configPath) {
  const file = path.resolve(configPath);
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    fail(`No config at ${file}. Run \`seekreel init\` to make one.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`${file} is not valid JSON: ${error.message}`);
  }

  const root = path.dirname(file);
  const config = {
    ...DEFAULTS,
    ...parsed,
    encode: { ...DEFAULTS.encode, ...(parsed.encode ?? {}) },
    root,
    file,
  };

  if (!(config.duration > 0)) fail(`duration must be a positive number of seconds`);
  if (!(config.fps > 0)) fail(`fps must be positive`);
  if (config.width % 2 || config.height % 2) {
    fail(`width and height must both be even — H.264 cannot encode an odd dimension`);
  }

  config.frames = Math.round(config.duration * config.fps);
  config.stagePath = path.resolve(root, config.stage);
  config.outDir = path.resolve(root, config.out);
  config.probeDir = path.resolve(root, config.probe);
  config.deliverDir = path.resolve(root, config.deliver);

  if (config.audio) {
    config.audio = {
      cues: path.resolve(root, config.audio.cues ?? "cues.json"),
      wav: path.resolve(root, config.audio.wav ?? "soundtrack.wav"),
    };
  }

  if (!Array.isArray(config.variants) || config.variants.length === 0) {
    fail(`variants must be a non-empty array`);
  }
  config.variants = config.variants.map((variant, index) => normalizeVariant(config, variant, index));

  config.name = parsed.name ?? path.basename(root);
  return config;
}

/**
 * Fill in a variant's defaults and reject the mistakes worth catching before a
 * twenty-minute render rather than after it.
 */
function normalizeVariant(config, variant, index) {
  const where = variant.name ? `variant "${variant.name}"` : `variant ${index}`;

  const format = variant.format ?? "mp4";
  if (!FORMATS[format]) {
    fail(`${where}: unknown format "${format}". Known formats: ${FORMAT_NAMES.join(", ")}.`);
  }

  let ratio = null;
  if (variant.ratio != null) {
    ratio = parseRatio(variant.ratio);
    if (ratio == null) fail(`${where}: ratio must look like "9:16", got ${JSON.stringify(variant.ratio)}`);
  }

  let size = null;
  if (variant.size != null) {
    size = parseSize(variant.size);
    if (size == null) fail(`${where}: size must look like "1080x1920", got ${JSON.stringify(variant.size)}`);
  }

  const fit = variant.fit ?? "contain";
  if (fit !== "contain" && fit !== "cover") {
    fail(`${where}: fit must be "contain" or "cover", got ${JSON.stringify(variant.fit)}`);
  }

  if (variant.fps != null && !(variant.fps > 0)) fail(`${where}: fps must be positive`);
  if (variant.fps != null && variant.fps > config.fps) {
    fail(
      `${where}: fps ${variant.fps} is higher than the render's ${config.fps}fps. ` +
      `Frames that were never drawn cannot be invented — raise the top-level fps instead.`,
    );
  }

  /* A silent format has no audio to drop, so `audio: true` on a gif is a
     misunderstanding rather than an error worth stopping the build for. */
  const audio = FORMATS[format].audio ? variant.audio !== false : false;

  return {
    ...variant,
    name: variant.name ?? "",
    format,
    ratio,
    size,
    fit,
    audio,
    fps: variant.fps ?? null,
    background: variant.background ?? config.background,
    scale: variant.scale ?? null,
    pad: variant.pad ?? null,
  };
}

/** What a variant's file is called: `<name>.<ext>`, or `<name>-<variant>.<ext>`. */
export function variantFile(config, variant) {
  const suffix = variant.name ? `-${variant.name}` : "";
  const ext = FORMATS[variant.format ?? "mp4"].ext;
  return path.join(config.deliverDir, `${config.name}${suffix}.${ext}`);
}
