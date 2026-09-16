# examples/linkedin-promo

A forty-second film promoting seekreel, rendered by seekreel, cut for a LinkedIn
post. Ten shots of four seconds, and every one of them is about what somebody
gets rather than how the tool works.

```sh
sh examples/linkedin-promo/setup.sh        # typefaces, the strudel bundle, three.js
seekreel build -c examples/linkedin-promo/seekreel.config.json
```

960 frames, then five encodes and a poster off the same frames. Most of the
stage is DOM and renders faster than the repo's one-second-a-frame rule of
thumb; the ninety-six frames of the 3D shot cost more, because `"webgl": true`
slows every frame in the film — three.js itself is imported only inside the
window that needs it.

Out the other end, in `deliver/`:

| File | Size | For |
|---|---|---|
| `seekreel-promo.mp4` | 1080×1080 | the feed post |
| `seekreel-promo-4x5.mp4` | 1080×1350 | the feed post, taller, for mobile |
| `seekreel-promo-vertical.mp4` | 1080×1920 | LinkedIn's vertical video feed |
| `seekreel-promo-loop.gif` | 1080×1080, 12fps | comments, DMs, a README |
| `seekreel-promo-silent.mp4` | 1080×1080 | posting it without a soundtrack |
| `seekreel-promo-poster.png` | frame 912 | the custom thumbnail |

The 4:5 and 9:16 variants pad the square render with white rather than cropping
it, which is why the config's `background` is `#ffffff` and why the layout keeps
to the square: the padding has to read as the page continuing, not as bars. The
square is first in the config because it is the one LinkedIn's feed treats best
on desktop and mobile alike.

[`POST.md`](POST.md) has the post text, the first comment, the alt text and
which file goes in which slot. The film carries every claim as on-screen type,
because LinkedIn autoplays muted.

## Why this cut looks different from the last one

The first version was a feature list narrated by the tool itself: a counter of
its own frames down the margin, a timestamp readout in the corner, a shot of a
scrubber demonstrating its own seek, commands typed at a prompt. All true, and
none of it a reason for anyone to install something.

This cut keeps the dope-sheet ruling as background texture and spends the
runtime on what a viewer gets — the video, the sizes it comes in, the 3D, the
music, the repository it lives in. That the film is itself a seekreel render is
a good proof point, so it sits in the caption where it costs no screen time.

Four seconds a shot is the other deliberate part. Everything is on screen inside
the first second and holds for the rest, because a viewer meeting a claim for
the first time needs the rest of the shot to finish reading it.

## The stage

`stage.html` obeys the three-rule contract and nothing else: it reads `t`, draws
that moment, and stamps `data-seekreel-ready`. Three details are worth stealing:

- **The ratio shot demonstrates rather than asserts.** A canvas changes shape
  while the picture inside it stays exactly the size it was — which is what a
  ratio does to a render, and what everyone assumes is a crop until they see it.
- **three.js is imported inside the shot that uses it.** Every frame is a fresh
  page load, so a top-level import would charge all 960 frames the parse time
  for the sake of 96. `if (t >= 12 && t <= 16) await import(...)` keeps the rest
  of the render on the DOM's budget.
- **The helpers come from `/_seekreel/stage.js`**, which seekreel serves with
  every render — `time`, `span`, `markReady`. Nothing is vendored to reach them.

The colours and both typefaces are `site/DESIGN.md`'s, so the film and the
homepage are demonstrably the same brand.

## Sound

`music.strudel.js` is the soundtrack, written in [Strudel](https://strudel.cc)
and rendered offline by `seekreel audio`. Every voice is synthesised, so the
render needs no network and the repo carries no audio.

It runs at `cps` 0.5, so a cycle is two seconds and the film is twenty of them.
The arrangement changes every two cycles — every four seconds, on the cut — so a
shot change lands on the downbeat the arrangement turns over on:

| Cycles | Seconds | Shot | Sound |
|---|---|---|---|
| 0–1 | 0–4 | the hook | pad, one rising sweep |
| 2–3 | 4–8 | a page, as frames | kick arrives |
| 4–5 | 8–12 | every size | hats and sub |
| 6–7 | 12–16 | 3D | bass, filtered wide |
| 8–9 | 16–20 | your own tools | snare on the backbeat |
| 10–11 | 20–24 | sound | the tune, alone for a bar |
| 12–13 | 24–28 | re-cut one shot | everything back |
| 14–15 | 28–32 | in your repo | bells an octave up |
| 16–17 | 32–36 | free, one command | the loudest it gets |
| 18–19 | 36–40 | the end card | pad and one bell |

Moving a section is one number in two files. That is the whole reason the
soundtrack is source rather than an audio asset.
