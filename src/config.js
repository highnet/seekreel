import { readFile } from "node:fs/promises";
import path from "node:path";

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
  variants: [{ name: "", scale: null, pad: null, audio: true }],
  encode: {
    crf: 18,
    preset: "slow",
    audioBitrate: "160k",
    /** Exactly two seconds of keyframes at 24fps, so scrubbing stays sane. */
    keyint: 48,
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

  config.name = parsed.name ?? path.basename(root);
  return config;
}

/** What a variant's file is called: `<name>.mp4`, or `<name>-<variant>.mp4`. */
export function variantFile(config, variant) {
  const suffix = variant.name ? `-${variant.name}` : "";
  return path.join(config.deliverDir, `${config.name}${suffix}.mp4`);
}
