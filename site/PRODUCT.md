# seekreel — product context

Captured for [Impeccable](https://impeccable.style) so later design work starts
from the same place this page did.

## What it is

A command-line tool that renders an animated web page to video by seeking it,
one frame at a time. This directory is its homepage — a separate Next.js app
inside the tool's own repository, deployed to Vercel.

## Register

Brand. The page *is* the product's first impression; the design is the
deliverable, not a wrapper around one.

## Platform

web

## Audience and job

Developers and motion-minded designers who already build in the browser and
need a video file out the other end — a launch film, a feature reel, a loop for
a store page. In under a minute they should understand that the page draws
itself at a timestamp, see that claim demonstrated rather than asserted, and
leave with the install command.

## Proof and constraints

- Everything on the page is true of the tool as published: the three-rule stage
  contract, the four commands, the JSON cue sheet, the requirements, and the
  honest cost of about a second per frame.
- seekreel is not on npm yet, so the install line installs from the repository
  and says so.
- No invented adoption numbers, testimonials, benchmarks, or logos.
- No third-party analytics or tracking.

## Chosen direction

**The dope sheet.** An animator's exposure sheet under a desk lamp: ruled
columns, frame numbers in the margin, magenta ink. The first fold is drenched
in that magenta and holds a working viewer — a twelve-second film that is a
pure function of `t`, scrubbable by hand. The rest of the page is pure white so
the frames carry the color.

The memorable moment is dragging the scrubber and realizing the viewer has no
animation in it: every pixel is computed from the timestamp, which is the whole
thesis of the tool.

## Open decisions

- A rendered sample film (real MP4) could replace or accompany the SVG stage
  once one is small enough to ship.
- The install line changes the day the package is published to npm.
