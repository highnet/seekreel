/*
 * The big-sister film: three and a half minutes, 106 bars of a waltz lullaby
 * (lullaby.strudel.js). A one-year-old big sister takes care of her newborn
 * little sister, with Mom, Dad and Grandma. Names come from names.js.
 *
 *     0–8    title over the cottage
 *     8–12   card: A little secret
 *    12–40   secret set     (local time t - 12)
 *   --- the rest was timed before the secret was spliced in; S() moves those
 *   --- times 32s later, and `story` is the film's clock without the insert
 *    40–44   card: Meeting the baby        story  8–12
 *    44–84   home set                      story 12–52 (local story - 12)
 *    84–88   card: Sharing                 story 52–56
 *    88–124  share set                     story 56–92 (local story - 56)
 *   124–128  card: Picnic with Grandma     story 92–96
 *   128–164  picnic set                    story 96–132 (local story - 96)
 *   164–168  card: Lullaby                 story 132–136
 *   168–212  lullaby set, the ending       story 136–180 (local story - 136)
 *
 * Every cut lands on a bar line (a bar is two seconds).
 */
import { html, World, film } from "../kit/react.js";
import { Sky, Vignette, Captions, Bubble, ChapterCard, Credit, skyStops } from "../kit/ui.js";
import { createWorld } from "../kit/world.js";
import { t, span, easeInOut, easeOut, mix } from "../kit/timing.js";
import { secret, home, share, picnic, lullaby } from "./sets.js";
import { NAMES } from "./names.js";

const { big, little, grandma } = NAMES;
document.title = `Big Sister ${big}`;

/* the secret is spliced in at 8s; S() moves a story time to video time */
const INSERT = 8, INSERT_LEN = 32;
const S = (x) => (x >= INSERT ? x + INSERT_LEN : x);
const inSecret = t >= INSERT && t < INSERT + INSERT_LEN;
const story = t < INSERT ? t : t - INSERT_LEN;
const shifted = (list) => list.map((l) => ({ ...l, at: S(l.at), to: S(l.to) }));

const CARDS = [
  { at: 8,      n: "Chapter one",   title: "A little secret" },
  { at: S(8),   n: "Chapter two",   title: "Meeting the baby" },
  { at: S(52),  n: "Chapter three", title: "Sharing" },
  { at: S(92),  n: "Chapter four",  title: "Picnic with Grandma" },
  { at: S(132), n: "Chapter five",  title: "Lullaby" },
];

/* the secret's captions and bubbles, in video seconds (local time t - 12) */
const SECRET_LINES = [
  { at: 12.6, to: 16.6, text: "Before the baby came…" },
  { at: 18.6, to: 22.4, text: "Mommy had a little secret." },
  { at: 31.4, to: 35.4, s: "big", text: "A baby sister was on the way!" },
  { at: 35.8, to: 39.6, text: `${big} couldn't wait to meet her.` },
];
const SECRET_BUBBLES = [
  { who: "mom", text: "come here, sweetie",               at: 17.2, to: 19.2 },
  { who: "mom", text: "you're going to be a big sister!", at: 22.8, to: 26.0 },
  { who: "sis", text: "hello in there!",                  at: 26.4, to: 28.6 },
  { who: "sis", text: "!!!",                              at: 29.3, to: 31.0 },
  { who: "dad", text: "she said hi!",                     at: 33.2, to: 35.2 },
];

/* captions in story seconds; the sets' local times are noted beside each block */
const STORY_LINES = [
  { at: 1.0,   to: 7.5,   s: "title", text: `Big Sister ${big}` },
  { at: 2.2,   to: 7.5,   s: "aside", text: "a story about two sisters" },

  /* home, t - 12 */
  { at: 12.8,  to: 17.6,  text: `${big} was waiting for someone special.` },
  { at: 19.2,  to: 24.6,  text: "Mom and Dad came home with a surprise." },
  { at: 32.4,  to: 36.4,  text: `${big}, meet your little sister…` },
  { at: 38.2,  to: 43.6,  s: "big", text: `${little}.` },
  { at: 45.2,  to: 50.4,  text: "It was love at first sight." },

  /* share, t - 56 */
  { at: 56.8,  to: 61.6,  text: `${big} had so much to share.` },
  { at: 72.0,  to: 75.4,  text: "Even her favorite rattle." },
  { at: 76.2,  to: 78.0,  s: "aside", text: "(uh-oh.)" },
  { at: 82.0,  to: 86.2,  text: "Big sisters know just what to do." },
  { at: 87.0,  to: 91.4,  text: "Everything is better shared." },

  /* picnic, t - 96 */
  { at: 96.6,  to: 101.4, text: `${grandma} took the girls on a picnic.` },
  { at: 105.2, to: 109.6, text: `${big} kept the sun off her little sister,` },
  { at: 113.0, to: 117.6, text: "and showed her that butterflies are friends." },
  { at: 119.4, to: 122.6, text: "She shared her melon, too." },
  { at: 127.0, to: 131.4, text: `${grandma} was so proud.` },

  /* lullaby, t - 136 */
  { at: 136.8, to: 141.6, text: `When the stars came out, ${little} couldn't sleep.` },
  { at: 144.6, to: 148.6, text: `So ${big} tucked her in…` },
  { at: 150.4, to: 154.2, text: "and sang her a lullaby." },
  { at: 156.0, to: 159.6, s: "aside", text: "(her very first song.)" },
  { at: 160.8, to: 164.8, text: "Until both sisters were fast asleep." },
  { at: 172.8, to: 179.6, s: "big", text: "Sisters forever." },
];

