import { spawn } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { ffmpegPath } from "./encode.ts";
import { expected } from "./types.ts";
import type { Clip, ClipInput, Config, Footage, FootageInput } from "./types.ts";

/**
 * Footage: recorded video, cut into a frame sequence a stage can show.
 *
 * A screen recording, a product walkthrough, a clip from a phone — anything
 * that already exists as video — goes into a film through here. The edit list
 * in the config (trims, speed changes, freezes, title colours and stills, and
 * transitions between them) is conformed by ffmpeg into one JPEG per frame at
 * the film's rate and size, plus footage.json saying where each clip landed.
 *
 * Why frames and not a <video> on the stage: seekreel renders every frame in a
 * fresh document, and headless Chromium reports a seek as finished before the
 * decoded picture is painted, so a seeked <video> shows the right frame only
 * most of the time — measured, not guessed. Open-source Chromium cannot decode
 * H.264 at all. An <img> of frame N is exact by construction, and it is the
 * same contract as everything else here: the page draws whatever t asks for.
 */

/** ffmpeg's xfade transitions, as of ffmpeg 6. `cut` means none. */
export const TRANSITIONS = [
  "cut", "fade", "fadeblack", "fadewhite", "fadegrays", "dissolve", "pixelize",
  "wipeleft", "wiperight", "wipeup", "wipedown",
  "slideleft", "slideright", "slideup", "slidedown",
  "smoothleft", "smoothright", "smoothup", "smoothdown",
  "circleopen", "circleclose", "circlecrop", "rectcrop", "radial", "zoomin",
  "hlslice", "hrslice", "vuslice", "vdslice", "hblur", "squeezeh", "squeezev",
  "diagtl", "diagtr", "diagbl", "diagbr", "distance",
];

function fail(message: string): never {
  throw expected(message);
}

export function normalizeFootage(root: string, input: FootageInput): Footage {
  if (!input || !Array.isArray(input.clips) || input.clips.length === 0) {
    fail("footage.clips must be a non-empty array");
  }
  const fit = input.fit ?? "cover";
  if (fit !== "cover" && fit !== "contain") fail(`footage.fit must be cover or contain, got ${JSON.stringify(fit)}`);
  const quality = input.quality ?? 3;
  if (!(quality >= 2 && quality <= 31)) fail("footage.quality must be between 2 (best) and 31");

  const clips = input.clips.map((clip: ClipInput, index): Clip => {
    const where = `footage clip ${index}${clip.label ? ` ("${clip.label}")` : ""}`;
    const kinds = [clip.src, clip.still, clip.color].filter((v) => v != null).length;
    if (kinds !== 1) fail(`${where}: give exactly one of src, still or color`);
    const kind = clip.src != null ? "video" : clip.still != null ? "still" : "color";
    if (kind !== "video" && !(clip.duration! > 0)) fail(`${where}: a ${kind} clip needs a positive duration`);

    const speed = clip.speed ?? 1;
    if (!(speed > 0)) fail(`${where}: speed must be positive`);
    const from = clip.from ?? 0;
    if (clip.to != null && !(clip.to > from)) fail(`${where}: to must be after from`);

    const raw = typeof clip.transition === "string" ? { type: clip.transition } : clip.transition;
    const type = raw?.type ?? "cut";
    if (!TRANSITIONS.includes(type)) {
      fail(`${where}: unknown transition "${type}". Known: ${TRANSITIONS.join(", ")}`);
    }
    const duration = type === "cut" ? 0 : (raw?.duration ?? 0.5);
    if (index === 0 && duration > 0) fail(`${where}: the first clip has nothing to transition from`);

    return {
      index,
      label: clip.label ?? `clip${index}`,
      kind,
      source: kind === "color" ? clip.color! : path.resolve(root, (clip.src ?? clip.still)!),
      from,
      to: clip.to ?? null,
      speed,
      hold: clip.hold ?? 0,
      duration: clip.duration ?? null,
      transition: { type, duration },
    };
  });

  return { dir: path.resolve(root, input.out ?? "footage"), fit, quality, clips };
}

