/**
 * The stage helpers, served to every render at /_seekreel/stage.js.
 *
 * Nothing here is required — a stage that reads `t` itself and stamps the
 * attribute itself is a complete stage, and that stays true. These exist
 * because three lines of boilerplate written slightly differently in every
 * project is how a contract quietly stops being one, and because React needs
 * one thing done exactly right (see `renderReact`).
 *
 * This file is JavaScript rather than TypeScript, unlike the rest of the tool:
 * it runs in the browser, and the browser is the one thing in this pipeline
 * that cannot strip types. Its types are in stage.d.ts next door.
 */

/** The timestamp this frame belongs to, in seconds. */
export function time() {
  return parseFloat(new URLSearchParams(location.search).get("t") || "0");
}

/** Progress through [a, b], clamped. The only timing primitive most films need. */
export function span(a, b, t = time()) {
  return Math.min(1, Math.max(0, (t - a) / (b - a)));
}

/** The frame index this timestamp sits on, given a frame rate. */
export function frame(fps, t = time()) {
  return Math.round(t * fps);
}

/**
 * Say the picture is final. Everything drawn has to be drawn before this runs:
 * seekreel takes the screenshot the moment it appears.
 */
export function markReady() {
  document.documentElement.setAttribute("data-seekreel-ready", "1");
}

/**
 * Render a React element once, synchronously, and mark the frame ready.
 *
 * React 19 schedules work rather than doing it: `root.render(element)` returns
 * before anything is on the page, so a stage that marks itself ready on the
 * next line is screenshotting an empty document. `flushSync` is the whole fix —
 * it commits before it returns — which is why it is a required argument rather
 * than something this helper tries to import for you.
 *
 *   import { createRoot } from "./vendor/react-dom-client.js";
 *   import { flushSync } from "./vendor/react-dom.js";
 *   import { renderReact } from "/_seekreel/stage.js";
 *
 *   renderReact({ root: createRoot(document.getElementById("stage")), flushSync },
 *               html`<${Film} t=${time()} />`);
 *
 * A stage is one frame of a film, so the component tree has to be a pure
 * function of its props: no state that survives a page load, no effects that
 * arrive after the commit, no data fetched unless you await it first and render
 * after.
 */
export function renderReact({ root, flushSync }, element, { ready = true } = {}) {
  if (!root || typeof flushSync !== "function") {
    throw new Error("renderReact needs { root, flushSync } — see /_seekreel/stage.js");
  }
  flushSync(() => root.render(element));
  if (ready) markReady();
}

/**
 * Mark ready once the fonts and images already in the document have arrived.
 *
 * seekreel waits for `document.fonts.ready` itself, so this is for the other
 * half: an <img> that has not decoded yet will screenshot as a blank box.
 */
export async function markReadyWhenLoaded() {
  const images = [...document.images].filter((image) => !image.complete);
  await Promise.all([
    document.fonts?.ready,
    ...images.map((image) => image.decode().catch(() => undefined)),
  ]);
  markReady();
}

/* ------------------------------------------------------------------ editing */

/** Smooth in and out, the curve most cuts and moves want. */
export function ease(k) {
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

/**
 * 0 → 1 → 0 across [a, b], easing in and out over `fade` seconds at each end.
 * The shape of anything that appears for a while: a lower third, a caption,
 * a chip, a title card.
 */
export function shown(a, b, fade = 0.4, t = time()) {
  return Math.min(ease(span(a, a + fade, t)), 1 - ease(span(b - fade, b, t)));
}

/**
 * Recorded footage, as cut by `seekreel footage`.
 *
 *   const film = await loadFootage("footage");
 *   stage.append(await film.image());          // this frame, decoded
 *   const clip = film.clip();                  // which clip t is in
 *   const at = film.toFilm("compare", 12.4);   // source second → film second
 *
 * The frame is an <img> of a JPEG on disk rather than a seeked <video>:
 * exact on every frame, where a <video> is exact most of the time.
 */
export async function loadFootage(dir = "footage") {
  const base = dir.replace(/\/$/, "");
  const response = await fetch(`${base}/footage.json`);
  if (!response.ok) throw new Error(`No ${base}/footage.json — run \`seekreel footage\` first`);
  const index = await response.json();

  const frameAt = (t = time()) => Math.max(0, Math.min(index.frames - 1, Math.round(t * index.fps)));
  return {
    ...index,
    frameAt,
    url: (t = time()) => `${base}/frames/${String(frameAt(t)).padStart(5, "0")}.jpg`,
    /** An <img> of this moment, decoded so the screenshot cannot catch it blank. */
    async image(t = time()) {
      const img = new Image(index.width, index.height);
      img.src = this.url(t);
      await img.decode().catch(() => undefined);
      return img;
    },
    /** The clip on screen at t; during a transition, the one arriving. */
    clip(t = time()) {
      let found = index.clips[0];
      for (const clip of index.clips) if (t >= clip.start) found = clip;
      return found;
    },
    byLabel: (label) => index.clips.find((clip) => clip.label === label),
    /** Where a moment of a clip's source lands in the film. */
    toFilm(label, sourceSeconds) {
      const clip = index.clips.find((c) => c.label === label);
      if (!clip) return null;
      return clip.start + (sourceSeconds - clip.from) / clip.speed;
    },
  };
}

/**
 * A punch-in: scale toward a point and back, the editor's way of saying "look
 * here". Returns a CSS transform for an element whose transform-origin is its
 * top left corner (`transform-origin: 0 0`).
 *
 *   img.style.transform = punchIn(clicks.filter(c => c.zoom), { scale: 1.2 });
 *
 * Each point is { t, x, y } in the element's own pixels; the move starts
 * `lead` seconds before t and lets go `hold` seconds after.
 */
export function punchIn(points, { scale = 1.2, lead = 0.9, hold = 0.8, ease: inOut = 0.7, t = time() } = {}) {
  let best = { k: 0, x: 0, y: 0 };
  for (const p of points) {
    const k = Math.min(ease(span(p.t - lead, p.t - lead + inOut, t)), 1 - ease(span(p.t + hold, p.t + hold + inOut, t)));
    if (k > best.k) best = { k, x: p.x, y: p.y };
  }
  const s = 1 + (scale - 1) * best.k;
  return `translate(${-best.x * (s - 1)}px, ${-best.y * (s - 1)}px) scale(${s})`;
}

/**
 * The caption on screen at t, from a list of { start, end, text }.
 * Captions are data; how they look is the stage's business.
 */
export function captionAt(cues, t = time()) {
  return cues.find((cue) => t >= cue.start && t < cue.end) ?? null;
}
