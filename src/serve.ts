import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * A static server for the length of a render.
 *
 * Stages used to be loaded over file://, and a file:// document is not allowed
 * to import an ES module, fetch a JSON file next to it, or use an import map —
 * the browser treats every one of those as a cross-origin request from a null
 * origin. That ruled out exactly the libraries worth using: three.js, and
 * anything else that ships as a module.
 *
 * So the stage's directory is served on a loopback port instead, for as long as
 * the render takes. Relative paths keep working, `import` starts working, and
 * nothing leaves the machine.
 */

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".hdr": "image/vnd.radiance",
  ".exr": "image/x-exr",
  ".bin": "application/octet-stream",
};

export interface StaticServer {
  /** e.g. http://127.0.0.1:53124 — no trailing slash. */
  origin: string;
  close: () => void;
}

/**
 * `extra` maps a URL path to a file outside the root, which is how the audio
 * engine serves its own page and the Strudel bundle alongside a project.
 */
export async function serveDirectory(
  root: string,
  extra: Record<string, string> = {},
): Promise<StaticServer> {
  const server = createServer(async (request, response) => {
    const url = (request.url ?? "/").split("?")[0];
    const name = decodeURIComponent(url);

    /* Chromium asks for this unprompted, and a 404 would land in the page's
       console next to the errors that matter. */
    if (name === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }

    let file = extra[name];
    if (!file) {
      const resolved = path.resolve(root, `.${name}`);
      /* A stage cannot read its way up out of the directory it lives in. */
      if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      file = resolved;
    }

    try {
      const info = await stat(file);
      if (info.isDirectory()) file = path.join(file, "index.html");
      response.writeHead(200, {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        /*
         * Nothing here may be cached. A stage edited between two `probe` runs
         * has to be the one that renders, and a frame served from memory is
         * a frame of the wrong film.
         */
        "cache-control": "no-store",
      });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => server.close(),
  };
}
