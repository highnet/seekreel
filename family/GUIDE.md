# Making a film with seekreel and the family pack

This guide takes you from a fresh install to your own film, using the family
pack's sample movie as the starting point. It assumes nothing beyond a
terminal; the parts that are about seekreel itself are marked, so you can
carry them to any project.

## 1. Install and check

The normal install includes the family pack:

```sh
curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh
seekreel doctor          # Chromium, ffmpeg and the formats it can write
```

The pack lives in `~/.seekreel/family`. Copy it somewhere you will work, so
updates to seekreel never touch your film:

```sh
cp -r ~/.seekreel/family ~/my-film && cd ~/my-film
sh setup.sh              # three.js, Motion, React, Strudel and the font → vendor/
```

(Installed with `--minimal`? Run the installer again without it and the pack
comes back.)

## 2. Render the sample, in pieces

**seekreel:** a film is a web page that draws itself at a timestamp. seekreel
loads it once per frame with `?t=seconds`, screenshots it, and stitches the
frames. Nothing on the page may keep its own clock — every value comes from
`t` — which is why frame 512 is the same picture on every render.

Look before you render. `probe` draws single moments into `probe/`:

```sh
seekreel probe 2,6,14,26,31,46 -c movie.config.json
```

Then render and encode everything in one go:

```sh
seekreel build -c movie.config.json
# → deliver/family.mp4, family-vertical.mp4, family-loop.gif, family-poster.png
```

`build` is `audio`, then `render`, then `encode`. It costs about a second per
frame on a laptop (1,152 frames for this film). Two things save that time
later:

- `seekreel render 480 620 -c movie.config.json` redraws only frames 480–620.
- `seekreel encode -c movie.config.json` re-cuts every variant from frames
  already on disk, in seconds.

Frames are independent, so you can also split a long render across cores:
run `render 0 383`, `render 384 767` and `render 768 1151` in three terminals.

## 3. Read the sample movie

Open `movie/stage.html`. It is one React tree, and the whole film is in it:

```js
import { html, World, film } from "../kit/react.js";
import { Sky, Vignette, Captions, Bubble, ChapterCard, Photo, Credit } from "../kit/ui.js";
import { createWorld } from "../kit/world.js";
import { t } from "../kit/timing.js";
import { picnic, getaway, gallery } from "../kit/sets.js";
```

Three things happen, in this order:

1. **Build the 3D world for this moment.** `createWorld()` makes a renderer,
   camera and lights; a set (`picnic(world, t - 8)`) fills it and points the
   camera. Sets take *local* time — seconds since the set began — so the same
   set works on its own (`scenes/picnic.html`) or 8 seconds into a film.
2. **Describe the frame in React.** `<World>` mounts the canvas; `<Captions>`,
   `<Bubble>`, `<Photo>` and `<ChapterCard>` draw on top. Every component
   takes `now` and is a pure function of it.
3. **Render once.** `film(element)` renders synchronously and marks the frame
   ready when fonts and photos have loaded.

**seekreel + React:** React 19 schedules renders, so a stage has to force the
commit with `flushSync` or the screenshot catches an empty page — `film()` does
this for you through `renderReact` from `/_seekreel/stage.js`. The other rule
is purity: no `useState`, no `useEffect`, nothing that arrives after the
commit. There is no "previous frame" to remember; each frame is a fresh page.

## 4. Make it yours

### Change the words

Captions are data:

```js
const LINES = [
  { at: 8.6, to: 11.2, text: "Meet the Blobs." },
  { at: 15.5, to: 17.6, s: "aside", text: "(fries. the hobby is fries.)" },
  { at: 44.6, to: 47.9, s: "big", text: "A new masterpiece." },
];
```

`s` picks the style: normal, `aside` (smaller, softer), `big` (the hero line at
the top) or `title`. Words pop in one by one on a Motion spring.

Speech bubbles hang over an actor:

