# Instagram post — seekreel

The video in this folder is the post. Everything below is the text that goes
with it. Nothing here claims anything that is not true of the tool as
published: no adoption numbers, no benchmarks beyond the honest cost of about
a second per frame.

## What to upload

| Slot | File | Why |
|---|---|---|
| Feed video | `deliver/seekreel-promo-4x5.mp4` | 1080×1350. The tallest thing the feed will show without cropping. |
| Reels / Stories | `deliver/seekreel-promo-story.mp4` | 1080×1920, same film, padded white. |
| Square, if the grid needs it | `deliver/seekreel-promo.mp4` | 1080×1080, the render's own shape. |
| Cover / still post | `deliver/seekreel-promo-poster.png` | Frame 355 — the end card, wordmark and install line. |
| Link preview, chat, Discord | `deliver/seekreel-promo-loop.gif` | 12fps, silent, autoplays anywhere. |

Reels cover: pick the poster. The first frame of the film is nearly empty
white, which is a bad thumbnail and a good opening.

## Caption

> Your launch film should live in the repo.
>
> seekreel renders an animated web page to video by seeking it — one frame at
> a time. Frame 512 is always "whatever the page looks like at t = 21.333", on
> any machine, every time.
>
> That means you can render one moment to a PNG in about a second, redraw the
> middle twenty frames without touching the rest, and rebuild the whole film in
> CI. The page is the source: it diffs, it gets reviewed, nobody has to
> remember how the video was made.
>
> The page's whole contract is three lines — read t from the URL, draw that
> frame, say it's ready. No library to import.
>
> The trade: a screenshot per frame, so budget about a second per frame. Right
> for a film you cut once and then tweak in pieces. Wrong for anything
> interactive.
>
> This post was rendered with it. Install line and a scrubbable viewer at
> seekreel.vercel.app — link in bio.
>
> #creativecoding #generativedesign #motiondesign #webdev #devtools
> #opensource #frontend #javascript #css #gsap #ffmpeg #playwright
> #designengineering #madewithcode #animation

Short version, for a Reel where the first line is all anyone reads:

> Frame 512 is always the frame at t = 21.333. seekreel turns an animated web
> page into an MP4, one frame at a time — and this post was rendered with it.
> Install line at seekreel.vercel.app.

## First comment

> Free and MIT. `npm i -g github:highnet/seekreel` — it is not on npm yet, so
> that installs straight from the repository. Needs Node 20+, a Chromium, and
> ffmpeg. The film in this post is `examples/instagram-promo` in the repo:
> one HTML file, a JSON cue sheet for the sound, no animation library.

## Alt text

> A white square in an animator's dope-sheet layout. A ruled margin of magenta
> frame numbers scrolls down the left edge while the readout in the corner
> counts the timestamp and frame number. Title cards spell out what seekreel
> does: turn an animated web page into a video file, one frame at a time; the
> three-rule page contract; the probe, render and build commands typed at a
> prompt; and an end card with the wordmark and the install command
> `npm i -g github:highnet/seekreel`.

## Notes for whoever posts it

- The film is silent-safe: every claim is on screen as type, so it reads with
  the sound off. `deliver/seekreel-promo-silent.mp4` is there if the feed's
  own music is a better fit than the cue sheet.
- Keep `seekreel.vercel.app` in the bio while this is up — Instagram will not
  make the one in the caption clickable.
- Do not add a music track with a claim in the lyrics. The only spoken claim
  in the whole post is the one about a second per frame, and it is the honest
  one.
