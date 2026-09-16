# seekreel

**Turn an animated web page into a video file — one frame at a time.**

You write a normal HTML page that knows how to draw itself at any moment in
time. seekreel walks through every moment in the video, screenshots the page at
each one, and stitches the screenshots into an MP4 with ffmpeg.

```sh
curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh
seekreel init my-film
cd my-film
seekreel strudel                     # the audio engine's bundle, once
seekreel build
# → deliver/reel.mp4, reel-4x5.mp4, reel-story.mp4, reel-loop.gif, reel-silent.mp4
```

There is no npm package. seekreel is distributed by git: the installer clones
the repository to `~/.seekreel` and links the CLI onto your `PATH`. Clone it
yourself if you would rather see what you are running first — the tool is
TypeScript that Node executes as it is, so there is nothing to build:

```sh
git clone https://github.com/highnet/seekreel && cd seekreel
npm install --omit=dev               # playwright-core, the one runtime dependency
node bin/seekreel.ts doctor
```

There is a homepage too, with a viewer you can scrub:
**[seekreel.vercel.app](https://seekreel.vercel.app)**

**Contents**

- [Why not just screen-record it?](#why-not-just-screen-record-it)
- [How a page talks to seekreel](#how-a-page-talks-to-seekreel)
- [Animating with GSAP](#animating-with-gsap)
- [3D with three.js](#3d-with-threejs)
- [React stages](#react-stages)
- [Commands](#commands)
- [Configuration](#configuration)
- [Sound](#sound)
- [What you need installed](#what-you-need-installed)
- [Written in TypeScript](#written-in-typescript)
- [A full example](#a-full-example)
- [Things to know before you start](#things-to-know-before-you-start)
- [For agents](#for-agents)

---

## Why not just screen-record it?

A screen recording captures whatever your computer managed to draw at that
moment. If the machine was busy, frames drop. If a font loaded late, the first
second looks wrong. Fix one shot in the middle and you have to record the whole
thing over — and the recording slowly drifts away from the page it came from.

seekreel renders each frame from a timestamp instead. Frame 512 is always
"whatever the page looks like at `t = 21.333`", on any machine, every time. That
gives you three things:

- **Inspect a single frame.** `seekreel probe 21.3` renders just that moment to
  a PNG in about a second. No need to render the other thousand frames.
- **Re-render a single shot.** Changed the middle of the film?
  `seekreel render 480 620` redraws only those frames, in place.
- **Keep the film in your repo.** The page is the source. It diffs, it gets
  reviewed, and it rebuilds in CI — nobody has to remember how the video was
  made.

The trade-off: rendering means one screenshot per frame, so budget roughly a
second per frame. A 43-second film at 24fps takes about twenty minutes. That is
fine for a video you cut once and then tweak in pieces. It is the wrong tool for
anything interactive.

---

## How a page talks to seekreel

A **stage** is any HTML file that does three things:

1. Reads `t` (the timestamp, in seconds) from the query string.
2. Draws the frame for that timestamp, synchronously.
3. Sets `data-seekreel-ready` on `<html>` once the frame is finished.

That is the entire interface. There is no seekreel library to install on the
page and nothing to import.

```html
<div id="box"></div>
<script>
  const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");

  // progress from 0 to 1 between two timestamps
  const span = (a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  box.style.opacity = span(0, 1);
  box.style.transform = `translateY(${40 * (1 - span(0, 1))}px)`;

  document.documentElement.setAttribute("data-seekreel-ready", "1");
</script>
```

`data-ready` also works, so pages written against an earlier version still
render.

---

## Animating with GSAP

Writing easing curves by hand gets tedious quickly. Any animation library that
can be **seeked** to a point in time will work, and GSAP is the comfortable
choice: build a paused timeline, then jump it to `t`.

```js
const tl = gsap.timeline({ paused: true });
tl.from("#card", { y: 24, opacity: 0, duration: 0.9, ease: "expo.out" }, 0.1)
  .to("#bar i", { scaleX: 1, duration: 3.4, ease: "power1.inOut" }, 1.2)
  .to(".tray", { opacity: 1, duration: 0.5, stagger: 0.13 }, 6.0);

tl.time(t); // the only line that touches the clock
```

Two rules matter here, and ignoring either one produces broken frames:

- **Do not rely on callbacks for anything visible.** GSAP skips `onStart` and
  `onComplete` when you seek, so a callback-driven typewriter effect renders
  blank. Animate properties instead — for example, reveal text with a
  `clip-path` mask rather than typing it one character at a time.
- **Do not animate with CSS transitions or `@keyframes`.** They run on their own
  clock, which seekreel cannot control, so you will capture whichever frame they
  happened to be showing.

Text content is not an animatable property, so calculate it from `t` in plain
JavaScript instead of trying to tween it.

---

## 3D with three.js

The contract does not change: read `t`, draw that moment, say when the frame is
final. What changes is that a renderer normally driven by `requestAnimationFrame`
is asked for exactly one frame instead.

```html
<script type="module">
import * as THREE from "./three.module.js";

const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

/* The camera's angle is a function of t. There is no `rotation.y += 0.01`
   anywhere, because frame 300 has to be the same picture whether it was
   rendered after frame 299 or on its own. */
const angle = (t / DURATION) * Math.PI * 2;
camera.position.set(Math.sin(angle) * 11.5, 4.4, Math.cos(angle) * 11.5);
camera.lookAt(0, 1.1, 0);

renderer.render(scene, camera);
document.documentElement.setAttribute("data-seekreel-ready", "1");
</script>
```

Two things make this work, and both are seekreel's side of the bargain:

**`"webgl": true` in the config.** Chromium is launched with ANGLE on
SwiftShader, a software rasteriser. Left to itself a headless browser will
either refuse a WebGL context or hand back one backed by whatever driver the
machine has, and the same scene shades differently on the next machine.
Software rendering is slower and identical everywhere — rendering one timestamp
twice, in two processes, gives the same PNG byte for byte.

**Stages are served, not opened from disk.** three.js ships as an ES module, and
a `file://` document may not import one. seekreel serves the project directory
on a loopback port for the length of the render, so `import` works, and so does
`fetch` of a data file beside the stage.

Cost, and it is worth knowing before a long render: the flag applies to the
browser, not to the shot. Turning it on took the promo film in this repo from
roughly a fifth of a second a frame to about a third — on every frame, including
the eleven shots that are pure DOM. A scene with real shading costs more again. If only part of a film is 3D, import the library inside the window
that needs it (`examples/linkedin-promo` does) and `seekreel probe` a frame
before committing to a pass.

`examples/three-orbit` is a working eight-second scene. For an `AnimationMixer`,
use `mixer.setTime(t)` rather than `mixer.update(delta)` — the same move as
GSAP's `tl.time(t)`.

---

## React stages

A React tree that is a pure function of `t` is a film, and the contract does not
change. One thing does have to be done exactly right:

```js
import { createRoot } from "./vendor/react-dom-client.js";
import { flushSync } from "./vendor/react-dom.js";
import { time, renderReact } from "/_seekreel/stage.js";

renderReact(
  { root: createRoot(document.getElementById("stage")), flushSync },
  html`<${Film} t=${time()} />`,
);
```

**`flushSync` is not optional.** React 19 schedules rendering rather than doing
it, so `root.render(element)` returns before anything is on the page — a stage
that marks itself ready on the next line screenshots an empty document, on every
frame, with nothing in the logs to explain it.

`/_seekreel/stage.js` is served with every render and needs no installing:
`time`, `span`, `frame`, `markReady`, `markReadyWhenLoaded` and `renderReact`.
Types are in `src/stage/stage.d.ts` for a stage that goes through a bundler.

What React brings with it, because a stage is one frame in a document that has
never existed before:

- **No state that survives a page load.** `useState` as a value derived from
  props is fine; expecting it to carry from frame 61 to 62 is not. There is no
  frame 61 in this process.
- **No effects.** `useEffect` runs after the commit, and the screenshot may
  already have been taken.
- **Await your data before rendering.** A suspense fallback is a perfectly valid
  frame to screenshot, which is exactly the problem.

`examples/react-stage` runs with no build step at all — React as browser modules
and [htm](https://github.com/developit/htm) tagged templates, since JSX is the
one part of React that genuinely needs a compiler. If your project already has a
bundler, use it and point `stage` at the HTML your build writes; TSX works as it
always has.

---

## Commands

| Command | What it does |
| --- | --- |
| `seekreel init [dir]` | Scaffold a new project |
| `seekreel doctor` | Check that Chromium, ffmpeg and python are available |
| `seekreel probe <t,t,...>` | Render only those timestamps, into `probe/` |
| `seekreel render [a] [b]` | Render every frame, or just frames `a` to `b`, in place |
| `seekreel audio` | Render the soundtrack to a WAV file |
| `seekreel strudel` | Fetch the Strudel bundle the audio engine needs, once |
| `seekreel encode` | Turn the frames (plus the WAV) into every variant in `deliver/` |
| `seekreel build` | Audio, then render, then encode |

Use `-c, --config <path>` to point at a config other than
`./seekreel.config.json`. Paths inside a config are resolved relative to the
config file, so this works from anywhere in the tree:

```sh
seekreel build -c examples/collection-dex/seekreel.config.json
```

---

## Configuration

```json
{
  "name": "reel",
  "stage": "stage.html",
  "duration": 43,
  "fps": 24,
  "width": 1080,
  "height": 1080,
  "poster": 22.1,
  "background": "#111315",
  "audio": { "engine": "strudel", "pattern": "music.strudel.js", "cps": 0.5 },
  "webgl": false,
  "variants": [
    { "name": "" },
    { "name": "4x5", "ratio": "4:5" },
    { "name": "story", "ratio": "9:16" },
    { "name": "og", "size": "1200x628", "fit": "cover" },
    { "name": "web", "format": "webm" },
    { "name": "loop", "format": "gif", "fps": 12 },
    { "name": "silent", "audio": false }
  ]
}
```

| Key | What it does |
| --- | --- |
| `name` | Base filename for the output. Defaults to the directory name. |
| `stage` | The HTML file to render. |
| `duration`, `fps` | Together these decide how many frames there are, and what timestamp each one sits at. |
| `width`, `height` | The size you render at, in CSS pixels. Both must be even numbers — H.264 cannot encode an odd dimension. |
| `poster` | A timestamp to also save as a PNG. Leave it out if you do not want one. |
| `background` | Padding colour when a variant's shape does not match the render. Any ffmpeg colour: `black`, `#edefec`, `0xedefec`. |
| `audio` | Leave this out entirely for a silent film. |
| `webgl` | Turn this on for a three.js or raw-WebGL stage: it launches Chromium with software GL, so the scene renders the same on every machine. |
| `variants` | One output file per entry — see below. |
| `readySelector` | Override this if your stage signals readiness some other way. |
| `encode` | Encoder settings: `crf`, `preset`, `audioBitrate`, `keyint`, `gifColors`. |

### Variants: one render, many deliverables

Rendering is the slow part, so it happens once and every variant is cut from
the same frames.

| Key | What it does |
| --- | --- |
| `name` | Filename suffix. `""` is the plain `<name>.<ext>`. |
| `format` | `mp4` (H.264 + AAC, the default), `webm` (VP9 + Opus), `gif`, or `mov` (ProRes 422 HQ + PCM, for an edit timeline). |
| `ratio` | `"9:16"`, `"4:5"`, `"16:9"`, `"1:1"` — the shape you want. The canvas changes, the picture does not shrink: a 1080×1080 render at `9:16` becomes 1080×1920 with the frame centred. |
| `size` | An exact `"1200x628"` instead of a ratio, for the places that ask for pixels. |
| `fit` | `contain` (default) pads to the new shape with `background` and never crops. `cover` fills it and crops the overhang. |
| `fps` | Output frame rate, when it should differ from the render — a 24fps film as a 12fps gif. It can go down, not up: frames that were never drawn cannot be invented. |
| `audio` | `false` drops the soundtrack from this one. A `gif` is silent either way. |
| `scale`, `pad` | Raw ffmpeg filter strings, if you need something the keys above cannot say. They win over `ratio`/`size`/`fit`. |

So the common set — a square post, a 4:5 feed cut, a 9:16 story, a silent
autoplay loop and an OG image — is five lines of config and one render.

`seekreel doctor` lists which formats your ffmpeg can actually write.

---

## Sound

Two engines, and the choice is about what the soundtrack is for. Both synthesize
everything: there is no sample library to ship and no licences to track.
`seekreel audio` renders whichever one the config names, and `seekreel build`
does it first.

### Strudel patterns — music with a grid of its own

[Strudel](https://strudel.cc) is TidalCycles' pattern language in JavaScript. A
pattern is a pure function from a stretch of time to the events in it, which is
the same bargain the picture side of seekreel makes — so seekreel queries the
whole film's worth of cycles at once and renders them through an
`OfflineAudioContext` in the same Chromium that shoots the frames. Nothing plays
in realtime, nothing is recorded, and sixteen seconds of music takes about three.

```json
"audio": {
  "engine": "strudel",
  "pattern": "music.strudel.js",
  "bundle": "strudel.mjs",
  "cps": 0.625
}
```

```js
setcps(0.625) // a cycle is 1.6s, so a sixteen-second film is exactly ten of them

stack(
  note("c1").s("sine").struct("x ~ ~ ~ x ~ ~ ~").decay(.26).sustain(0),
  s("white").struct("x*8").decay(.03).sustain(0).hpf(7200).gain("[.3 .14]*4"),
  note("<c2 ab1 eb2 bb1>").s("sawtooth").lpf(sine.range(420, 1500).slow(4)),
  note("<c5 eb5 g5 bb4>(3,8)").s("triangle").delay(.4).room(.6)
)
```

`cps` is cycles per second, and it is the only number tying the pattern's grid
to the film's seconds. Pick one where a cycle divides the duration and you can
put the picture's cuts on the same boundaries — which is the difference between
a cut that lands on a downbeat and one that lands near it.

The WAV is rendered fresh each time, and noise voices come out slightly
different on each render — the same music with a different texture in the hats
and the reverb tail. `audio.seed` pins what the main thread decides; the rest
lives in an AudioWorklet with its own random. This is how synthesis works rather
than a problem to route around: the frames are the thing that has to be
identical, and they are. If you want one specific take, `seekreel audio` writes
the WAV and everything downstream reads it — keep that file and the film stops
changing.

Three things to know:

- **The file's last statement has to be the pattern.** An assignment evaluates
  to nothing, and the render says so rather than writing silence.
- **Strudel is fetched, not bundled.** `seekreel strudel` downloads the pinned
  850KB build next to your config, once. A project then renders against the
  version it fetched rather than whatever `npm install` brought in this week.
- **Synth voices render offline; samples do not.** `sine`, `sawtooth`,
  `triangle`, `square`, `white`, `pink` and `brown` need nothing. `s("bd")` and
  the drum banks download sample packs the first time they are asked for.

Anything you can write at [strudel.cc](https://strudel.cc) renders here, which
makes the REPL a usable preview: get the pattern right there, paste it into the
file, build.

### Cue sheets — sound that lands on cuts

A JSON sheet of one-off sounds placed by timestamp, over an optional looping
bed. Moving a shot half a second later is a one-number edit, and the file diffs
usefully against the version before it. This is still the better tool when the
soundtrack exists to punctuate a shot table rather than to be music.

```json
"audio": { "engine": "cues", "cues": "cues.json" }
```

```json
{
  "duration": 6,
  "bed": {
    "tempo": 100,
    "barsPerChord": 2,
    "progression": [{ "tones": ["D3", "F3", "A3", "C4"], "root": "D2" }],
    "figure": [0, 2, 1, 3],
    "dense": [1.2, 5.2]
  },
  "cues": [
    { "at": 0.1, "sound": "swell", "note": "F2", "dur": 1.4, "gain": 0.7 },
    { "at": 3.0, "sound": "pop" },
    { "at": 4.2, "sound": "chime", "pan": -0.2 }
  ]
}
```

`bed` is an optional looping music bed — a marimba figure over a chord
progression, a sine bass and a shaker. It thins out outside the `dense` window
so it can sit quietly under an opening. `cues` are one-off sounds placed at a
given time.

The available sounds are: `marimba`, `bass`, `pad`, `swell`, `chime`, `pip`,
`tick`, `shutter`, `pop`, `whoosh`, `stamp`, `tray` and `shaker`. Every cue
accepts `gain` and `pan` (−1 to +1); any other keys are passed to the sound
itself, so `note`, `dur`, `freq` and `seed` work wherever that sound supports
them. The whole synth is about three hundred lines in `src/audio/synth.py` —
it is worth reading, and easy to add to.

This engine needs `python3` (standard library only). The Strudel engine does
not: it renders in the browser seekreel already drives.

---

## What you need installed

- **Node 22.18 or newer.** seekreel is TypeScript and Node runs it directly;
  22.18 is the version where that stopped needing a flag.
- **Chromium.** Not bundled, because a browser is 150MB and most machines
  already have one. Either run
  `npm i -D playwright && npx playwright install chromium`, or point the
  `CHROMIUM` environment variable at any Chromium or Chrome binary.
- **ffmpeg with libx264.** `ffmpeg-static` is an optional dependency and gets
  used if it is installed; otherwise seekreel uses `ffmpeg` from your `PATH`, or
  whatever `FFMPEG` points at. The `webm` and `mov` formats also want
  `libvpx-vp9` and `prores_ks` — `seekreel doctor` says which ones you have.
- **python3**, but only for the `cues` audio engine. The `strudel` engine
  renders in the Chromium that is already there.

Run `seekreel doctor` to see which of these it can find.

---

## A full example

`examples/collection-dex` is a real 43-second film: twelve shots, a GSAP
timeline, a synthesized soundtrack, and a cue sheet lined up with the shot
table. If you are writing anything longer than a few seconds, it is the best
reference in the repo.

```sh
sh examples/collection-dex/setup.sh        # fonts, gsap, the noise plate
seekreel build -c examples/collection-dex/seekreel.config.json
```

It renders a marketing film for [Collection Dex](https://collectiondex.com),
the project seekreel was originally built for.

`examples/linkedin-promo` is the shorter one: a forty-second post promoting
seekreel, in plain JavaScript with one three.js shot, cut to the five sizes a
LinkedIn post needs from a single render. Its
[POST.md](examples/linkedin-promo/POST.md) carries the post text and alt text
that go with the video.

```sh
sh examples/linkedin-promo/setup.sh        # two typefaces and the strudel bundle
seekreel build -c examples/linkedin-promo/seekreel.config.json
```

`examples/three-orbit` is the 3D one: eight seconds of three.js, a camera whose
angle is a function of `t`, and software-rendered WebGL that comes out the same
on every machine.

```sh
sh examples/three-orbit/setup.sh           # three.js, fetched
seekreel build -c examples/three-orbit/seekreel.config.json
```

`examples/react-stage` is six seconds of React with no build step: browser
modules, htm templates, `flushSync`, done.

```sh
sh examples/react-stage/setup.sh           # react, react-dom and htm, fetched
seekreel build -c examples/react-stage/seekreel.config.json
```

---

## Things to know before you start

- **Rendering is slow** — roughly a second per frame. That is inherent to the
  approach: each frame is a page load and a screenshot. Use `probe` and
  `render a b` while you are iterating, and only do a full pass when you mean
  it.
- **A stage is loaded from `file://`**, so it cannot fetch anything over the
  network. Keep your fonts, scripts and images next to the page;
  `examples/collection-dex/setup.sh` shows how.
- **Fonts have to be loaded before the frame is captured.** seekreel waits for
  `document.fonts.ready`, which covers `@font-face`. If a font arrives some
  other way, wait for it yourself before marking the frame ready.
- **No transparency.** Output is yuv420p H.264, because that is what social
  platforms accept. If you need an alpha channel, encode the frames yourself.

---

## Written in TypeScript

The tool is TypeScript, and there is no build step. Node 22.18 and newer strip
the types at load time and run the files as they are, so what you clone is what
executes — no `dist/`, no watch process, and a stack trace points at the line
you edited.

That constrains the source to erasable syntax: no enums, no parameter
properties, no decorators. `tsconfig.json` sets `erasableSyntaxOnly`, so the
type checker rejects anything that would need compiling:

```sh
npm run typecheck     # tsc --noEmit, the only thing tsc does here
```

Stages stay HTML and JavaScript. A stage is loaded by a browser, and the browser
is the one thing in this pipeline that cannot strip types.

---

## For agents

[SKILLS.md](SKILLS.md) is the same tool described for something that is driving
it rather than learning it: the contract, the config, the commands, and the
failure modes that produce a file which is technically valid and visibly wrong.
The homepage has the same brief behind its *I'm an agent* fork.

---

## Licence

MIT. GSAP, if you use it, has [its own licence](https://gsap.com/licensing/) and
is not distributed here.
