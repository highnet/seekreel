import { spawn } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { variantFile } from "./config.js";
import { FORMATS, videoFilters } from "./formats.js";

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

/**
 * Which formats this ffmpeg can actually write.
 *
 * libx264 is the one that matters — it is what `mp4` needs and what some
 * distro builds leave out — but a config asking for webm on a build without
 * VP9 deserves the same warning before the render, not after it.
 */
export async function checkEncoder() {
  const bin = ffmpegPath();
  return new Promise((resolve) => {
    const child = spawn(bin, ["-hide_banner", "-encoders"]);
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += chunk;
    });
    child.on("error", () => resolve({ ok: false, bin, reason: "not found", formats: {} }));
    child.on("close", () => {
      const formats = Object.fromEntries(
        Object.entries(FORMATS).map(([name, format]) => [
          name,
          new RegExp(`\\b${format.encoder}\\b`).test(out),
        ]),
      );
      resolve(
        formats.mp4
          ? { ok: true, bin, formats }
          : { ok: false, bin, reason: "this build has no libx264", formats },
      );
    });
  });
}

/**
 * Frames (plus a soundtrack, if there is one) into one file per variant.
 *
 * Each variant carries its own container, aspect ratio, size and frame rate;
 * the arguments for those live in formats.js so this stays the loop that runs
 * them rather than a switch over every codec.
 */
export async function encode(config, { onVariant } = {}) {
  const bin = ffmpegPath();
  await mkdir(config.deliverDir, { recursive: true });

  const frames = (await readdir(config.outDir)).filter((f) => f.endsWith(".png")).sort();
  if (frames.length === 0) {
    throw Object.assign(new Error(`There are no frames in ${config.outDir} yet — run \`seekreel render\` first.`), {
      expected: true,
    });
  }
  const pattern = path.join(config.outDir, `%0${frames[0].length - 4}d.png`);

  const written = [];
  for (const variant of config.variants) {
    const file = variantFile(config, variant);
    const format = FORMATS[variant.format];
    const wantsAudio = variant.audio && Boolean(config.audio);
    const filters = videoFilters(config, variant);

    const args = ["-y", "-hide_banner", "-loglevel", "error"];
    args.push("-framerate", String(config.fps), "-i", pattern);
    if (wantsAudio) args.push("-i", config.audio.wav, "-shortest");

    if (variant.format === "gif") {
      /*
       * Two passes in one graph: build a palette from the whole clip, then map
       * the frames onto it. A single pass falls back to the 216-colour web
       * palette, which turns any gradient into bands.
       */
      const chain = filters.length ? `${filters.join(",")},` : "";
      args.push(
        "-filter_complex",
        `${chain}split[a][b];[a]palettegen=max_colors=${config.encode.gifColors}:stats_mode=diff[p];` +
          `[b][p]paletteuse=dither=bayer:bayer_scale=3`,
        "-loop", "0",
      );
    } else {
      if (filters.length) args.push("-vf", filters.join(","));
      args.push(...format.video(config));
      if (wantsAudio) args.push(...format.audioArgs(config));
      else args.push("-an");
    }

    args.push(file);

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
