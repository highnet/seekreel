/*
 * The family pack's 2D pieces, as React components (htm, no JSX build).
 * Styles live in family.css. Every component takes `now` — the time it
 * should draw — so a stage can run a spliced scene on its own clock.
 *
 *   <${Sky} night=${0.2} />
 *   <${Captions} lines=${LINES} now=${t} />
 *   <${Bubble} text="hi." at=${2} to=${3.5} xy=${world.above(actor)} now=${t} />
 *   <${ChapterCard} cards=${CARDS} now=${t} />
 *   <${Photo} src="photos/beach.svg" x=${84} y=${30} r=${5} label="the beach" at=${4} to=${7} now=${t} />
 */
import { html } from "./react.js";
import { springAt, popInOut, span, clamp01, easeIn, easeOut, easeInOut, mixColor, rng } from "./timing.js";

const SKY_DAY = ["#c8b4e6", "#f5bfd0", "#ffd3b4", "#ffe8c4"];
const SKY_NIGHT = ["#1d2150", "#3a3170", "#6a4a8a", "#a3729c"];

/** The sky's four stops for a night amount 0..1 (use the last as the world's fog colour). */
export const skyStops = (night = 0) => SKY_DAY.map((c, i) => mixColor(c, SKY_NIGHT[i])(night));

/** A sunset sky with a sun, a moon and stars that come out at night. `sun` is an angle: 1.05 sits low and golden. */
export function Sky({ night = 0, sun = 1.05, now = 0 }) {
  const s = skyStops(night);
  const orbit = (a) => [50 + Math.sin(a) * 44, 72 - Math.cos(a) * 62];
  const [sx, sy] = orbit(sun), [mx, my] = orbit(sun + Math.PI);
  const r = rng(7);
  const stars = Array.from({ length: 70 }, (_, i) => {
    const x = r() * 100, y = r() * 55;
    const o = clamp01((night - 0.35) * 2) * (0.6 + 0.4 * Math.sin(now * 3 + i));
    return html`<i key=${i} class="star" style=${{ left: x + "vw", top: y + "vh", opacity: o }}></i>`;
  });
  return html`
    <div class="sky" style=${{ background: `linear-gradient(180deg, ${s[0]} 0%, ${s[1]} 34%, ${s[2]} 62%, ${s[3]} 100%)` }}>
      ${stars}
      <i class="sun" style=${{ left: sx + "vw", top: sy + "vh" }}></i>
      <i class="moon" style=${{ left: mx + "vw", top: my + "vh" }}></i>
    </div>`;
}

/** A warm vignette; `fade` (0..1) washes the frame in cream, for an opening. */
export function Vignette({ fade = 0 }) {
  return html`<div class="vignette" style=${fade > 0 ? { background: `rgba(255,246,236,${fade})` } : null}></div>`;
}

/**
 * Captions that pop in word by word on a spring.
 * lines: [{ at, to, text, s? }] — s is "" | "aside" | "big" | "title".
 */
export function Captions({ lines, now, night = 0 }) {
  const live = lines.filter((c) => now >= c.at && now <= c.to + 0.4);
  return html`<div class=${"captions" + (night > 0.45 ? " night" : "")}>
    ${live.map((c, li) => {
      const out = easeIn(span(c.to, c.to + 0.35, now));
      const stagger = c.s === "big" ? 0.14 : 0.075;
      return html`<div key=${c.at + ":" + li} class=${"line" + (c.s ? " " + c.s : "")}>
        ${c.text.split(" ").map((w, i) => {
          const e = now - c.at - i * stagger;
          const y = springAt(e, 1, 0, { stiffness: 380, damping: 13 });
          const sc = e <= 0 ? 0.4 : springAt(e, 0.4, 1, { stiffness: 420, damping: 11 });
          const op = easeOut(clamp01(e / 0.12)) * (1 - out);
          const rot = (1 - Math.min(1, sc)) * (i % 2 ? 6 : -6);
          return html`<span key=${i} class="word" style=${{ opacity: op, transform: `translateY(${y * 0.6 + out * 0.4}em) scale(${sc}) rotate(${rot}deg)` }}>${w}</span>`;
        })}
      </div>`;
    })}
  </div>`;
}

