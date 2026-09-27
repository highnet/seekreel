# seekreel actors

A small cast of low-poly characters, props and sets for three.js stages, plus
four sample scenes that render into ready-made assets. They grew out of
`examples/anna-anniversary` and were made generic here, so anyone can drop a
blob with a cap into their own film or render the samples as placeholders.

The kit is optional. The normal install ships it, and the minimal install
(`--minimal`, see the main README) leaves this whole folder out; seekreel itself
does not depend on anything in it.

```sh
sh actors/setup.sh                                  # three.js, Motion, the font
seekreel build -c actors/picnic.config.json         # → actors/deliver/picnic.mp4, picnic-loop.gif
seekreel probe 2,4,6 -c actors/cast.config.json     # stills only, into actors/probe/
```

## Sample scenes

| Config | Length | What it shows |
|---|---|---|
| `cast.config.json` | 6s | every character and accessory on a turntable, labelled with the call that builds it |
| `picnic.config.json` | 8s | two blobs on an island; the dog steals a fry and takes a victory lap |
| `getaway.config.json` | 8s | a little plane crosses the sea; a beach with striped umbrellas; one blob gets sunburnt |
| `gallery.config.json` | 8s | a pink museum wall of placeholder paintings, a slow pan, visitors at an empty "coming soon" frame |

Each renders a 1920×1080 MP4 and a 960×540 looping GIF, with no soundtrack.
Add an `audio` block to a config to give one a Strudel track (see the main
README's Sound section, or `examples/anna-anniversary/music.strudel.js`).

## Using the kit in your own stage

```html
<script src="vendor/motion.js"></script>
<script type="module">
  import { setupScene } from "./scene.js";
  const { kit, scene, camera, t, blink, hop, finish } = await setupScene();

  const h = hop(0, 2, 3, 0.5);                       // three hops over two seconds
  const me = kit.glasses(kit.cap(kit.blob({ open: blink(0), squash: h.squash })));
  me.group.position.set(-2 + h.u * 4, h.y, 0);
  scene.add(me.group);

  camera.position.set(0, 2, 7); camera.lookAt(0, 0.6, 0);
  await finish();                                    // renders, then marks the frame ready
</script>
```

`setupScene()` reads `t` from the URL, builds the renderer and lights, and
returns the kit with Motion's helpers (`springAt`, `mix`, `mixColor`, the
easings). Every builder in `actors.js` is a pure function of its options: pass
the pose for this timestamp in, never animate with a clock inside.

### Characters

| Builder | Options |
|---|---|
| `blob()` | `color`, `cheek`, `squash`, `open` (eyelids), `eyes` (size), `happy`, `mouth`, `blush`, `tilt` → `{ group, body, face, top, sxz }` |
| `cap(b)`, `glasses(b)` | a navy cap, round black glasses |
| `hairBun(b)`, `bow(b)`, `sprout(b, sway)` | hair with a bun and tie, a bow, a leaf sprout |
| `curl(b)`, `pacifier(b)` | for a baby-sized blob (scale its group to 0.5) |
| `medal(b)` | a gold medal with ribbons |
| `dog()` | `color`, `wag`, `ears`, `open` → `{ group, top, mouth }` |

### Props

`heart(size, color)`, `star(size, color)`, `fry()`, `fryBox({ fries })`,
`melonSlice(size)`, `melonHalf()`, `takeaway()`, `blanket()`,
`giftBox({ lid })`, `podium()`, `bench()`, `flower(color)`, `cloud({ seed })`,
`plane({ faces })`.

### Sets

`sea({ ripple })`, `island({ radius, grass })`, `palm({ sway })`, `cottage()`,
`building({ floors, built })` (raise it one storey at a time), `umbrella()`,
`beach()`, `gallery({ pieces, font })` and `placeholderArt(seed)`.

To hang real photos in the gallery, load them with `THREE.TextureLoader`,
await the textures, and pass them as `pieces[i].texture`; await
`document.fonts.load(...)` before building it so the plaques use your font.

## Design notes

The cast follows the same rules as the anniversary film: toon shading in three
soft steps, one typeface (Bricolage Grotesque), a restrained
pink / plum / butter palette (`PALETTE` in `actors.js`), and spring timing for
every entrance. Keep new actors to that palette and they will sit in the same
world.
