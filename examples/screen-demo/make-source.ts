/**
 * Make the stand-in "screen recording" this example cuts: twelve seconds of
 * ffmpeg's test pattern, which prints a running counter, so you can see
 * exactly which source second each film frame came from.
 *
 *   node examples/screen-demo/make-source.ts
 *
 * In a real project this file is your recording — Playwright's recordVideo,
 * OBS, QuickTime — and nothing else in the example changes.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ffmpegPath } from "../../src/encode.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "recording.webm");
const result = spawnSync(
  ffmpegPath(),
  [
    "-hide_banner", "-loglevel", "error", "-y",
    // testsrc prints its own running counter, so no font is needed.
    "-f", "lavfi", "-i", "testsrc=s=1280x720:r=30:d=12",
    "-c:v", "libvpx-vp9", "-b:v", "1M", out,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(path.relative(process.cwd(), out));
