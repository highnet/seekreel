# examples/three-orbit

Eight seconds of WebGL, to show that the contract does not change for 3D: read
`t`, draw that moment, say when the frame is final. A camera orbits a ring of
bars that rise on staggered delays, with a wireframe shell breathing on the same
clock.

```sh
sh examples/three-orbit/setup.sh          # three.js, fetched
seekreel build -c examples/three-orbit/seekreel.config.json
```

## What makes it work

**`"webgl": true` in the config.** It launches Chromium with ANGLE on
SwiftShader — a software rasteriser. A headless browser on a machine with no GPU
would otherwise either refuse a WebGL context or hand back one backed by
whatever driver it found, and the same scene would then shade differently on the
next machine. Software rendering is slower and identical everywhere, which is
the trade the whole tool makes.

It is worth checking what that buys: rendering `t = 3.0` twice, in two separate
processes, produces the same PNG byte for byte.

**Stages are served, not opened from disk.** three.js ships as an ES module, and
a `file://` document may not import one — the browser calls it a cross-origin
request from a null origin. seekreel serves the project directory on a loopback
port for the length of the render, so `import * as THREE from "./three.module.js"`
is an ordinary import. `fetch` of a JSON file beside the stage works for the same
reason.

**Nothing accumulates.** There is no `rotation.y += 0.01` anywhere in the scene.
The camera angle is `t / DURATION`, each bar's height comes from its own clamped
window on `t`, and the shell's rotation is `t * 0.3`. Frame 72 is the same
picture whether it is rendered after frame 71 or on its own in a fresh page, and
`seekreel render 60 90` re-cuts the middle of the film without touching the rest.

## Cost

WebGL through SwiftShader is slower than DOM — this scene renders at roughly two
seconds a frame rather than one, so the eight-second film is about six minutes.
Scenes with real shading and shadow maps cost more. Probe before you commit:

```sh
seekreel probe 3.0 -c examples/three-orbit/seekreel.config.json
```

## Where to take it

The scene is deliberately plain — boxes, three lights and a fog. Everything
three.js can do applies, with one rule: any value that would normally come from
a delta, a clock or an animation mixer has to come from `t` instead. For an
`AnimationMixer`, that means `mixer.setTime(t)` rather than `mixer.update(delta)`,
which is the same move as GSAP's `tl.time(t)`.
