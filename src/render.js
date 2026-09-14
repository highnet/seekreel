import { chromium } from "playwright-core";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Where Chromium is.
 *
 * Not bundled: a browser is 150MB and most machines that want this already
 * have one, whether from a full `playwright` install or from the system. The
 * env var is checked first so CI can point at whatever it cached.
 */
function chromiumPath() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  try {
    // A full `playwright` install knows where it put its browsers.
    return chromium.executablePath();
  } catch {
    return undefined;
  }
}

async function launch() {
  const executablePath = chromiumPath();
  try {
    return await chromium.launch({
      executablePath,
      args: [
        // Type has to be identical from frame to frame, and subpixel hinting
        // is the one thing that will not be: it shifts with the glyph cache.
        "--font-render-hinting=none",
        "--disable-lcd-text",
        "--force-color-profile=srgb",
      ],
    });
  } catch (error) {
    const hint =
      "No Chromium found. Either `npm i -D playwright && npx playwright install chromium`, " +
      "or set CHROMIUM=/path/to/chrome.";
    const wrapped = new Error(`${hint}\n\n${error.message}`);
    wrapped.expected = true;
    throw wrapped;
  }
}

/**
 * Shoot frames.
 *
 * One page, navigated once per frame. That is slower than driving an
 * animation in place, and it is the whole point: a fresh document cannot
 * carry state from the frame before it, so frame N is identical whether it
 * was rendered first, last, or on its own six months later.
 *
 * `times` renders exactly those timestamps into the probe directory instead;
 * everything else is the same, so a probe is not a different code path from
 * the real thing.
 */
export async function renderFrames(config, { times = null, from = null, to = null, onProgress } = {}) {
  const browser = await launch();
  const page = await browser.newPage({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: 1,
  });

  const errors = new Set();
  page.on("pageerror", (error) => errors.add(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.add(`console: ${message.text()}`);
  });

  const url = pathToFileURL(config.stagePath).href;
  const shoot = async (seconds, file) => {
    await page.goto(`${url}?t=${seconds.toFixed(4)}`, { waitUntil: "load" });
    await page.waitForSelector(config.readySelector, {
      state: "attached",
      timeout: config.frameTimeoutMs,
    });
    // Fonts are the other thing that will not be identical frame to frame if
    // the frame is taken before they have loaded.
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: file });
  };

  let written = 0;
  try {
    if (times) {
      await mkdir(config.probeDir, { recursive: true });
      for (const seconds of times) {
        await shoot(seconds, path.join(config.probeDir, `t${seconds}.png`));
        written++;
      }
      return { written, dir: config.probeDir, errors: [...errors] };
    }

    const first = from ?? 0;
    const last = to ?? config.frames - 1;
    // A full render starts from an empty directory; a range renders in place,
    // which is what makes re-cutting one shot cheap.
    if (from === null && to === null) {
      await rm(config.outDir, { recursive: true, force: true });
    }
    await mkdir(config.outDir, { recursive: true });

    for (let index = first; index <= last; index++) {
      const name = String(index).padStart(String(config.frames).length + 1, "0");
      await shoot(index / config.fps, path.join(config.outDir, `${name}.png`));
      written++;
      if (onProgress && index % config.fps === 0) onProgress(index, last);
    }
    return { written, dir: config.outDir, errors: [...errors] };
  } finally {
    await browser.close();
  }
}
