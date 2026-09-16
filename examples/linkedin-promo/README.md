# examples/linkedin-promo

A sixteen-second film promoting seekreel, rendered by seekreel, cut for a
LinkedIn post. One HTML file,
one JSON cue sheet, no animation library — every value on the stage is
arithmetic on `t`, which is the claim the film is making.

```sh
sh examples/linkedin-promo/setup.sh          # the two typefaces, fetched
seekreel build -c examples/linkedin-promo/seekreel.config.json
```

384 frames, then five encodes and a poster off the same frames. The repo's rule
of thumb is about a second per frame; this stage is light — no library, no
images — so it came in under two minutes on the machine it was cut on.

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
draws that moment, and stamps `data-seekreel-ready`. Two details are worth
stealing:

- **The dope-sheet margin is rebuilt, not moved.** There is no previous frame
  to move it from, so the ruled rows are computed from `t` every time and the
  numbers stop where the film does.
- **The typing in the commands shot is a string slice**, and the caret blinks
  off `Math.floor((t - at) * 3)`. A CSS animation would have its own clock and
  would be caught mid-blink at a different phase on every machine.

The colours and both typefaces are `site/DESIGN.md`'s, so the film and the
homepage are demonstrably the same brand.

## Sound

`cues.json` is the soundtrack: a four-chord bed under the whole thing, a stamp
on the wordmark, ticks while the scrubber drags, three pips for the three
rules, a tray click per command, and a shutter into the end card. Moving a beat
is one number in a JSON file that diffs.
