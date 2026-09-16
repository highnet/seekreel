#!/usr/bin/env node
import { spawn } from "node:child_process";
import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/config.ts";
import type { Config } from "../src/types.ts";
import { expected } from "../src/types.ts";

/*
 * The renderer and the encoder are imported when they are needed, not at
 * start-up, so that `--help`, `init` and `doctor` all work on a checkout with
 * nothing installed — which is exactly the state somebody is in when they need
 * those three.
 */
const renderer = () => import("../src/render.ts");
const encoder = () => import("../src/encode.ts");

const here = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(here, "..");

const USAGE = `seekreel — turn an animated web page into a video, one frame at a time

Commands
  seekreel init [dir]            create a new project from the starter template
  seekreel probe <t,t,...>       render just those timestamps, into probe/
  seekreel render [a] [b]        render every frame, or only frames a..b, in place
  seekreel audio                 render the soundtrack to a WAV file
  seekreel strudel               fetch the Strudel bundle the audio engine needs
  seekreel encode                turn frames (plus the WAV) into deliver/*.mp4
  seekreel build                 audio, then render, then encode
  seekreel doctor                check that Chromium and ffmpeg are available

Options
  -c, --config <path>            which config to use (default: ./seekreel.config.json)

Example
  seekreel init my-film && cd my-film && seekreel build
`;

function arg(argv: string[], ...names: string[]): string | null {
  for (const name of names) {
    const at = argv.indexOf(name);
    if (at !== -1 && argv[at + 1]) return argv[at + 1];
  }
  return null;
}