const LINES = [...shifted(STORY_LINES), ...SECRET_LINES];

/* Build the 3D world for whichever set is on screen; the cards hide the cuts. */
let world, cast = {}, set;
if (inSecret) {
  set = "secret";
  world = createWorld({ fog: null });
  cast = secret(world, Math.max(0, t - 12));
} else if (story < 52) {
  set = "home";
  world = createWorld({ fogColor: skyStops(0)[3] });
  cast = home(world, Math.max(0, story - 12), { camera: story >= 12 });
  if (story < 12) {
    /* the title: the camera comes down onto the cottage */
    const k = easeInOut(span(0, 8, story));
    world.camera.position.set(mix(-3, 0.5, k), mix(15, 3.2, k), mix(24, 9.5, k));
    world.camera.lookAt(0, mix(0, 0.7, k), 0);
  }
} else if (story < 92) {
  set = "share";
  world = createWorld({ fog: null });
  cast = share(world, Math.max(0, story - 56));
} else if (story < 132) {
  set = "picnic";
  world = createWorld({ fogColor: skyStops(0)[3] });
  cast = picnic(world, Math.max(0, story - 96));
} else {
  set = "lullaby";
  world = createWorld({ fog: null });
  cast = lullaby(world, Math.max(0, story - 136));
}
const night = set === "lullaby";
const above = (a, lift) => (a ? world.above(a, lift) : null);

/* speech bubbles, by set, in story seconds */
const STORY_BUBBLES = {
  home: [
    { who: "grandma", text: "here they come!", at: 18.6, to: 20.6 },
    { who: "sis" ,    text: "?",               at: 28.0, to: 30.2 },
    { who: "sis" ,    text: "baby!",           at: 39.6, to: 41.4 },
    { who: "baby",    text: "goo",             at: 42.6, to: 44.2 },
    { who: "mom",     text: "gentle, sweetie", at: 44.6, to: 46.8 },
  ],
  share: [
    { who: "sis" , text: "mine…",  at: 67.3, to: 68.8 },
    { who: "sis" , text: "yours!", at: 71.6, to: 73.2 },
    { who: "baby", text: "WAAAH",  at: 76.8, to: 80.0 },
    { who: "sis" , text: "there!", at: 83.9, to: 85.4 },
    { who: "baby", text: "goo!",   at: 87.0, to: 88.5 },
  ],
  picnic: [
    { who: "grandma", text: "picnic time, my loves!",  at: 101.2, to: 103.6 },
    { who: "sis" ,    text: "shade!",                  at: 109.6, to: 110.6 },
    { who: "sis" ,    text: "it's a friend!",          at: 112.2, to: 114.2 },
    { who: "baby",    text: "hee!",                    at: 115.0, to: 116.5 },
    { who: "grandma", text: "what a good big sister!", at: 123.2, to: 125.8 },
  ],
  lullaby: [
    { who: "baby", text: "mmeh…",                  at: 137.6, to: 139.6 },
    { who: "baby", text: "waah",                   at: 140.0, to: 141.4 },
    { who: "sis" , text: "la la laaa…",            at: 150.0, to: 153.0 },
    { who: "sis" , text: "shh… sleep, little sister", at: 154.6, to: 158.4 },
    { who: "mom",  text: "goodnight, my girls",    at: 168.6, to: 171.2 },
    { who: "sis" , text: "z z z",                  at: 172.6, to: 175.4 },
    { who: "baby", text: "z z",                    at: 174.6, to: 177.2 },
  ],
};

const BUBBLES = Object.fromEntries(Object.entries(STORY_BUBBLES).map(([k, v]) => [k, shifted(v)]));
BUBBLES.secret = SECRET_BUBBLES;

function Movie() {
  const end = easeOut(span(S(178.2), S(180)));
  return html`<div class="frame" style=${{ background: night ? "#2a2348" : set === "share" || set === "secret" ? "#fbe1e8" : undefined }}>
    ${!night && set !== "share" && set !== "secret" ? html`<${Sky} night=${0} now=${t} />` : null}
    <${World} world=${world} />
    <${Vignette} fade=${t < 1 ? 1 - easeOut(t) : 0} />

    ${(BUBBLES[set] || []).map((b, i) => html`<${Bubble} key=${i} text=${b.text} at=${b.at} to=${b.to} xy=${above(cast[b.who])} now=${t} />`)}

    <${Captions} lines=${LINES} now=${t} night=${night ? 1 : 0} />
    ${night ? html`<div class="credit night" style=${{ opacity: easeOut(span(S(175.6), S(176.6))) }}>for ${big} & ${little}</div>` : null}
    <${ChapterCard} cards=${CARDS} now=${t} />
    ${end > 0 ? html`<div class="fade" style=${{ opacity: end }}></div>` : null}
  </div>`;
}
film(html`<${Movie} />`);
