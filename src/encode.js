import { spawn } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { variantFile } from "./config.js";

const require = createRequire(import.meta.url);

/**
 * Where ffmpeg is.
 *
 * `ffmpeg-static` is an optional dependency rather than a hard one: it is a
 * 70MB download, and a machine that already has ffmpeg does not need a second
 * copy. Needs libx264, which the static build has and some distro builds do
 * not — hence the check below rather than a confusing failure at encode time.
 */
export function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    return require("ffmpeg-static");
  } catch {
    return "ffmpeg";
  }
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stdout.on("data", () => {});
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) =>
      reject(
        Object.assign(
          new Error(
            `Could not run ffmpeg (${bin}): ${error.message}\n` +
              `Install it, or set FFMPEG=/path/to/ffmpeg.`,
          ),
          { expected: true },
        ),
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`)),
    );
  });
}

export async function checkEncoder() {
  const bin = ffmpegPath();
  return new Promise((resolve) => {
    const child = spawn(bin, ["-hide_banner", "-encoders"]);
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += chunk;
    });
    child.on("error", () => resolve({ ok: false, bin, reason: "not found" }));
    child.on("close", () =>
      resolve(
        /\blibx264\b/.test(out)
          ? { ok: true, bin }
          : { ok: false, bin, reason: "this build has no libx264" },
      ),
    );
  });
}

/**
 * Frames (plus a soundtrack, if there is one) into one MP4 per variant.
 *
 * yuv420p and High profile because that is what every player and every feed
 * accepts; `+faststart` so the moov atom is at the front and a browser can
 * begin playing before the file has finished arriving.
 */
export async function encode(config, { onVariant } = {}) {
  const bin = ffmpegPath();
  await mkdir(config.deliverDir, { recursive: true });

  const frames = (await readdir(config.outDir)).filter((f) => f.endsWith(".png")).sort();
  if (frames.length === 0) {
    throw Object.assign(new Error(`No frames in ${config.outDir}. Render first.`), {
      expected: true,
    });
  }
  const pattern = path.join(config.outDir, `%0${frames[0].length - 4}d.png`);

  const written = [];
  for (const variant of config.variants) {
    const file = variantFile(config, variant);
    const wantsAudio = variant.audio !== false && Boolean(config.audio);

    const filters = [];
    if (variant.scale) filters.push(`scale=${variant.scale}`);
    if (variant.pad) filters.push(`pad=${variant.pad}`);

    const args = ["-y", "-hide_banner", "-loglevel", "error"];
    args.push("-framerate", String(config.fps), "-i", pattern);
    if (wantsAudio) args.push("-i", config.audio.wav, "-shortest");
    if (filters.length) args.push("-vf", filters.join(","));
    args.push(
      "-c:v", "libx264",
      "-preset", config.encode.preset,
      "-crf", String(config.encode.crf),
      "-pix_fmt", "yuv420p",
      "-profile:v", "high",
      "-level", "4.0",
      "-x264-params", `keyint=${config.encode.keyint}:min-keyint=${config.fps}:scenecut=0`,
    );
    if (wantsAudio) {
      args.push("-c:a", "aac", "-b:a", config.encode.audioBitrate, "-ar", "48000", "-ac", "2");
    } else {
      args.push("-an");
    }
    args.push("-movflags", "+faststart", file);

    await run(bin, args);
    written.push(file);
    if (onVariant) onVariant(file);
  }

  if (config.poster != null) {
    const index = Math.min(frames.length - 1, Math.round(config.poster * config.fps));
    const poster = path.join(config.deliverDir, `${config.name}-poster.png`);
    await run(bin, [
      "-y", "-hide_banner", "-loglevel", "error",
      "-i", path.join(config.outDir, frames[index]),
      poster,
    ]);
    written.push(poster);
  }

  return written;
}
