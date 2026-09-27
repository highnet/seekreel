/*
 * React for family-pack stages: htm instead of JSX (no build step), the 3D
 * world mounted as a component, and one call that renders the frame.
 *
 *   import { html, World, film } from "../kit/react.js";
 *   film(html`<div class="frame"><${World} world=${world} /> ...</div>`);
 *
 * The tree must be a pure function of t: no state, no effects, nothing that
 * arrives after the commit. <World> renders the three.js scene inside its ref
 * callback, which runs during React's synchronous commit, so the canvas holds
 * the finished frame the moment render() returns.
 */
import { createRoot } from "../vendor/react-dom-client.js";
import { flushSync } from "../vendor/react-dom.js";
import { html } from "../vendor/htm.js";
import { renderReact, markReadyWhenLoaded } from "/_seekreel/stage.js";

export { html };

export function World({ world }) {
  const attach = (el) => {
    if (!el || el.firstChild) return;
    el.append(world.canvas);
    world.renderer.render(world.scene, world.camera);
  };
  return html`<div class="world" ref=${attach}></div>`;
}

/**
 * Render the frame once into #stage, then mark it ready when fonts and
 * images (photos in <Photo>) have loaded.
 */
export async function film(element, { mount = "stage" } = {}) {
  let el = document.getElementById(mount);
  if (!el) {
    el = document.createElement("div");
    el.id = mount;
    document.body.append(el);
  }
  renderReact({ root: createRoot(el), flushSync }, element, { ready: false });
  await markReadyWhenLoaded();
}
