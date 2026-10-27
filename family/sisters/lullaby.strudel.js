/*
 * "Two Little Hearts" — the big-sister film's own song: a waltz lullaby in
 * F major, written for it, as a Strudel pattern.
 *
 * All synthesized (no samples), so `seekreel audio` renders it offline.
 * cps 0.5: a bar is two seconds, three beats of a waltz (90 bpm), and the
 * 106 bars are the 212-second film. The tune is sixteen bars long and
 * follows its chords wherever a section starts.
 *
 *   bars   0-3    title              music box alone over a pad
 *   bars   4-5    card: secret       pad
 *   bars   6-19   the secret         music box tune, the waltz comes in
 *   bars  20-21   card: meeting
 *   bars  22-41   home               bass, the flute sings the tune
 *   bars  42-43   card: sharing      music box
 *   bars  44-61   the nursery        pizzicato, the tune up high
 *   bars  62-63   card: picnic
 *   bars  64-81   Grandma's picnic   the brightest: shaker, soft kick, both tunes
 *   bars  82-83   card: lullaby      pad only
 *   bars  84-105  the lullaby        music box over the pad, bells, one last F
 *
 * Strudel reads every double-quoted string as a pattern, so plain JavaScript
 * strings in the setup code use single quotes.
 */

setcps(0.5);

const BARS = 106;
const bars = (...ranges) =>
  '<' + Array.from({ length: BARS }, (_, i) => (ranges.some(([a, b]) => i >= a && i < b) ? 1 : 0)).join(' ') + '>';

// ---- harmony: a sixteen-bar loop, one chord a bar ------------------------------
const CHORDS = {
  F:  { v: 'a3,c4,f4',  r: 'f2', f: 'c3' },
  Dm: { v: 'a3,d4,f4',  r: 'd2', f: 'a2' },
  Bb: { v: 'bb3,d4,f4', r: 'bb1', f: 'f2' },
  C:  { v: 'g3,c4,e4',  r: 'c2', f: 'g2' },
  Am: { v: 'a3,c4,e4',  r: 'a1', f: 'e2' },
  Gm: { v: 'g3,bb3,d4', r: 'g1', f: 'd2' },
  C7: { v: 'g3,bb3,e4', r: 'c2', f: 'g2' },
};
const LOOP = ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C', 'Gm', 'C7', 'F', 'Dm', 'Bb', 'C7', 'F', 'F'];
const ENDING = ['Bb', 'C7', 'F', 'F'];
const END = BARS - ENDING.length;
const prog = Array.from({ length: BARS }, (_, i) => (i >= END ? ENDING[i - END] : LOOP[i % 16]));

/* the tune, six eighth notes a bar, in step with LOOP */
const TUNE = [
  'a4 ~ ~ ~ c5 ~', 'd5 ~ ~ c5 a4 ~', 'bb4 ~ ~ ~ d5 ~', 'c5 ~ ~ ~ ~ ~',
  'a4 ~ ~ ~ c5 ~', 'e5 ~ ~ d5 c5 ~', 'd5 ~ c5 ~ bb4 ~', 'g4 ~ ~ ~ ~ ~',
  'bb4 ~ ~ ~ d5 ~', 'c5 ~ ~ bb4 g4 ~', 'a4 ~ ~ ~ f5 ~', 'e5 ~ d5 ~ c5 ~',
  'd5 ~ ~ ~ bb4 ~', 'g4 ~ ~ a4 bb4 ~', 'a4 ~ ~ ~ ~ ~', '~ ~ ~ ~ ~ ~',
];
/* a little answer under the tune: falls where the tune rests */
const ANSWER = [
  '~ ~ f4 ~ ~ ~', '~ ~ ~ ~ ~ f4', '~ ~ f4 ~ ~ ~', '~ ~ e4 f4 g4 ~',
  '~ ~ f4 ~ ~ ~', '~ ~ ~ ~ ~ a4', '~ ~ ~ ~ ~ ~', '~ ~ e4 ~ c4 ~',
  '~ ~ g4 ~ ~ ~', '~ ~ ~ ~ ~ e4', '~ ~ c5 ~ ~ ~', '~ ~ ~ ~ ~ a4',
  '~ ~ f4 ~ ~ ~', '~ ~ e4 ~ ~ ~', '~ ~ c4 ~ f4 ~', 'a4 ~ c5 ~ f5 ~',
];

