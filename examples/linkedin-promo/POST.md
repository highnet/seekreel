# LinkedIn post — seekreel

The video in this folder is the post. Everything below is the text that goes
with it. Nothing here claims anything that is not true of the tool as
published: no adoption numbers, no benchmarks beyond the honest cost of about
a second per frame.

## What to upload

| Slot | File | Why |
|---|---|---|
| Feed video | `deliver/seekreel-promo.mp4` | 1080×1080, 48 seconds. The square is the safe feed shape on LinkedIn and reads the same on desktop and mobile. |
| Feed video, taller | `deliver/seekreel-promo-4x5.mp4` | 1080×1350, if you want more vertical space in a mobile feed. |
| Vertical video feed | `deliver/seekreel-promo-vertical.mp4` | 1080×1920, for LinkedIn's vertical video surface. |
| Thumbnail | `deliver/seekreel-promo-poster.png` | Frame 1104 — the end card, wordmark, clone command and URL. |
| Comment, DM, or the repo README | `deliver/seekreel-promo-loop.gif` | 12fps, silent, plays anywhere a video player is not welcome. |

Upload the poster as the custom thumbnail. LinkedIn otherwise picks its own,
and the film opens on near-empty white, which is a good opening and a bad
still.

## Post

The first two lines are what shows before "…see more". They have to carry the
idea on their own.

> Your launch film should live in the repo, not in someone's Downloads folder.
>
> I built seekreel to make that possible: it renders an animated web page to
> video by seeking it, one frame at a time. Frame 512 is always "whatever the
> page looks like at t = 21.333" — on any machine, every time.
>
> The forty-eight seconds above are the whole feature list, rendered with the
> tool itself:
>
> → The contract is three lines. Read t from the URL, draw that frame, set
> data-seekreel-ready. There is no library to import.
> → Deterministic by construction. Nothing is recorded; every pixel is computed.
> → Four commands. probe one moment in about a second, render a range in place,
> encode every variant off frames already on disk, or build to do all three.
> → One render, every cut. 1:1, 4:5, 9:16, a named pixel size, mp4, webm, mov,
> gif, a silent copy and a poster frame — all from the same pass.
> → 3D with three.js, rendered through software GL so every machine agrees on
> the pixels, byte for byte.
> → React, GSAP, three.js or no library at all. If it runs in a browser, it
> ships as video.
> → The soundtrack is source too: a Strudel pattern rendered offline, or a JSON
> cue sheet when it just has to land on cuts.
> → TypeScript with no build step. Node runs it as it is — what you clone is
> what executes.
> → Installed by git, not by a package registry. One curl line, or clone it.
>
> The trade-off is real and worth stating: one screenshot per frame, so budget
> about a second per frame, two for WebGL. It is the right tool for a film you
> cut once and then tweak in pieces, and the wrong one for anything interactive.
>
> MIT, and free. Install it with one line, no package registry involved:
> `curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh`
>
> Homepage, with a scrubbable viewer and a 3D one you can drive yourself:
> https://seekreel.vercel.app/
> Source: https://github.com/highnet/seekreel
>
> #devtools #opensource #frontend #designengineering

Shorter variant, if the feed is being unkind to long posts:

> Frame 512 is always the frame at t = 21.333.
>
> seekreel renders an animated web page to video by seeking it, one frame at a
> time — so a film can live in the repo, diff in review and rebuild in CI.
> Probe one moment in a second. Re-render one shot without touching the rest.
>
> Free and MIT, installed by git rather than a registry. Scrub it yourself at
> https://seekreel.vercel.app/ — this post was rendered with it.
>
> #devtools #opensource #designengineering

## First comment

> Install: `curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh`
> — it clones the repo to ~/.seekreel and links the CLI. There is no npm package;
> `git clone https://github.com/highnet/seekreel` works just as well, because the
> tool is TypeScript that Node runs without a build step. Needs Node 22.18+, a
> Chromium and ffmpeg. Docs: https://seekreel.vercel.app/
>
> The film in this post is `examples/linkedin-promo` in the repo: one HTML
> file, a Strudel pattern for the music, no animation library. The five sizes
> above all came out of the same 1080×1080 render. There is a three.js example
> in there too, for the 3D question this always gets.

## Alt text (LinkedIn allows it on video and images)

> A white square in an animator's dope-sheet layout. A ruled margin of magenta
> frame numbers scrolls down the left edge while the readout in the corner
> counts the timestamp and frame number. Title cards spell out what seekreel
> does: turn an animated web page into a video file, one frame at a time; the
> three-rule page contract; the probe, render and build commands typed at a
> prompt; and an end card with the wordmark, the command
> `git clone https://github.com/highnet/seekreel`, and the homepage URL
> https://seekreel.vercel.app/.

## Notes for whoever posts it

- **It has to work muted.** LinkedIn autoplays without sound and most people
  never turn it on. Every claim in the film is on screen as type, so nothing is
  lost — but if you would rather post it silent, use
  `deliver/seekreel-promo-silent.mp4`.
- **Links in the post are fine on LinkedIn**, unlike some feeds, so
  https://seekreel.vercel.app/ and the repo URL both stay in the body. The
  install line sits in the first comment where it is copyable without expanding
  the post. The homepage URL is also on the film's end card, for anyone who
  watches it somewhere the caption did not travel with it.
- **Forty-eight seconds, four per shot.** The first cut of this film gave each
  shot 3.2 seconds and it read as a slideshow you could not keep up with. Every
  shot now puts its words up inside the first second and then holds, which is
  the difference between showing a feature and letting someone read it. The
  claim is still on screen inside the first two seconds, for the people who
  leave after that.
- **It is a feature list, and it says so.** The margin counts 01/9 through 09/9
  as the film goes, so a viewer knows how much is left.
- If you want a second post out of the same material, the three-rule contract
  shot works on its own as a document post or a still.
