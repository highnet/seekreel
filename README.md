# seekreel

**Turn an animated web page into a video file — one frame at a time.**

You write a normal HTML page that knows how to draw itself at any moment in
time. seekreel walks through every moment in the video, screenshots the page at
each one, and stitches the screenshots into an MP4 with ffmpeg.

```sh
npm i -g github:highnet/seekreel     # installs straight from this repository
seekreel init my-film
cd my-film
seekreel build
# → deliver/reel.mp4, reel-4x5.mp4, reel-story.mp4, reel-loop.gif, reel-silent.mp4
```

There is a homepage too, with a viewer you can scrub:
**[seekreel.vercel.app](https://seekreel.vercel.app)**

**Contents**

- [Why not just screen-record it?](#why-not-just-screen-record-it)
- [How a page talks to seekreel](#how-a-page-talks-to-seekreel)
- [Animating with GSAP](#animating-with-gsap)
- [Commands](#commands)
- [Configuration](#configuration)
- [Sound](#sound)
- [What you need installed](#what-you-need-installed)
- [A full example](#a-full-example)
- [Things to know before you start](#things-to-know-before-you-start)

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

## Commands

| Command | What it does |
| --- | --- |
| `seekreel init [dir]` | Scaffold a new project |
| `seekreel doctor` | Check that Chromium, ffmpeg and python are available |
| `seekreel probe <t,t,...>` | Render only those timestamps, into `probe/` |
| `seekreel render [a] [b]` | Render every frame, or just frames `a` to `b`, in place |
| `seekreel audio` | Render the cue sheet to a WAV file |
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
  "audio": { "cues": "cues.json", "wav": "soundtrack.wav" },
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

Soundtracks are synthesized from a JSON cue sheet. There is no sample library to
ship and no licences to keep track of, and moving a shot half a second later is
a one-number edit. `seekreel audio` renders the cue sheet; `seekreel build` does
it for you first.

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

Audio needs `python3` (standard library only). Nothing else in seekreel does.

---

## What you need installed

- **Node 20 or newer.**
- **Chromium.** Not bundled, because a browser is 150MB and most machines
  already have one. Either run
  `npm i -D playwright && npx playwright install chromium`, or point the
  `CHROMIUM` environment variable at any Chromium or Chrome binary.
- **ffmpeg with libx264.** `ffmpeg-static` is an optional dependency and gets
  used if it is installed; otherwise seekreel uses `ffmpeg` from your `PATH`, or
  whatever `FFMPEG` points at. The `webm` and `mov` formats also want
  `libvpx-vp9` and `prores_ks` — `seekreel doctor` says which ones you have.
- **python3**, but only if you want sound.

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

`examples/linkedin-promo` is the shorter one: a sixteen-second post promoting
seekreel, in plain JavaScript with no animation library, cut to the five sizes
a LinkedIn post needs from a single render. Its
[POST.md](examples/linkedin-promo/POST.md) carries the post text and alt text
that go with the video.

```sh
sh examples/linkedin-promo/setup.sh        # two typefaces, nothing else
seekreel build -c examples/linkedin-promo/seekreel.config.json
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

## Licence

MIT. GSAP, if you use it, has [its own licence](https://gsap.com/licensing/) and
is not distributed here.
