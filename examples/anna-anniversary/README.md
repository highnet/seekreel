# Fries for Two

A 2⅔-minute anniversary film for Anna: a tiny low-poly island at sunset, two
chunky blobs (a cap and round glasses; a brown bun), one fry-stealing baby, a
plane, Sicily, our yellow Vienna building, and a bossa nova soundtrack. The
finale lands our real photos as polaroids.

- **three.js** draws the island, the blobs and everything that blooms.
- **Framer Motion** (the `motion` package) supplies every spring, easing and
  colour blend. Its `spring()` is *sampled* at the frame's timestamp rather
  than run on a clock, so every word pop and bounce is deterministic.
- **Strudel** plays the bossa nova (`music.strudel.js`): 80 bars at cps 0.5,
  one bar per two seconds, and the chapters turn over on its bar lines.

| time      | chapter          |
|-----------|------------------|
| 0–8s      | title            |
| 8–36s     | How we met       |
| 36–68s    | The early days   |
| 68–84s    | Adventures       |
| 84–120s   | Now              |
| 120–140s  | The future       |
| 140–160s  | finale, polaroids |

```sh
sh examples/anna-anniversary/setup.sh
seekreel build -c examples/anna-anniversary/seekreel.config.json
# → examples/anna-anniversary/deliver/anna.mp4
```

The photos live in `photos/` and are git-ignored on purpose: they are family
photos, and this repository is not the place for them. Put them back there
(`kiss`, `vienna`, `sicily`, `pool`, `grimace`, `watermelon`, `airport`,
`bottle` — all `.jpg`) before rebuilding.

"Adventures" was spliced in after the rest was timed: `stage.html` maps video
time to story time, so everything outside 68–84s keeps its original numbers.

Every caption, bubble and camera move lives in plain arrays near the top of
`stage.html` (`CAPTIONS`, `BUBBLES`, `CAM`, `*_KEYS`) — change a line there,
`seekreel probe <t>` to check it, and `seekreel render a b` to redraw just
those frames.
