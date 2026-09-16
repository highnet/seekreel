# LinkedIn post — seekreel

The video in this folder is the post. Everything below is the text that goes
with it. Nothing here claims anything that is not true of the tool as
published: no adoption numbers, no benchmarks beyond the honest cost of about
a second per frame.

## What to upload

| Slot | File | Why |
|---|---|---|
| Feed video | `deliver/seekreel-promo.mp4` | 1080×1080, 40 seconds. The square is the safe feed shape on LinkedIn and reads the same on desktop and mobile. |
| Feed video, taller | `deliver/seekreel-promo-4x5.mp4` | 1080×1350, if you want more vertical space in a mobile feed. |
| Vertical video feed | `deliver/seekreel-promo-vertical.mp4` | 1080×1920, for LinkedIn's vertical video surface. |
| Thumbnail | `deliver/seekreel-promo-poster.png` | Frame 912 — the end card: wordmark, line and URL on magenta. |
| Comment, DM, or the repo README | `deliver/seekreel-promo-loop.gif` | 12fps, silent, plays anywhere a video player is not welcome. |

Upload the poster as the custom thumbnail. LinkedIn otherwise picks its own,
and the film opens on near-empty white, which is a good opening and a bad
still.

## Post

The first two lines are what shows before "…see more". They have to carry the
idea on their own.

> Your launch film should live in the repo, not in someone's Downloads folder.
>
> seekreel turns a web page into finished video. You build the thing in the
> browser you already work in — React, GSAP, three.js, plain CSS, whatever you
> reach for — and it renders an MP4, frame by frame, at whatever sizes the feed
> is asking for this month.
>
> What that changes:
>
> → One build, every size. 1:1, 4:5, 9:16, a named pixel size, mp4, webm, gif,
> a poster frame — cut from the same render rather than exported six times.
> → 3D included. Real WebGL, rendered clean, no capture card and no dropped
> frames.
> → Fix second eight without shooting the whole thing again. Re-render one shot
> and leave the other 900 frames alone.
> → Music that ships with the film and moves when the film moves. Nothing to
> licence.
> → It lives in your repo: reviewed like code, rebuilt in CI when the brand
> changes, identical from every machine.
>
> The honest trade: it renders a frame at a time, so budget about a second per
> frame. Right for a film you cut once and then tweak; wrong for anything
> interactive.
>
> Free and MIT, installed with one line and no package registry:
> `curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh`
>
> Homepage, with a playground you can drive yourself:
> https://seekreel.vercel.app/
> Source: https://github.com/highnet/seekreel
>
> (The video above was rendered with it, naturally.)
>
> #devtools #opensource #frontend #designengineering

Shorter variant, if the feed is being unkind to long posts:

> Build your launch video the way you build everything else — in the browser —
> and get an MP4 back. Every size the feed wants, from one render. 3D, React and
> GSAP included; music too.
>
> Free and MIT: https://seekreel.vercel.app/ — the video above was made with
> it.
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

> A square video in a bold magenta and white brand. It opens full-bleed magenta
> with the seekreel wordmark and the line "Ship the film, not the screen
> recording." White cards follow on a faintly ruled background: a mock web page
> turning into a row of film frames; a canvas changing shape from 1:1 to 4:5 to
> 9:16 while the picture inside it stays the same size, beside chips reading
> mp4, webm, gif and poster; a dark panel holding a rotating 3D scene of magenta
> and white bars inside a wireframe sphere; the words React, GSAP, three.js,
> CSS, Canvas and SVG; a row of audio levels rising; a strip of frames with one
> highlighted in magenta; three numbered lines about reviewing, rebuilding and
> shipping from any machine; and the command
> `git clone https://github.com/highnet/seekreel`. It closes back on magenta
> with the wordmark and https://seekreel.vercel.app/.

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
- **Forty seconds, four per shot.** Every shot puts its words up inside the
  first second and then holds, which is the difference between showing someone
  a feature and letting them read it. The claim is on screen inside the first
  two seconds, for the people who leave after that.
- **It sells rather than explains.** An earlier cut spent its runtime on the
  tool's own mechanics — a frame counter, a timestamp readout, a scrubber
  demonstrating its own seek. None of that is a reason for anyone to install
  something. What is left is what a viewer gets: the video, the sizes, the 3D,
  the music, the repo. That it was rendered with seekreel is a good proof
  point, so it sits in the caption rather than taking ten shots of screen
  time.
- If you want a second post out of the same material, the three-rule contract
  shot works on its own as a document post or a still.
