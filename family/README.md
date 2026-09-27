# The seekreel family sample pack

Everything that went into a real seekreel film, made generic and reusable:
a cast of squashy low-poly characters, the props and sets they live in, the
React components that put captions, speech bubbles, chapter cards and photos
on top, a bossa nova soundtrack written in Strudel, the font, sample photos,
and a 48-second sample movie that uses all of it.

It is the quickest way to see what a finished seekreel project looks like, and
a good place to start your own.

```sh
sh family/setup.sh                           # three.js, Motion, React, Strudel, the font
seekreel build -c family/movie.config.json   # → family/deliver/family.mp4, -vertical.mp4, -loop.gif
```

**New here? Read [GUIDE.md](GUIDE.md)** — it walks through the sample movie
and how to turn it into your own.

The pack is optional. The normal install ships it; the minimal install
(`install.sh --minimal`) leaves this folder out, and seekreel itself depends on
nothing in it.

## What is in it

| Path | What it is |
|---|---|
| `movie/stage.html` + `movie.config.json` | **The sample movie**, "The Blob Family": 48 seconds, three sets, cards between them, captions, bubbles, photos, music |
| `scenes/*.html` + `*.config.json` | the sets on their own: `cast`, `picnic`, `getaway`, `gallery` |
| `kit/actors.js` | the 3D cast, props and sets — pure builders, no clock inside |
| `kit/sets.js` | the three sets (picnic, getaway, gallery), each a function of local time |
| `kit/ui.js` | React components: `Sky`, `Vignette`, `Captions`, `Bubble`, `ChapterCard`, `Photo`, `Credit` |
| `kit/react.js` | `html` (htm), `<World>` (mounts the 3D canvas), `film()` (renders the frame) |
| `kit/world.js` | `createWorld()`: renderer, camera, lights and the kit, plus `toScreen` / `above` for bubbles |
| `kit/timing.js` | `t`, `span`, `springAt`, `popInOut`, `blink`, `hop`, `track`, `shot`, `splice` |
| `kit/family.css` | the look: one typeface, a pink / plum / butter palette, sizes in `vh` |
| `music/bossa.strudel.js` | the soundtrack, arranged in bar ranges you can edit |
| `photos/*.svg` | three sample photos (illustrations) for `<Photo>` and the gallery |
| `setup.sh` | fetches the browser dependencies into `vendor/` (git-ignored) |

## The sets

| Config | Length | What happens |
|---|---|---|
| `cast.config.json` | 6s | every character on a turntable, labelled with the calls that build it |
| `picnic.config.json` | 12s | the Blobs on an island; the dog steals a fry and takes a victory lap |
| `getaway.config.json` | 10s | a plane crosses the sea; a beach; one blob turns into a lobster |
| `gallery.config.json` | 10s | a pink museum wall, a slow pan, the family at an empty "coming soon" frame |
| `movie.config.json` | 48s | all three in a row, with cards, captions and the soundtrack |

## Characters, props and sets (`kit/actors.js`)

| Builder | Options |
|---|---|
| `blob()` | `color`, `cheek`, `squash`, `open` (eyelids), `eyes` (size), `happy`, `mouth`, `blush`, `tilt` → `{ group, body, face, top, sxz }` |
| `cap(b)`, `glasses(b)`, `hairBun(b)`, `bow(b)`, `sprout(b, sway)` | accessories that attach to a blob |
| `curl(b)`, `pacifier(b)`, `medal(b)` | a baby's curl and pacifier (scale the group to 0.5), a gold medal |
| `dog()` | `color`, `wag`, `ears`, `open` → `{ group, top, mouth }` |
| props | `heart`, `star`, `fry`, `fryBox({ fries })`, `melonSlice`, `melonHalf`, `takeaway`, `blanket`, `giftBox({ lid })`, `podium`, `bench`, `flower`, `cloud`, `plane({ faces })` |
| sets | `sea({ ripple })`, `island()`, `palm({ sway })`, `cottage()`, `building({ floors, built })`, `umbrella()`, `beach()`, `gallery({ pieces })`, `placeholderArt(seed)` |

## Design notes

The pack follows [Impeccable](https://impeccable.style)'s rules: one typeface
(Bricolage Grotesque) with real weight and width contrast, no italic serif
display type, no cards inside cards, a restrained palette (`PALETTE` in
`actors.js`, tokens in `family.css`), and spring timing for every entrance.
Keep new pieces to that palette and they will sit in the same world.
