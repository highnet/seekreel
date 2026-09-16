# examples/linkedin-promo

A sixteen-second film promoting seekreel, rendered by seekreel, cut for a
LinkedIn post. One HTML file,
one JSON cue sheet, no animation library — every value on the stage is
arithmetic on `t`, which is the claim the film is making.

```sh
sh examples/linkedin-promo/setup.sh          # the two typefaces, fetched
seekreel build -c examples/linkedin-promo/seekreel.config.json
```

1152 frames, then five encodes and a poster off the same frames. Most of the
stage is DOM and renders faster than the repo's one-second-a-frame rule of
thumb; the ninety-six frames of the 3D shot cost about half a second each,
because three.js is imported only inside the window that needs it rather than on
every frame of the film.

Out the other end, in `deliver/`:

| File | Size | For |
|---|---|---|
| `seekreel-promo.mp4` | 1080×1080 | the feed post |
| `seekreel-promo-4x5.mp4` | 1080×1350 | the feed post, taller, for mobile |
| `seekreel-promo-vertical.mp4` | 1080×1920 | LinkedIn's vertical video feed |
| `seekreel-promo-loop.gif` | 1080×1080, 12fps | comments, DMs, a README |
| `seekreel-promo-silent.mp4` | 1080×1080 | posting it without a soundtrack |
| `seekreel-promo-poster.png` | frame 355 | the custom thumbnail |

The 4:5 and 9:16 variants pad the square render with white rather than cropping
it, which is why the config's `background` is `#ffffff` and why the layout
keeps to the square: the padding has to read as the page continuing, not as
bars. The square is first in the config because it is the one LinkedIn's feed
treats best on both desktop and mobile.

[`POST.md`](POST.md) has the post text, the first comment, the alt text and
which file goes in which slot. The film carries every claim as on-screen type
because LinkedIn autoplays muted.

## The stage

`stage.html` obeys the three-rule contract and nothing else: it reads `t`,
draws that moment, and stamps `data-seekreel-ready`. Three details are worth
stealing:

- **three.js is imported inside the shot that uses it.** Every frame is a fresh
  page load, so a top-level import would cost all 1152 frames the parse time for
  the sake of 96 of them. `if (t >= 20 && t <= 24) await import(...)` keeps the
  rest of the render on the DOM's budget.

- **The dope-sheet margin is rebuilt, not moved.** There is no previous frame
  to move it from, so the ruled rows are computed from `t` every time and the
  numbers stop where the film does.
- **The typing in the commands shot is a string slice**, and the caret blinks
  off `Math.floor((t - at) * 3)`. A CSS animation would have its own clock and
  would be caught mid-blink at a different phase on every machine.

The colours and both typefaces are `site/DESIGN.md`'s, so the film and the
homepage are demonstrably the same brand.

## Sound

`music.strudel.js` is the soundtrack, written in [Strudel](https://strudel.cc)
and rendered offline by `seekreel audio` — no realtime playback, no recording,
the same WAV every time. Every voice is synthesised, so the render needs no
network and the repo carries no audio.

It runs at `cps` 0.5, so a cycle is two seconds and the film is twenty-four of
them. The arrangement changes every two cycles — every four seconds, on the cut —
so a shot change lands on the downbeat the arrangement turns over on:

| Cycles | Seconds | Shot | Sound |
|---|---|---|---|
| 0–1 | 0–4 | the wordmark | pad, one rising sweep |
| 2–3 | 4–8 | the contract | kick arrives |
| 4–5 | 8–12 | determinism | hats and sub |
| 6–7 | 12–16 | the commands | bass starts moving |
| 8–9 | 16–20 | the deliverables | snare on the backbeat |
| 10–11 | 20–24 | 3D | filtered down, low and wide |
| 12–13 | 24–28 | React, GSAP, plain JS | everything back, bells in |
| 14–15 | 28–32 | sound | breakdown — bass and bells alone |
| 16–17 | 32–36 | TypeScript | full again |
| 18–19 | 36–40 | install | bells an octave up |
| 20–21 | 40–44 | the repository | the loudest it gets |
| 22–23 | 44–48 | the end card | pad and one bell |

Moving a section is one number in two files. That is the whole reason the
soundtrack is source rather than an audio asset.
