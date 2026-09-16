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