const seq = (fn) => '<' + prog.map((c, i) => '[' + fn(c, i) + ']').join(' ') + '>';
const VOICING = seq((c) => CHORDS[c].v);
const BASSLINE = seq((c) => CHORDS[c].r + ' ~ ' + CHORDS[c].f + ' ~ ' + CHORDS[c].f + ' ~');
const MELODY = seq((c, i) => (i >= END ? '~ ~ ~ ~ ~ ~' : TUNE[i % 16]));
const COUNTER = seq((c, i) => (i >= END ? '~ ~ ~ ~ ~ ~' : ANSWER[i % 16]));
const FINAL = seq((c, i) => (i === END + 2 ? 'f5 ~ c5 ~ a4 ~' : i === END + 3 ? 'f4 ~ ~ ~ ~ ~' : '~ ~ ~ ~ ~ ~'));

// ---- the arrangement: which bars each layer plays --------------------------------
const PAD     = bars([0, 8], [18, 22], [42, 44], [62, 64], [82, 106]);
const WALTZ   = bars([8, 18], [20, 82]);
const BASS    = bars([10, 18], [22, 42], [44, 62], [64, 82]);
const KICK    = bars([64, 82]);
const SHAKER  = bars([64, 82]);
const FLUTE   = bars([22, 42], [64, 82]);
const BOX     = bars([0, 4], [6, 18], [42, 44], [46, 62], [84, 102]);
const PIZZ    = bars([44, 62], [64, 82]);
const BELLS   = bars([100, 106]);

stack(
  /* a soft pad, the chord held across the bar */
  note(VOICING).s("sine").attack(1.2).decay(0.8).sustain(0.6).release(2)
    .lpf(1400).room(0.7).roomsize(5).gain(0.18).mask(PAD),

  /* the waltz: oom-pah-pah, chords on beats two and three */
  note(VOICING).s("triangle").struct("~ ~ x ~ x ~")
    .attack(0.01).decay(0.35).sustain(0.1).release(0.3).lpf(1800).room(0.4)
    .gain(0.15).mask(WALTZ),
  note(BASSLINE).s("triangle").attack(0.01).decay(0.5).sustain(0.3).release(0.3)
    .lpf(500).gain(0.45).mask(BASS),
  note(BASSLINE).s("sine").attack(0.01).decay(0.6).sustain(0.25).release(0.3)
    .gain(0.3).mask(BASS),

  /* the picnic's little bit of rhythm */
  note("f1").s("sine").struct("x ~ ~ ~ ~ ~")
    .attack(0.001).decay(0.2).sustain(0).release(0.05).gain(0.4).mask(KICK),
  s("white").struct("~ ~ x ~ x ~").attack(0.004).decay(0.05).sustain(0).hpf(6000)
    .gain(0.06).mask(SHAKER),

  /* the tune on a breathy flute */
  note(MELODY).s("sine").attack(0.06).decay(0.4).sustain(0.55).release(0.5)
    .vib(4).vibmod(0.12).lpf(2600).room(0.45).roomsize(3)
    .gain(0.26).mask(FLUTE),

  /* the tune on a music box, an octave up */
  note(MELODY).add(note(12)).s("triangle").attack(0.002).decay(0.7).sustain(0).release(0.6)
    .delay(0.3).delaytime(0.333).delayfeedback(0.3).room(0.7).roomsize(5)
    .gain(0.17).mask(BOX),

  /* pizzicato answers */
  note(COUNTER).s("triangle").attack(0.002).decay(0.18).sustain(0).release(0.1)
    .lpf(2200).room(0.35).gain(0.2).mask(PIZZ),

  /* the end: a falling F chord on the music box, then bells */
  note(FINAL).add(note(12)).s("triangle").attack(0.002).decay(1.2).sustain(0).release(1.2)
    .room(0.8).roomsize(6).gain(0.2),
  note("<f6 c6 a5 c6>(3,8)").s("triangle").attack(0.002).decay(0.6).sustain(0).release(0.5)
    .delay(0.4).delaytime(0.333).delayfeedback(0.35).room(0.8).roomsize(6)
    .gain(0.1).mask(BELLS),
);
