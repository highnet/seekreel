# seekreel — a skill file for agents

What this is: the operating manual for driving seekreel without reading the
homepage's argument or the README's prose. If you are a person, the README is
friendlier and [seekreel.vercel.app](https://seekreel.vercel.app) is friendlier
still.

## In one paragraph

seekreel renders an animated web page to video by seeking it. The page draws
the frame belonging to a timestamp; seekreel loads it once per frame, screenshots
each one, and ffmpeg stitches the frames into every variant the config asks for.
Frame N is the same picture on any machine and on any run, because it is derived
from a number rather than captured from a clock. The cost is a page load and a
screenshot per frame — about a second each, so a 43-second film is roughly twenty
minutes.

Use it for a film that is cut once and then edited in pieces: a launch video, a
feature reel, a social post, a loop for a store page. Do not use it for anything
interactive, and do not reach for it when a screen recording of a real product
session is what was actually asked for.

## Install

There is no npm registry package. seekreel is distributed by git:

```sh
curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh
```

That clones to `~/.seekreel`, installs `playwright-core`, and links the CLI into
`~/.local/bin`. `SEEKREEL_HOME`, `SEEKREEL_BIN` and `SEEKREEL_REF` override
where and what. To work from a checkout instead, with no install at all:

```sh
git clone https://github.com/highnet/seekreel && cd seekreel
npm install --omit=dev
node bin/seekreel.ts doctor
```

`bin/seekreel.ts` is TypeScript and Node runs it as it is — there is no build
step, no `dist/`, and nothing to compile before using the repository.

## Requirements

- Node 22.18+. The tool is TypeScript run through Node's own type stripping,
  which stopped needing a flag in 22.18.
- A Chromium. seekreel finds one from a `playwright` install, or takes
  `CHROMIUM=/path/to/chrome`.
- ffmpeg with libx264. `ffmpeg-static` is an optional dependency and is used if
  present; `FFMPEG=/path/to/ffmpeg` overrides.
- python3, **only** for the `cues` audio engine. The `strudel` engine does not
  need it.

Run `seekreel doctor` before a long render. It reports all of the above and
which formats are encodable.

## The contract

A stage is any HTML file that does three things:

1. Reads `t`, in seconds, from the query string.
2. Draws the frame for that timestamp, synchronously.
3. Sets `data-seekreel-ready` on `<html>` when the frame is final.

```html
<div id="box"></div>
<script>
  const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");
  const span = (a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  box.style.opacity = span(0, 1);
  box.style.transform = `translateY(${40 * (1 - span(0, 1))}px)`;

  document.documentElement.setAttribute("data-seekreel-ready", "1");
</script>
```

There is no library to import and no seekreel API on the page. A canvas draw, a
charting library or a paused GSAP timeline seeked with `tl.time(t)` all satisfy
the contract equally.

## 3D and WebGL

Set `"webgl": true` in the config for a three.js or raw-WebGL stage. It launches
Chromium with ANGLE on SwiftShader — software rendering, so the scene shades the
same on every machine rather than picking up whatever driver is present. Two
renders of one timestamp in two processes give the same PNG byte for byte.

The contract is unchanged; what changes is that the renderer is asked for one
frame instead of being driven by `requestAnimationFrame`:

```js
import * as THREE from "./three.module.js";     // stages are served, so this works

const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");
const angle = (t / DURATION) * Math.PI * 2;      // never `+= 0.01`
camera.position.set(Math.sin(angle) * 11.5, 4.4, Math.cos(angle) * 11.5);
camera.lookAt(0, 1.1, 0);

renderer.render(scene, camera);
document.documentElement.setAttribute("data-seekreel-ready", "1");
```

- three.js ships as an ES module. That works because seekreel serves the project
  directory on a loopback port for the length of the render rather than opening
  the stage from `file://`, where a module import is a cross-origin request.
  `fetch` of a file beside the stage works for the same reason.
- Fetch three.js into the project (`examples/three-orbit/fetch-three.sh` does);
  the module build needs **both** `three.module.js` and `three.core.js`, and
  missing the second shows up only as a 404 at render time.
- An `AnimationMixer` is driven with `mixer.setTime(t)`, never
  `mixer.update(delta)`.
- Budget about two seconds a frame rather than one, more with real shading.

## React

The contract is unchanged; one detail is mandatory.

```js
import { createRoot } from "./vendor/react-dom-client.js";
import { flushSync } from "./vendor/react-dom.js";
import { time, renderReact } from "/_seekreel/stage.js";

renderReact({ root: createRoot(document.getElementById("stage")), flushSync },
            html`<${Film} t=${time()} />`);
```

- **`flushSync` or the frame is blank.** React 19 schedules rendering, so
  `root.render()` returns before the commit. Marking ready on the next line
  screenshots an empty document, silently, on every frame.
- **`/_seekreel/stage.js` is served with every render** — `time`, `span`,
  `frame`, `markReady`, `markReadyWhenLoaded`, `renderReact`. Nothing to install
  or vendor. Types in `src/stage/stage.d.ts`.
- **Pure props only.** No state that survives a page load, no `useEffect` (it
  runs after the commit), no suspense fallback where the real content should be.
  Await data, then render, then mark ready.
- **JSX needs a bundler; React does not.** `examples/react-stage` uses htm
  tagged templates and browser modules to avoid a build step. With a bundler,
  point `stage` at the HTML it writes.

## Commands

| Command | What it does |
|---|---|
| `seekreel init [dir]` | scaffold a project from the starter template |
| `seekreel doctor` | check Chromium, ffmpeg and the formats |
| `seekreel probe <t,t,...>` | render only those timestamps into `probe/` |
| `seekreel render [a] [b]` | render every frame, or only frames a..b, in place |
| `seekreel audio` | render the soundtrack to a WAV |
| `seekreel encode` | cut every variant from the frames already on disk |
| `seekreel build` | audio, then render, then encode |

`-c, --config <path>` points any command at a config elsewhere; every path
inside a config resolves against the config file, not the working directory.

**Work in this order.** `probe` a few timestamps and look at the PNGs before
rendering anything. After a full render, `encode` alone re-cuts every variant in
seconds, and `render a b` redraws one shot in place. Re-running `build` because
one number changed costs twenty minutes for no reason.

## Config

```json
{
  "name": "reel",
  "stage": "stage.html",
  "duration": 16,
  "fps": 24,
  "width": 1080,
  "height": 1080,
  "background": "#ffffff",
  "poster": 14.8,
  "audio": { "engine": "strudel", "pattern": "music.strudel.js", "cps": 0.625 },
  "webgl": false,
  "variants": [
    { "name": "" },
    { "name": "4x5",      "ratio": "4:5" },
    { "name": "vertical", "ratio": "9:16" },
    { "name": "loop",     "format": "gif", "fps": 12 },
    { "name": "silent",   "audio": false }
  ]
}
```

- `width`/`height` must both be even. H.264 cannot encode an odd dimension.
- A variant's `ratio` keeps the picture and changes the canvas, padding with
  `background`. `"fit": "cover"` crops instead. `size` names pixels directly.
- A variant's `fps` may be lower than the render's, never higher: frames that
  were never drawn cannot be invented.
- `poster` is a timestamp; it writes `<name>-poster.png` next to the videos.
- Formats: `mp4` (H.264+AAC), `webm` (VP9+Opus), `gif` (palette-mapped),
  `mov` (ProRes 422 HQ).

## Sound

Two engines. Pick by what the soundtrack is for.

**`cues`** — a JSON sheet of synthesized one-off sounds placed by timestamp,
over an optional looping bed. Right when the sound exists to land on cuts.
Needs python3 and its standard library, nothing else.

```json
{ "duration": 16,
  "cues": [ { "at": 3.2, "sound": "stamp" }, { "at": 12.8, "sound": "chime" } ] }
```

**`strudel`** — a pattern in the [Strudel](https://strudel.cc) language, which
is TidalCycles' language in JavaScript. Right when you want music with a grid of
its own. seekreel queries the pattern once for the whole film and renders it
through an `OfflineAudioContext` in the same Chromium that shoots the frames, so
it needs no python and no realtime playback.

```js
setcps(0.625) // a cycle is 1.6s, so a 16s film is exactly ten of them

stack(
  note("c1").s("sine").struct("x ~ ~ ~ x ~ ~ ~").decay(.26).sustain(0),
  s("white").struct("x*8").decay(.03).hpf(7200).gain("[.3 .14]*4"),
  note("<c2 ab1 eb2 bb1>").s("sawtooth").lpf(sine.range(420, 1500).slow(4))
)
```

Rules that bite:

- The file's last statement must **be** the pattern. An assignment evaluates to
  nothing and the render fails with exactly that message.
- Strudel is not bundled. Fetch it into the project and point `audio.bundle` at
  it (default `strudel.mjs` beside the config):
  `curl -fsSL -o strudel.mjs https://cdn.jsdelivr.net/npm/@strudel/web@1.3.0/dist/index.mjs`
- Sample-based sounds (`s("bd")`, drum banks, soundfonts) fetch packs over the
  network. Synth voices — `sine`, `sawtooth`, `triangle`, `square`, `white`,
  `pink`, `brown` — render offline. Prefer them unless the project has already
  vendored samples.
- **Noise is not reproducible.** Oscillator voices render byte-identical run to
  run, and `audio.seed` pins everything the main thread decides. Noise voices and
  reverb tails are built inside an AudioWorklet — its own JS realm, its own
  `Math.random`, unreachable from outside — so those are the same music with a
  different texture each render. Render the WAV once and keep it if bytes matter.
- `cps` is the only number tying the pattern's grid to the film's seconds. Pick
  one where a cycle divides the duration, then put the picture's cuts on the
  same boundaries: that is what makes a cut land on a downbeat instead of near
  one.

## Failure modes

These produce a file that is technically valid and visibly wrong, which is worse
than an error.

- **A CSS animation or transition.** It has a clock of its own and will be
  caught at a different phase on every machine. Set the property from `t`.
- **`requestAnimationFrame`, `Date.now()`, unseeded `Math.random()`.** Same
  problem: state that does not come from `t` cannot survive one page load per
  frame. Seed your randomness from the frame index if you want grain.
- **Marking ready too early.** `data-seekreel-ready` promises the picture is
  final. seekreel waits for `document.fonts.ready` itself; an image, a fetch or a
  worker is yours to await first.
- **Fonts that arrive some other way** than `@font-face` — wait for them
  yourself before stamping ready.
- **Assuming a ratio crops.** It pads. Say `"fit": "cover"` if you meant crop.
- **Re-rendering to fix an encode.** `encode` re-cuts from frames on disk.
- **Reaching for `npm i -g seekreel`.** There is no registry package. Install
  with the curl line or a clone; both are above.
- **Adding a build step.** The source is TypeScript in erasable syntax only —
  no enums, no parameter properties, no decorators — so Node can run it
  untouched. `npm run typecheck` is `tsc --noEmit` and emits nothing by design.
- **Claiming things about the tool that are not true.** It is not on npm; it has
  no adoption numbers; rendering really does cost about a second per frame. If
  you are writing marketing copy with it, say that.

## Worked examples

- `examples/linkedin-promo` — sixteen seconds, plain JavaScript, a Strudel
  soundtrack, five deliverables from one render. Its `POST.md` is the post copy
  that ships with the video.
- `examples/three-orbit` — eight seconds of three.js: `"webgl": true`, a camera
  angle computed from `t`, and frames that match byte for byte across processes.
- `examples/react-stage` — six seconds of React with no build step: browser
  modules, htm templates, `flushSync`, `renderReact`.
- `examples/collection-dex` — forty-three seconds, a paused GSAP timeline, a
  JSON cue sheet lined up with a shot table.
- `templates/starter` — what `seekreel init` writes: the contract in ninety
  lines with no dependencies.

## If you are making something for a person to publish

Render the variants their platform actually takes, give them the poster frame
for a thumbnail, and write the copy in a file next to the video rather than in
chat where it will be lost. Do not invent numbers, testimonials or benchmarks to
fill a caption — the honest cost of the tool is part of what makes the claim
credible.
