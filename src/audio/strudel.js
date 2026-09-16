import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../browser.js";
import { writeWav } from "./wav.js";

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

/*
 * A pattern file is ES module source, and a module cannot be imported from
 * file:// — the browser refuses it as a cross-origin request. Serving the
 * project directory over a loopback port for the length of the render is the
 * whole of the workaround, and it keeps the page's imports ordinary.
 */
const TYPES = { ".mjs": "text/javascript", ".js": "text/javascript", ".html": "text/html" };

async function serve(files) {
  const server = createServer(async (request, response) => {
    const name = (request.url ?? "/").split("?")[0];
    /* Chromium asks for this unprompted, and a 404 would land in the page's
       console next to the errors that matter. */
    if (name === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }
    const file = files[name];
    if (!file) {
      response.writeHead(404).end();
      return;
    }
    try {
      response.writeHead(200, {
        "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
        /* The page and the bundle must not be cached between runs: a pattern
           edited and re-rendered in the same second has to be the one that
           renders. */
        "cache-control": "no-store",
      });
      response.end(await readFile(file));
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, port: server.address().port };
}

export async function renderStrudel(config, { onProgress } = {}) {
  const { pattern, bundle, wav, cps, sampleRate, peak, fadeIn, fadeOut } = config.audio;

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
      throw Object.assign(new Error(hint), { expected: true });
    }
  }

  const code = await readFile(pattern, "utf8");
  const { server, port } = await serve({
    "/": path.join(here, "strudel-page.html"),
    "/strudel-page.html": path.join(here, "strudel-page.html"),
    "/strudel.mjs": bundle,
  });

  const browser = await launch();
  try {
    const page = await browser.newPage();
    const failures = [];
    page.on("pageerror", (error) => failures.push(String(error)));
    page.on("console", (message) => {
      /* Strudel narrates its own loading; only its complaints are interesting. */
      if (message.type() === "error") failures.push(`console: ${message.text()}`);
    });

    await page.goto(`http://127.0.0.1:${port}/strudel-page.html`, { waitUntil: "load" });
    await page.waitForSelector("html[data-seekreel-ready]", { state: "attached", timeout: 30_000 });

    onProgress?.("rendering");
    let result;
    try {
      result = await page.evaluate(
        ([source, options]) => window.seekreelRender(source, options),
        [code, { duration: config.duration, cps, sampleRate }],
      );
    } catch (error) {
      /* A pattern that will not evaluate is the user's file to fix, not this
         tool's bug, so it gets a message rather than a stack — with whatever
         the page complained about on the way down. */
      const message = String(error?.message ?? error).split("\n")[0].replace(/^page\.evaluate: /, "");
      throw Object.assign(
        new Error(`${path.relative(process.cwd(), pattern)}: ${message}` +
          (failures.length ? `\n\n  ${failures.join("\n  ")}` : "")),
        { expected: true },
      );
    }

    if (result.played === 0) {
      throw Object.assign(
        new Error(
          `The pattern produced no sound over ${config.duration}s at ${cps} cycles per second.` +
            (failures.length ? `\n\n  ${failures.join("\n  ")}` : ""),
        ),
        { expected: true },
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
