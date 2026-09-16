import { chromium } from "playwright-core";
import type { Browser } from "playwright-core";
import { expected } from "./types.ts";

/**
 * Where Chromium is.
 *
 * Not bundled: a browser is 150MB and most machines that want this already
 * have one, whether from a full `playwright` install or from the system. The
 * env var is checked first so CI can point at whatever it cached.
 */
export function chromiumPath(): string | undefined {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  try {
    // A full `playwright` install knows where it put its browsers.
    return chromium.executablePath();
  } catch {
    return undefined;
  }
}

/**
 * Launch the browser both halves of the tool use: the renderer for frames, and
 * the Strudel engine for sound. The flags are the renderer's — type has to be
 * identical from frame to frame, and subpixel hinting is the one thing that
 * will not be, because it shifts with the glyph cache. They cost the audio
 * engine nothing.
 */
export async function launch({ webgl = false }: { webgl?: boolean } = {}): Promise<Browser> {
  const executablePath = chromiumPath();
  try {
    return await chromium.launch({
      executablePath,
      args: [
        "--font-render-hinting=none",
        "--disable-lcd-text",
        "--force-color-profile=srgb",
        /*
         * A headless Chromium on a machine with no GPU will either refuse WebGL
         * or hand back a context backed by whatever driver it found, which is
         * the one thing a deterministic renderer cannot have: the same scene
         * would shade differently on the next machine. SwiftShader is a
         * software rasteriser, so every frame is computed the same way
         * everywhere — slower, and identical, which is the trade this whole
         * tool makes.
         */
        ...(webgl
          ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
          : []),
      ],
    });
  } catch (error) {
    const hint =
      "No Chromium found. Either install one with `npm i -D playwright && npx playwright install chromium`, " +
      "or point CHROMIUM at a Chrome or Chromium binary you already have.";
    throw expected(`${hint}\n\n${(error as Error).message}`);
  }
}