/** Run ffmpeg and hand back its stderr, which is where it reports frame counts. */
function ffmpeg(args: string[]): Promise<string> {
  const bin = ffmpegPath();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ["-hide_banner", "-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error: Error) =>
      reject(expected(`Could not run ffmpeg (${bin}): ${error.message}. Set FFMPEG=/path/to/ffmpeg.`)),
    );
    child.on("close", (code) =>
      code === 0 ? resolve(stderr) : reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`)),
    );
  });
}

function fitFilter(config: Config, fit: "cover" | "contain"): string {
  const { width: w, height: h } = config;
  return fit === "cover"
    ? `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`
    : `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${config.background}`;
}

export interface FootageClipResult {
  index: number;
  label: string;
  kind: Clip["kind"];
  /** Where the clip sits in the film, seconds. Overlaps the clip before it by its transition. */
  start: number;
  end: number;
  from: number;
  to: number | null;
  speed: number;
  hold: number;
  transition: { type: string; duration: number };
}

export interface FootageResult {
  fps: number;
  width: number;
  height: number;
  frames: number;
  duration: number;
  clips: FootageClipResult[];
}

/**
 * Conform every clip, then join them.
 *
 * Two passes, because a transition has to know where the clip before it ends
 * and a screen recording often does not say how long it is (Playwright's WebM
 * has no duration in its header). Pass one turns each clip into an
 * intra-frame intermediate at the film's rate and size and counts its frames;
 * pass two chains xfade and concat over those, with offsets that are exact.
 */
export async function cutFootage(
  config: Config,
  { onClip }: { onClip?: (clip: FootageClipResult) => void } = {},
): Promise<FootageResult> {
  const footage = config.footage;
  if (!footage) fail("This config has no footage section.");
  const { fps } = config;
  const work = path.join(footage.dir, "clips");
  await rm(work, { recursive: true, force: true });
  await mkdir(work, { recursive: true });

  const lengths: number[] = [];
  for (const clip of footage.clips) {
    const file = path.join(work, `${String(clip.index).padStart(3, "0")}.mkv`);
    const shape = `${fitFilter(config, footage.fit)},setsar=1,format=yuv420p`;
    const hold = clip.hold > 0 ? `,tpad=stop_mode=clone:stop_duration=${clip.hold}` : "";
    let args: string[];
    if (clip.kind === "video") {
      const trim = `trim=start=${clip.from}${clip.to != null ? `:end=${clip.to}` : ""}`;
      args = ["-i", clip.source, "-vf", `${trim},setpts=(PTS-STARTPTS)/${clip.speed},fps=${fps},${shape}${hold}`];
    } else if (clip.kind === "still") {
      args = ["-loop", "1", "-framerate", String(fps), "-t", String(clip.duration), "-i", clip.source, "-vf", `fps=${fps},${shape}${hold}`];
    } else {
      args = ["-f", "lavfi", "-i", `color=c=${clip.source}:s=${config.width}x${config.height}:r=${fps}:d=${clip.duration}`, "-vf", `${shape}${hold}`];
    }
    const log = await ffmpeg([...args, "-an", "-c:v", "mjpeg", "-q:v", "2", file]);
    const counted = [...log.matchAll(/frame=\s*(\d+)/g)].at(-1);
    const frames = counted ? Number(counted[1]) : 0;
    if (!frames) fail(`footage clip ${clip.index} ("${clip.label}") came out empty — check its from/to against the source`);
    lengths.push(frames / fps);
  }

  // Pass two: one graph over every intermediate.
  const inputs = footage.clips.flatMap((clip) => ["-i", path.join(work, `${String(clip.index).padStart(3, "0")}.mkv`)]);
  // Every stream gets the same timebase and pixel format: xfade refuses to
  // join two inputs that disagree, and concat's output does not match its input.
  const norm = `settb=AVTB,fps=${fps},format=yuv420p`;
  const graph: string[] = footage.clips.map((_, i) => `[${i}:v]${norm}[s${i}]`);
  const placed: FootageClipResult[] = [];
  let label = "[s0]";
  let length = lengths[0];
  placed.push(result(footage.clips[0], 0, lengths[0]));

  for (let i = 1; i < footage.clips.length; i++) {
    const clip = footage.clips[i];
    // A transition cannot be longer than either side of it.
    const overlap = Math.min(clip.transition.duration, length - 1 / fps, lengths[i] - 1 / fps);
    const next = `[x${i}]`;
    if (overlap <= 0) {
      graph.push(`${label}[s${i}]concat=n=2:v=1:a=0,${norm}${next}`);
      placed.push(result(clip, length, length + lengths[i]));
      length += lengths[i];
    } else {
      const offset = length - overlap;
      graph.push(
        `${label}[s${i}]xfade=transition=${clip.transition.type}:duration=${overlap.toFixed(4)}:offset=${offset.toFixed(4)},${norm}${next}`,
      );
      placed.push(result(clip, offset, offset + lengths[i], overlap));
      length = offset + lengths[i];
    }
    label = next;
  }

  const framesDir = path.join(footage.dir, "frames");
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });
  const map = ["-filter_complex", graph.join(";"), "-map", label];
  await ffmpeg([...inputs, ...map, "-fps_mode", "passthrough", "-q:v", String(footage.quality), "-start_number", "0", path.join(framesDir, "%05d.jpg")]);
  await rm(work, { recursive: true, force: true });

  const frames = (await readdir(framesDir)).filter((f) => f.endsWith(".jpg")).length;
  const out: FootageResult = {
    fps,
    width: config.width,
    height: config.height,
    frames,
    duration: frames / fps,
    clips: placed,
  };
  await writeFile(path.join(footage.dir, "footage.json"), JSON.stringify(out, null, 2) + "\n");
  for (const clip of placed) onClip?.(clip);
  return out;

  function result(clip: Clip, start: number, end: number, overlap = 0): FootageClipResult {
    return {
      index: clip.index,
      label: clip.label,
      kind: clip.kind,
      start: round(start),
      end: round(end),
      from: clip.from,
      to: clip.to,
      speed: clip.speed,
      hold: clip.hold,
      transition: { type: clip.transition.type, duration: round(overlap) },
    };
  }
}

const round = (n: number) => Math.round(n * 10000) / 10000;
