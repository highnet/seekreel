import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../browser.ts";
import { serveDirectory } from "../serve.ts";
import { writeWav } from "./wav.ts";
import { expected } from "../types.ts";
import type { Config, StrudelAudio } from "../types.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sound, as a Strudel pattern.
 *
 * The pattern file is Strudel source — the same language as strudel.cc, with
 * the same mini-notation — and it is rendered by the same Chromium the frames
 * are shot with, through an OfflineAudioContext. Nothing is recorded in real
 * time, so a sixteen-second soundtrack takes about three seconds and comes out
 * identical every time, which is the same promise the picture makes.
 *
 * The one thing this needs that the tool cannot supply is Strudel itself: a
 * 850KB bundle, fetched into the project rather than vendored here, the same
 * way the GSAP example fetches GSAP.
 */

export interface StrudelResult {
  frames: number;
  seconds: number;
  /** Events actually handed to the synth. */
  events: number;
  queried: number;
  peak: number;
  failures: string[];
}

interface PageResult {
  pcm: string;
  frames: number;
  haps: number;
  played: number;
  voices: string[];
  peak: number;
}

export async function renderStrudel(
  config: Config,
  { onProgress }: { onProgress?: (stage: string) => void } = {},
): Promise<StrudelResult> {
  const { pattern, bundle, wav, cps, sampleRate, peak, fadeIn, fadeOut, seed } =
    config.audio as StrudelAudio;

  for (const [what, file] of [["pattern", pattern], ["Strudel bundle", bundle]]) {
    try {
      await readFile(file);
    } catch {
      const hint =
        what === "pattern"
          ? `No pattern at ${file}. audio.pattern points at a file of Strudel source.`
          : `No Strudel bundle at ${file}. Fetch one:\n\n` +
            `  curl -fsSL -o ${path.basename(file)} https://cdn.jsdelivr.net/npm/@strudel/web@1.3.0/dist/index.mjs\n\n` +
            `or point audio.bundle at a copy you already have.`;
      throw expected(hint);
    }
  }

  const code = await readFile(pattern, "utf8");
  /*
   * A pattern file is ES module source, and a module cannot be imported from
   * file:// — the browser refuses it as a cross-origin request. The engine's
   * own page and the Strudel bundle are served beside the project instead.
   */
  const server = await serveDirectory(path.dirname(pattern), {
    "/": path.join(here, "strudel-page.html"),
    "/strudel-page.html": path.join(here, "strudel-page.html"),
    "/strudel.mjs": bundle,
  });

  const browser = await launch();
  try {
    const page = await browser.newPage();
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(String(error)));
    page.on("console", (message) => {
      /* Strudel narrates its own loading; only its complaints are interesting. */
      if (message.type() === "error") failures.push(`console: ${message.text()}`);
    });

    await page.goto(`${server.origin}/strudel-page.html?seed=${seed}`, { waitUntil: "load" });
    await page.waitForSelector("html[data-seekreel-ready]", { state: "attached", timeout: 30_000 });

    onProgress?.("rendering");
    let result: PageResult;
    try {
      result = (await page.evaluate(
        ([source, options]) =>
          (window as unknown as {
            seekreelRender: (code: string, options: unknown) => Promise<PageResult>;
          }).seekreelRender(source as string, options),
        [code, { duration: config.duration, cps, sampleRate, seed }] as [string, unknown],
      )) as PageResult;
    } catch (error) {
      /* A pattern that will not evaluate is the user's file to fix, not this
         tool's bug, so it gets a message rather than a stack — with whatever
         the page complained about on the way down. */
      const message = String((error as Error)?.message ?? error)
        .split("\n")[0]
        .replace(/^page\.evaluate: /, "");
      throw expected(
        `${path.relative(process.cwd(), pattern)}: ${message}` +
          (failures.length ? `\n\n  ${failures.join("\n  ")}` : ""),
      );
    }

    if (result.played === 0) {
      throw expected(
        `The pattern produced no sound over ${config.duration}s at ${cps} cycles per second.` +
          (failures.length ? `\n\n  ${failures.join("\n  ")}` : ""),
      );
    }

    const bytes = Buffer.from(result.pcm, "base64");
    const interleaved = new Float32Array(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
    const written = await writeWav(wav, interleaved, { sampleRate, fadeIn, fadeOut, peak });

    return { ...written, events: result.played, queried: result.haps, peak: result.peak, failures };
  } finally {
    await browser.close();
    server.close();
  }
}
