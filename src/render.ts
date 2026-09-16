import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "./browser.ts";
import { serveDirectory } from "./serve.ts";
import type { Config } from "./types.ts";

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
export interface RenderOptions {
  /** Render exactly these timestamps into probe/ instead of the film. */
  times?: number[] | null;
  from?: number | null;
  to?: number | null;
  onProgress?: (index: number, last: number) => void;
}

export interface RenderResult {
  written: number;
  dir: string;
  errors: string[];
}

export async function renderFrames(
  config: Config,
  { times = null, from = null, to = null, onProgress }: RenderOptions = {},
): Promise<RenderResult> {
  const browser = await launch({ webgl: config.webgl });
  const page = await browser.newPage({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: 1,
  });

  const errors = new Set<string>();
  page.on("pageerror", (error) => errors.add(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.add(`console: ${message.text()}`);
  });

  /*
   * The stage is served rather than opened from disk, so it can import modules
   * and fetch files beside it. A stage outside the project root has nothing to
   * serve it from and falls back to file://, where those two things do not
   * work — which is a reason to keep the stage in the project, not a reason to
   * special-case it here.
   */
  const inside =
    config.stagePath === config.root || config.stagePath.startsWith(config.root + path.sep);
  const server = inside ? await serveDirectory(config.root) : null;
  const url = server
    ? `${server.origin}/${path.relative(config.root, config.stagePath).split(path.sep).join("/")}`
    : pathToFileURL(config.stagePath).href;
  const shoot = async (seconds: number, file: string): Promise<void> => {
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
    server?.close();
  }
}