function python(script: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = process.env.PYTHON ?? "python3";
    const child = spawn(bin, [script, ...args], { stdio: "inherit" });
    child.on("error", (error: Error) =>
      reject(expected(`Could not run ${bin}: ${error.message}. Point PYTHON at a python3 binary.`)),
    );
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${path.basename(script)} exited ${code}`)),
    );
  });
}

const strudelEngine = () => import("../src/audio/strudel.ts");

/*
 * Strudel, pinned. It is an 850KB bundle and it is not a dependency of this
 * package: a project renders against the version it fetched, and upgrading is
 * a decision with an audible result rather than whatever `npm install` brought
 * in this week.
 */
const STRUDEL_VERSION = "1.3.0";
const STRUDEL_URL = `https://cdn.jsdelivr.net/npm/@strudel/web@${STRUDEL_VERSION}/dist/index.mjs`;

async function doStrudelFetch(config: Config): Promise<void> {
  const target =
    config.audio?.engine === "strudel"
      ? config.audio.bundle
      : path.resolve(config.root, "strudel.mjs");

  let body: Buffer;
  try {
    const response = await fetch(STRUDEL_URL);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    body = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw expected(
      `Could not fetch Strudel from ${STRUDEL_URL}: ${(error as Error).message}\n` +
        `Download it by hand and put it at ${target}.`,
    );
  }

  await writeFile(target, body);
  console.log(
    `${path.relative(process.cwd(), target)}  @strudel/web ${STRUDEL_VERSION}  ` +
      `${Math.round(body.length / 1024)}KB`,
  );
}

async function doAudio(config: Config): Promise<void> {
  if (!config.audio) {
    console.log("No audio is configured in this project, so there is nothing to render.");
    return;
  }

  if (config.audio.engine === "strudel") {
    const { renderStrudel } = await strudelEngine();
    const result = await renderStrudel(config);
    console.log(
      `${path.relative(process.cwd(), config.audio.wav)}  ${result.seconds.toFixed(0)}s  ` +
        `${result.events} events  peak ${result.peak.toFixed(3)}`,
    );
    if (result.failures.length) console.warn(`pattern errors:\n  ${result.failures.join("\n  ")}`);
    return;
  }

  await python(path.join(PACKAGE, "src/audio/render.py"), [
    "--cues", config.audio.cues,
    "--out", config.audio.wav,
  ]);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(USAGE);
    return;
  }

  if (command === "init") {
    const target = path.resolve(argv.find((a, i) => i > 0 && !a.startsWith("-")) ?? ".");
    await mkdir(target, { recursive: true });
    const from = path.join(PACKAGE, "templates/starter");
    for (const entry of await readdir(from)) {
      await cp(path.join(from, entry), path.join(target, entry), { recursive: true });
    }
    console.log(
      `Scaffolded into ${target}\n\n  cd ${path.relative(process.cwd(), target) || "."}\n` +
        `  seekreel strudel   # fetch the audio engine's bundle, once\n` +
        `  seekreel build\n\n` +
        `The starter renders sound from music.strudel.js. It also ships cues.json —\n` +
        `set audio.engine to "cues" in the config to use that instead, which needs\n` +
        `python3 rather than the bundle.\n`,
    );
    return;
  }

  if (command === "doctor") {
    const browser = await renderer()
      .then(() => "playwright-core installed")
      .catch(() => "playwright-core is missing — run npm install");
    let ffmpeg = "no ffmpeg found — neither ffmpeg-static nor one on your PATH";
    let formats = null;
    try {
      const { checkEncoder, ffmpegPath } = await encoder();
      const found = await checkEncoder();
      ffmpeg = `${ffmpegPath()} — ${found.ok ? "ok, has libx264" : `found, but not usable: ${found.reason}`}`;
      formats = found.formats;
      if (!found.ok) process.exitCode = 1;
    } catch {
      process.exitCode = 1;
    }
    console.log(`chromium   ${process.env.CHROMIUM ?? "(auto-detected)"} — ${browser}`);
    console.log(`ffmpeg     ${ffmpeg}`);
    console.log(`python     ${process.env.PYTHON ?? "python3"} — only needed for the cues audio engine`);
    console.log(`strudel    the strudel audio engine needs no python — it renders in the same chromium`);
    if (formats) {
      const list = Object.entries(formats)
        .map(([name, ok]) => `${name} ${ok ? "yes" : "NO"}`)
        .join("   ");
      console.log(`formats    ${list}`);
    }
    return;
  }

  const config = await loadConfig(
    arg(argv, "-c", "--config") ?? path.resolve("seekreel.config.json"),
  );

  if (command === "probe") {
    const list = (argv[1] ?? "").split(",").map(Number).filter((n) => !Number.isNaN(n));
    if (list.length === 0) {
      throw expected("This command needs timestamps, for example: seekreel probe 1.2,4.5");
    }
    const result = await (await renderer()).renderFrames(config, { times: list });
    console.log(`${result.written} frame(s) -> ${path.relative(process.cwd(), result.dir)}`);
    if (result.errors.length) console.warn(`page errors:\n  ${result.errors.join("\n  ")}`);
    return;
  }

  if (command === "strudel") return doStrudelFetch(config);

  if (command === "audio") return doAudio(config);

  if (command === "render" || command === "build") {
    if (command === "build") await doAudio(config);
    const numbers = argv.slice(1).filter((a) => /^\d+$/.test(a)).map(Number);
    const [from = null, to = null]: (number | null)[] = numbers;
    const started = Date.now();
    const result = await (await renderer()).renderFrames(config, {
      from, to,
      onProgress: (index, last) =>
        process.stdout.write(`\r  ${index}/${last} frames`),
    });
    process.stdout.write(
      `\r  ${result.written} frames in ${Math.round((Date.now() - started) / 1000)}s` +
        `${" ".repeat(20)}\n`,
    );
    if (result.errors.length) console.warn(`page errors:\n  ${result.errors.join("\n  ")}`);
    if (command === "build") {
      const files = await (await encoder()).encode(config, {
        onVariant: (file) => console.log(`  ${path.relative(process.cwd(), file)}`),
      });
      console.log(`${files.length} file(s) in ${path.relative(process.cwd(), config.deliverDir)}`);
    }
    return;
  }

  if (command === "encode") {
    const files = await (await encoder()).encode(config, {
      onVariant: (file) => console.log(`  ${path.relative(process.cwd(), file)}`),
    });
    console.log(`${files.length} file(s) in ${path.relative(process.cwd(), config.deliverDir)}`);
    return;
  }

  throw expected(`Unknown command "${command}"\n\n${USAGE}`);
}

main().catch((error: unknown) => {
  // An expected failure is the user's problem to fix and does not need a stack;
  // anything else is this tool's problem and does.
  const isExpected = Boolean(error && typeof error === "object" && "expected" in error);
  console.error(isExpected ? `\n${(error as Error).message}\n` : error);
  process.exitCode = 1;
});
