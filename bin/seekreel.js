#!/usr/bin/env node
import { spawn } from "node:child_process";
import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/config.js";

/*
 * The renderer and the encoder are imported when they are needed, not at
 * start-up, so that `--help`, `init` and `doctor` all work on a checkout with
 * nothing installed — which is exactly the state somebody is in when they need
 * those three.
 */
const renderer = () => import("../src/render.js");
const encoder = () => import("../src/encode.js");

const here = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.resolve(here, "..");

const USAGE = `seekreel — render an animated HTML page to video, one frame per seek

  seekreel init [dir]            scaffold a project
  seekreel probe <t,t,...>       render just those timestamps, into probe/
  seekreel render [a] [b]        render all frames, or the range a..b in place
  seekreel audio                 render the cue sheet to a WAV
  seekreel encode                frames + WAV -> deliver/*.mp4
  seekreel build                 audio, then render, then encode
  seekreel doctor                check Chromium and ffmpeg

Options
  -c, --config <path>            default: ./seekreel.config.json
`;

function arg(argv, ...names) {
  for (const name of names) {
    const at = argv.indexOf(name);
    if (at !== -1 && argv[at + 1]) return argv[at + 1];
  }
  return null;
}

function python(script, args) {
  return new Promise((resolve, reject) => {
    const bin = process.env.PYTHON ?? "python3";
    const child = spawn(bin, [script, ...args], { stdio: "inherit" });
    child.on("error", (error) =>
      reject(
        Object.assign(
          new Error(`Could not run ${bin}: ${error.message}. Set PYTHON to a python3.`),
          { expected: true },
        ),
      ),
    );
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${path.basename(script)} exited ${code}`)),
    );
  });
}

async function doAudio(config) {
  if (!config.audio) {
    console.log("No audio configured; nothing to render.");
    return;
  }
  await python(path.join(PACKAGE, "src/audio/render.py"), [
    "--cues", config.audio.cues,
    "--out", config.audio.wav,
  ]);
}

async function main() {
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
        `  seekreel build\n`,
    );
    return;
  }

  if (command === "doctor") {
    const browser = await renderer()
      .then(() => "playwright-core installed")
      .catch(() => "playwright-core MISSING — run npm install");
    let ffmpeg = "ffmpeg-static MISSING and no system ffmpeg";
    try {
      const { checkEncoder, ffmpegPath } = await encoder();
      const found = await checkEncoder();
      ffmpeg = `${ffmpegPath()} — ${found.ok ? "ok, has libx264" : `NOT USABLE: ${found.reason}`}`;
      if (!found.ok) process.exitCode = 1;
    } catch {
      process.exitCode = 1;
    }
    console.log(`chromium   ${process.env.CHROMIUM ?? "(auto-detected)"} — ${browser}`);
    console.log(`ffmpeg     ${ffmpeg}`);
    console.log(`python     ${process.env.PYTHON ?? "python3"} — only needed for audio`);
    return;
  }

  const config = await loadConfig(
    arg(argv, "-c", "--config") ?? path.resolve("seekreel.config.json"),
  );

  if (command === "probe") {
    const list = (argv[1] ?? "").split(",").map(Number).filter((n) => !Number.isNaN(n));
    if (list.length === 0) throw Object.assign(new Error("Give me timestamps: seekreel probe 1.2,4.5"), { expected: true });
    const result = await (await renderer()).renderFrames(config, { times: list });
    console.log(`${result.written} frame(s) -> ${path.relative(process.cwd(), result.dir)}`);
    if (result.errors.length) console.warn(`page errors:\n  ${result.errors.join("\n  ")}`);
    return;
  }

  if (command === "audio") return doAudio(config);

  if (command === "render" || command === "build") {
    if (command === "build") await doAudio(config);
    const numbers = argv.slice(1).filter((a) => /^\d+$/.test(a)).map(Number);
    const [from = null, to = null] = numbers;
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

  throw Object.assign(new Error(`Unknown command "${command}"\n\n${USAGE}`), { expected: true });
}

main().catch((error) => {
  // An expected failure is the user's problem to fix and does not need a stack;
  // anything else is this tool's problem and does.
  console.error(error.expected ? `\n${error.message}\n` : error);
  process.exitCode = 1;
});
