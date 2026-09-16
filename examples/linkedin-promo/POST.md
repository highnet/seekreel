# LinkedIn post — seekreel

The video in this folder is the post. Everything below is the text that goes
with it. Nothing here claims anything that is not true of the tool as
published: no adoption numbers, no benchmarks beyond the honest cost of about
a second per frame.

## What to upload

| Slot | File | Why |
|---|---|---|
| Feed video | `deliver/seekreel-promo.mp4` | 1080×1080. The square is the safe feed shape on LinkedIn and reads the same on desktop and mobile. |
| Feed video, taller | `deliver/seekreel-promo-4x5.mp4` | 1080×1350, if you want more vertical space in a mobile feed. |
| Vertical video feed | `deliver/seekreel-promo-vertical.mp4` | 1080×1920, for LinkedIn's vertical video surface. |
| Thumbnail | `deliver/seekreel-promo-poster.png` | Frame 355 — the end card, wordmark and install line. |
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
> What that changes in practice:
>
> → Render a single moment to a PNG in about a second, instead of waiting out
> the other thousand frames to check one shot.
> → Redraw frames 480 to 620 in place when the middle needs a fix. The rest of
> the film is untouched.
> → Keep the source in version control. The page diffs, it goes through review,
> and it rebuilds in CI — nobody has to remember how the video was made.
>
> The contract a page has to honour is three lines: read t from the URL, draw
> that frame, set data-seekreel-ready. There is no library to import.
>
> The trade-off is real and worth stating: one screenshot per frame, so budget
> about a second per frame. It is the right tool for a film you cut once and
> then tweak in pieces, and the wrong one for anything interactive.
>
> This post was rendered with it — one HTML file, no animation library, cut to
> five sizes from a single render. Even the music is source: a Strudel pattern,
> rendered offline, cut to the same grid the picture is.
>
> MIT, and free: github.com/highnet/seekreel. There is a scrubbable viewer on
> the homepage at seekreel.vercel.app.
>
> #devtools #opensource #frontend #designengineering

Shorter variant, if the feed is being unkind to long posts:

> Frame 512 is always the frame at t = 21.333.
>
> seekreel renders an animated web page to video by seeking it, one frame at a
> time — so a film can live in the repo, diff in review and rebuild in CI.
> Probe one moment in a second. Re-render one shot without touching the rest.
>
> Free and MIT: github.com/highnet/seekreel. This post was rendered with it.
>
> #devtools #opensource #designengineering

## First comment

> Install is `npm i -g github:highnet/seekreel` — it is not on npm yet, so that
> pulls straight from the repository. Needs Node 20+, a Chromium and ffmpeg.
>
> The film in this post is `examples/linkedin-promo` in the repo: one HTML
> file, a Strudel pattern for the music, no animation library. The five sizes
> above all came out of the same 1080×1080 render.

## Alt text (LinkedIn allows it on video and images)

> A white square in an animator's dope-sheet layout. A ruled margin of magenta
> frame numbers scrolls down the left edge while the readout in the corner
> counts the timestamp and frame number. Title cards spell out what seekreel
> does: turn an animated web page into a video file, one frame at a time; the
> three-rule page contract; the probe, render and build commands typed at a
> prompt; and an end card with the wordmark and the install command
> `npm i -g github:highnet/seekreel`.

## Notes for whoever posts it

- **It has to work muted.** LinkedIn autoplays without sound and most people
  never turn it on. Every claim in the film is on screen as type, so nothing is
  lost — but if you would rather post it silent, use
  `deliver/seekreel-promo-silent.mp4`.
- **Links in the post are fine on LinkedIn**, unlike some feeds, so the repo
  URL can stay in the body. Keep the install line in the first comment where
  it is copyable without expanding the post.
- **Sixteen seconds is deliberate.** LinkedIn will take far longer, but the
  drop-off after the first few seconds is steep and this film puts its claim
  on screen inside the first two.
- If you want a second post out of the same material, the three-rule contract
  shot works on its own as a document post or a still.
