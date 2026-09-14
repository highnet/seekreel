# seekreel

Render an animated HTML page to video by seeking it, one frame at a time.

You write a page that draws the frame for a given timestamp. seekreel asks it
for every timestamp in turn, screenshots each one, and hands the stack to
ffmpeg. A 43-second film comes out as an MP4 you can upload.

```sh
npm i -g seekreel          # or npx seekreel
seekreel init my-film
cd my-film
seekreel build
# deliver/reel.mp4, deliver/reel-4x5.mp4, deliver/reel-silent.mp4
```

## Why do it this way

Screen-recording an animation gives you whatever the machine managed to draw
that time: dropped frames on a busy laptop, a font that arrived late, a
scroll that landed two pixels off. Re-cutting one shot means recording the
whole thing again, and the recording is not the source — the page is, and the
two drift.

seekreel makes the film **a pure function of time**. Frame 512 is whatever the
page draws at `t=21.333`, every time, on any machine. Which buys three things
that are hard to get any other way:

- **One frame is examinable on its own.** `seekreel probe 21.3` gives you that
  frame as a PNG, in a second, without rendering the other thousand.
- **One shot is re-renderable on its own.** Change the middle of the film and
  `seekreel render 480 620` redraws only those frames, in place.
- **The film is a file in your repo.** It diffs, it reviews, and it rebuilds
  in CI. Nobody has to remember how it was made.

The cost is honest: rendering is a screenshot per frame, so budget about a
second each. A 43-second film at 24fps takes roughly twenty minutes. That is
fine for something you cut once and re-cut in pieces, and wrong for anything
interactive.

## The contract

A stage is any HTML file that does three things:

1. reads `t` (in seconds) from the query string,
2. draws the frame for that timestamp, synchronously,
3. stamps `data-seekreel-ready` on `<html>` when the frame is final.

That is the whole interface. There is no seekreel runtime on the page and
nothing to import.

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

`data-ready` is accepted as an alias, so a page written against an earlier
version still renders.

### Using an animation library

Hand-rolling easing gets old fast. Anything that can be **seeked** works, and
GSAP is the comfortable choice: build a paused timeline, then seek it once.

```js
const tl = gsap.timeline({ paused: true });
tl.from("#card", { y: 24, opacity: 0, duration: 0.9, ease: "expo.out" }, 0.1)
  .to("#bar i", { scaleX: 1, duration: 3.4, ease: "power1.inOut" }, 1.2)
  .to(".tray", { opacity: 1, duration: 0.5, stagger: 0.13 }, 6.0);

tl.time(t);                     // the only line that touches the clock
```

Two rules come with that, and both are load-bearing:

- **Do not use callbacks for anything you need to see.** GSAP suppresses
  `onStart` / `onComplete` on a seek, so a callback-driven typewriter renders
  blank. Animate properties instead — reveal text with a `clip-path` mask
  rather than writing it a character at a time.
- **Do not animate with CSS transitions or keyframes.** They have a clock of
  their own and will render whichever frame they happened to be on.

Text content is not a tweened property, so compute it from `t` in plain
JavaScript rather than trying to tween it.

## Commands

```
seekreel init [dir]          scaffold a project
seekreel doctor              check Chromium, ffmpeg and python
seekreel probe <t,t,...>     render just those timestamps, into probe/
seekreel render [a] [b]      render every frame, or frames a..b in place
seekreel audio               render the cue sheet to a WAV
seekreel encode              frames (+ WAV) -> deliver/*.mp4
seekreel build               audio, then render, then encode
```

`-c, --config <path>` points at a config other than `./seekreel.config.json`.
Every path inside a config is resolved against the config file, so
`seekreel build -c examples/collection-dex/seekreel.config.json` works from
anywhere in the tree.

## Config

```json
{
  "name": "reel",
  "stage": "stage.html",
  "duration": 43,
  "fps": 24,
  "width": 1080,
  "height": 1080,
  "poster": 22.1,
  "audio": { "cues": "cues.json", "wav": "soundtrack.wav" },
  "variants": [
    { "name": "" },
    { "name": "4x5", "scale": "1080:1080", "pad": "1080:1350:0:135:color=0xedefec" },
    { "name": "silent", "audio": false }
  ]
}
```

| key | what it does |
| --- | --- |
| `name` | basename of the output files. Defaults to the directory's name. |
| `duration`, `fps` | how many frames, and what timestamps they sit at. |
| `width`, `height` | viewport, in CSS pixels at scale 1. Both must be even — H.264 cannot encode an odd dimension. |
| `poster` | a timestamp to also write as a PNG. Omit for none. |
| `audio` | omit entirely for a silent film. |
| `variants` | one MP4 each. `scale` and `pad` are passed to ffmpeg's filters; `audio: false` drops the track. |
| `readySelector` | override if your stage signals readiness some other way. |
| `encode` | `crf`, `preset`, `audioBitrate`, `keyint`. |

## Sound

Soundtracks are synthesized from a JSON cue sheet — no sample library, no
licences to track, and a shot moving by half a second is one number to change.
`seekreel audio` renders it; `seekreel build` does that first.

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

`bed` is an optional looping music bed: a marimba figure over a chord
progression, a sine bass, and a shaker, thinned outside the `dense` window so
it can sit under a quiet opening. `cues` are one-off sounds placed by time.

Available sounds: `marimba` `bass` `pad` `swell` `chime` `pip` `tick`
`shutter` `pop` `whoosh` `stamp` `tray` `shaker`. Every cue takes `gain` and
`pan` (−1 to +1); the rest of its keys go to the sound, so `note`, `dur`,
`freq` and `seed` work wherever that sound takes them. The whole kit is about
three hundred lines of `src/audio/synth.py` — read it, and add to it.

Needs `python3` (standard library only). Nothing else here does.

## Requirements

- **Node 20+**
- **Chromium.** Not bundled — a browser is 150MB and most machines have one.
  `npm i -D playwright && npx playwright install chromium`, or point
  `CHROMIUM` at any Chromium or Chrome binary.
- **ffmpeg with libx264.** `ffmpeg-static` is an optional dependency and is
  used if present; otherwise `ffmpeg` from your `PATH`, or set `FFMPEG`.
- **python3**, for audio only.

`seekreel doctor` tells you which of those it can find.

## The worked example

`examples/collection-dex` is a real 43-second film: twelve shots, a GSAP
timeline, a synthesized soundtrack, and a cue sheet pinned to the shot table.
It is the best documentation of how to write a stage that is longer than a
paragraph.

```sh
sh examples/collection-dex/setup.sh        # fonts, gsap, the noise plate
seekreel build -c examples/collection-dex/seekreel.config.json
```

It renders a marketing film for [Collection Dex](https://collectiondex.com),
which is where this tool came from.

## Known edges

- **Rendering is slow**, about a second a frame. That is inherent: it is a
  navigation and a screenshot per frame. Use `probe` and `render a b` while you
  iterate and only do a full pass when you mean it.
- **A stage is `file://`**, so it cannot fetch anything over the network.
  Vendor your fonts, scripts and images next to it; the example's `setup.sh`
  shows the shape.
- **Fonts must be loaded before the shot.** seekreel waits on
  `document.fonts.ready`, which handles `@font-face`, but a font arriving by
  some other route is yours to wait for before you stamp ready.
- **No transparency.** Output is yuv420p H.264, because that is what feeds
  accept. If you need alpha, encode the frames yourself.

## Licence

MIT. GSAP, if you use it, has [its own licence](https://gsap.com/licensing/)
and is not distributed here.