```js
<${Bubble} text="hey!" at=${12.8} to=${14.2} xy=${world.above(cast.me)} now=${t} />
```

Chapter cards are a list of `{ at, n, title }`, each four seconds long.

### Use your own photos

Put images in `photos/` and show them two ways:

```js
/* a photo that springs up over the scene, as a polaroid or in a gold frame */
<${Photo} src="../photos/us.jpg" x=${85} y=${30} r=${5} label="exhibit A" at=${15.6} to=${19.5} now=${t} look="polaroid" />

/* or hang them in the museum */
cast = await gallery(world, t - 38, { art: [
  { src: "photos/us.jpg", title: "Us", line: "day one – ongoing" },
  { src: "photos/beach.jpg", title: "The Beach", line: "sun, sea, sleep" },
] });
```

Photos of real people are personal. If your film lives in a git repository,
keep them out of it — add `photos/` (or a `*.private.*` pattern for a private
copy of the stage) to `.gitignore`.

### Recast the characters

Everything in `kit/actors.js` is a builder you call with the pose for this
moment:

```js
const h = hop(2, 4, 3, 0.5);                 // three hops between 2s and 4s
const me = kit.glasses(kit.cap(kit.blob({ color: "#ffd27a", open: blink(0), squash: h.squash })));
me.group.position.set(-2 + h.u * 4, h.y, 0);
```

Blobs take `color`, `happy`, `mouth`, `blush`, `eyes` and `squash`;
accessories stack (`kit.bow(kit.hairBun(kit.blob()))`). For motion along a
path, `track(keys)` walks keyframes and can hop between them; for the camera,
`shot(keys)` eases between framings.

### Change the music

`music/bossa.strudel.js` is arranged in bar ranges. At `cps 0.5` a bar is two
seconds, so bar 17 is second 34 — exactly where the museum card lands. To
make the film longer, raise `BARS` and `duration` together and extend the
ranges:

```js
const BARS = 24;
const LEAD = bars([1, 10]);          // the whistled tune plays bars 1–9
const BELLS = bars([19, 24]);        // bells for the ending
```

**seekreel:** `seekreel audio` renders the pattern offline, in the same
Chromium, to `out/family.wav`; every later step reuses that file. Only
synthesized voices (`sine`, `triangle`, `white`…) render offline; sample packs
would need the network. And Strudel reads every double-quoted string as a
pattern, so plain JavaScript strings in the setup code use single quotes.

### Change the length or the order

Scenes are placed by time in `movie/stage.html` (`if (t < 20) … picnic`).
Move a set by changing its offset, and keep cuts on bar lines (even seconds)
so they land on the beat. To splice a new scene into a film that is already
timed without renumbering everything after it, use `splice()` from
`kit/timing.js`:

```js
const { story, active, local } = splice([{ at: 68, len: 16, story: 68 }]);
// story: the time your old code expects; active/local: the inserted scene's clock
```

## 5. Deliver

`movie.config.json` lists the variants: the 16:9 MP4, a 9:16 vertical (padded,
not cropped — add `"fit": "cover"` to crop), and a looping GIF. Add a
`"poster"` timestamp for a thumbnail. `seekreel encode` rebuilds them all from
the frames on disk.

If a file is too big to send, re-encode a copy at a lower bitrate with the
ffmpeg seekreel already uses; the frames are unchanged.

## Troubleshooting

- **A frame is blank.** Something marked ready too early — a texture or font
  that had not loaded. Await it before rendering (the gallery set awaits its
  textures and `document.fonts.load`).
- **Something moves on its own between renders.** A CSS transition, a
  `requestAnimationFrame` or an unseeded `Math.random`. Compute it from `t`;
  use `rng(seed)` from `kit/timing.js` for randomness.
- **"the pattern file evaluated to nothing".** The last statement of the
  Strudel file must be the pattern itself (`stack(...)`).
- **The render is slow.** It is about a second a frame with WebGL. Probe first,
  render in parallel chunks, and re-render only the frames you changed.
