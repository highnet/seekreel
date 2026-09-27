/*
 * Time helpers for family-pack stages. Everything is a function of `t`.
 *
 * Motion (Framer Motion's engine, loaded as vendor/motion.js) supplies the
 * spring, easings and colour mixing. Its spring is *sampled* at an elapsed
 * time rather than run on a clock, which is what keeps a seekreel frame the
 * same picture on every render.
 */
const M = window.Motion;
if (!M) throw new Error('family pack: load <script src="../vendor/motion.js"> before the stage module');

export const { mix, mixColor, easeIn, easeOut, easeInOut, interpolate } = M;

/** Seconds into the film, from ?t= */
export const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
/** Progress from a to b, 0..1. */
export const span = (a, b, x = t) => clamp01((x - a) / (b - a));
export const within = (a, b, x = t) => x >= a && x < b;

/** A Motion spring from `from` to `to`, sampled `sec` seconds after release. */
export function springAt(sec, from = 0, to = 1, opts = {}) {
  if (sec <= 0) return from;
  return M.spring({ keyframes: [from, to], stiffness: 260, damping: 14, ...opts }).next(sec * 1000).value;
}

/** Spring in at `a`, ease out over `out` seconds after `b`. 0 outside. */
export function popInOut(a, b, opts = {}, out = 0.35, x = t) {
  if (x < a || x > b + out) return 0;
  return springAt(x - a, 0, 1, opts) * (1 - easeIn(span(b, b + out, x)));
}

/** Eyelids: 1 open, 0.12 mid-blink. Give each actor its own offset. */
export const blink = (offset = 0, every = 3.7, x = t) => ((x + offset) % every) < 0.13 ? 0.12 : 1;

/**
 * Hopping from a to b: u is progress, y the hop height, squash the landing
 * squish (feed it to blob({ squash })).
 */
export function hop(a, b, hops = 3, height = 0.5, x = t) {
  const u = span(a, b, x);
  if (u <= 0 || u >= 1) return { u, y: 0, squash: 0 };
  return { u, y: Math.abs(Math.sin(Math.PI * u * hops)) * height, squash: -0.12 * Math.sin(Math.PI * ((u * hops) % 1)) };
}

/**
 * Keyframed positions: [{ t, p: [x, z, y?], hops? }] → { x, y, z, moving, dir }.
 * Segments with `hops` bounce along the way.
 */
export function track(keys, x = t) {
  if (x <= keys[0].t) return { x: keys[0].p[0], z: keys[0].p[1], y: keys[0].p[2] || 0, moving: false, dir: 0, squash: 0 };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (x < b.t) {
      const u = (x - a.t) / (b.t - a.t);
      const e = b.hops ? u : easeInOut(u);
      const air = b.hops ? Math.abs(Math.sin(Math.PI * b.hops * u)) * (b.hh ?? 0.5) : 0;
      return {
        x: mix(a.p[0], b.p[0], e), z: mix(a.p[1], b.p[1], e), y: mix(a.p[2] || 0, b.p[2] || 0, e) + air,
        moving: true, dir: Math.atan2(b.p[0] - a.p[0], b.p[1] - a.p[1]),
        squash: b.hops ? -0.12 * Math.sin(Math.PI * ((u * b.hops) % 1)) : 0,
      };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.p[0], z: l.p[1], y: l.p[2] || 0, moving: false, dir: 0, squash: 0 };
}

/** Camera shots: [{ t, p: [x,y,z], l: [x,y,z] }], eased between keys. */
export function shot(keys, x = t) {
  let a = keys[0], b = keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (x < keys[i].t) { a = keys[i - 1]; b = keys[i]; break; }
    a = b = keys[i];
  }
  if (a === b) return { p: a.p, l: a.l };
  const u = easeInOut(clamp01((x - a.t) / (b.t - a.t)));
  return { p: a.p.map((v, i) => mix(v, b.p[i], u)), l: a.l.map((v, i) => mix(v, b.l[i], u)) };
}

/**
 * Splice a scene into a film that is already timed: inserts are
 * [{ at, len, story }] in video seconds; returns the story time for `x`, and
 * which insert (if any) is playing. Everything outside the inserts keeps the
 * numbers it was written with.
 */
export function splice(inserts, x = t) {
  let shift = 0, active = null;
  for (const ins of inserts) {
    if (x >= ins.at + ins.len) shift += ins.len;
    else if (x >= ins.at) active = ins;
  }
  return { story: active ? active.story - 0.03 : x - shift, active, local: active ? x - active.at : 0 };
}

/** A seeded random: same sequence every frame. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