/** A speech bubble over a point on screen (xy from world.above(actor)). */
export function Bubble({ text, at, to, xy, now, dx = 0 }) {
  if (!xy || now < at || now > to + 0.3) return null;
  const s = popInOut(at, to, { stiffness: 420, damping: 15 }, 0.3, now);
  const [x, y] = xy;
  /* anchored by its tail: centred on x, sitting just above y, kept on screen */
  const left = Math.min(innerWidth - 24, Math.max(24, x + dx));
  return html`<div class="bubble" style=${{ left: left + "px", top: y + "px", opacity: Math.min(1, s * 1.5), transform: `translate(-50%, calc(-100% - 14px)) scale(${Math.max(0, s)})` }}>${text}</div>`;
}

/** Full-screen chapter cards: cards [{ at, n, title }], each `length` seconds. */
export function ChapterCard({ cards, now, length = 4 }) {
  const c = cards.find((c) => now >= c.at && now < c.at + length);
  if (!c) return null;
  const e = now - c.at;
  const inY = springAt(e, 1, 0, { stiffness: 170, damping: 22 });
  const outY = easeInOut(span(c.at + length - 0.55, c.at + length, now));
  const title = springAt(e - 0.25, 0, 1, { stiffness: 300, damping: 12 });
  const heart = springAt(e - 0.55, 0, 1, { stiffness: 380, damping: 8 }) * (1 + Math.sin(e * 6) * 0.06);
  return html`<div class="card" style=${{ transform: `translateY(${(inY * 100 - outY * 100).toFixed(3)}%)` }}>
    <div class="n" style=${{ opacity: clamp01((e - 0.2) / 0.3) }}>${c.n}</div>
    <div class="t" style=${{ transform: `scale(${title}) rotate(${(1 - title) * -4}deg)` }}>${c.title}</div>
    <svg viewBox="0 0 32 30" style=${{ transform: `scale(${heart})` }}><path d="M16 29 C 5 21 0 14 0 8.5 C 0 3.5 3.8 0 8.4 0 C 11.6 0 14.4 1.8 16 4.6 C 17.6 1.8 20.4 0 23.6 0 C 28.2 0 32 3.5 32 8.5 C 32 14 27 21 16 29 Z" /></svg>
  </div>`;
}

/**
 * A photo that springs up into place, in a gold gallery frame or as a
 * polaroid. x/y are the centre in vw/vh; at/to its window on `now`.
 */
export function Photo({ src, x, y, r = 0, label, at, to = Infinity, now, look = "frame", index = 0 }) {
  if (now < at || now > to + 0.5) return null;
  const k = springAt(now - at, 0, 1, { stiffness: 190, damping: 14 });
  const out = easeIn(span(to, to + 0.5, now));
  const tilt = r + (1 - k) * (index % 2 ? 22 : -22);
  return html`<figure class=${"photo " + look} style=${{
    left: x + "vw", top: y + "vh", opacity: clamp01((now - at) / 0.15) * (1 - out),
    transform: `translate(-50%, calc(-50% + ${70 * (1 - k) + 20 * out}vh)) rotate(${tilt}deg) scale(${0.7 + 0.3 * k})`,
  }}>
    <img src=${src} alt="" />
    ${label ? html`<figcaption>${label}</figcaption>` : null}
  </figure>`;
}

/** An end card line or credit, faded in and held. */
export function Credit({ text, at, now }) {
  if (now < at) return null;
  return html`<div class="credit" style=${{ opacity: easeOut(span(at, at + 0.6, now)) }}>${text}</div>`;
}
