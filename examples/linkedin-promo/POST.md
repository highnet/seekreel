# LinkedIn post — seekreel

The video in this folder is the post. Everything below is the text that goes
with it, written first person and in plain words — it is Joaquin posting about
something he built, not a product speaking about itself. Nothing here claims
anything that is not true of the tool as published: no adoption numbers, no
benchmarks beyond the honest cost of about a second per frame.

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

First person, plain words. The first two lines are all that shows before
"…see more", so they have to say what this is on their own.

The framing is the use case: showing your website off in a video for social,
not "make an animation". Everything below stays true to how it actually works —
you build the page that shows the product off, using the components and brand
your site already has, and seekreel renders it. It does not screen-record an
arbitrary site, and the copy never implies it does.

> I built a tool for turning your website into a video for social media.
>
> It's called seekreel. You put your real components on a page — the same
> React, the same CSS, the same fonts your site ships — say what should happen
> over time, and it renders an MP4 you can post.
>
> Why I made it:
>
> → It looks like your product because it is your product. No mockups, no
> re-drawing your UI in a video editor.
> → One build, every size. Square for the feed, 4:5, 9:16 for stories and
> reels, plus a gif and a thumbnail. All from one render.
> → The site changed? Change the page and rebuild. You are not booking another
> video shoot because a button moved.
> → 3D works, if your site has it. Real WebGL, drawn properly.
> → Music comes with it, so there's nothing to licence.
>
> One catch, and it's a real one: it draws a frame at a time, about a second
> each. Good for a video you cut once and keep tweaking. No good for anything
> interactive.
>
> It's free and open source. One line to install:
> `curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh`
>
> Site: https://seekreel.vercel.app/
> Code: https://github.com/highnet/seekreel
>
> I made the video above with it.
>
> #devtools #opensource #frontend #designengineering

Shorter version, if you would rather not run long:

> I built seekreel: it turns your website into a video for social.
>
> Your real components, your real brand, on a page that moves — and an MP4 out
> the other end, in every size the feed asks for. 3D and music included.
>
> Free and open source: https://seekreel.vercel.app/
>
> I made the video above with it.
>
> #devtools #opensource #designengineering

## First comment

> To install: `curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh`
> It clones the repo to ~/.seekreel and puts the command on your path. There's
> no npm package — `git clone https://github.com/highnet/seekreel` works just as
> well, since it's TypeScript that Node runs as-is, with nothing to build. You
> need Node 22.18 or newer, a Chromium and ffmpeg.
>
> The video in this post is `examples/linkedin-promo` in the repo: one HTML
> file, a short music file, no animation library. All five sizes came out of the
> same render. There's a React example and a three.js one in there too — the
> React one matters if you want to drop your own components straight in.

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
