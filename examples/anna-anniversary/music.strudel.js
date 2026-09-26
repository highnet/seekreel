/*
 * 'Fries for Two' — a little bossa nova for Anna.
 *
 * Rendered offline by 'seekreel audio'. Every voice is a synth, so nothing is
 * fetched and the take is repeatable.
 *
 * The grid: cps 0.5, so a cycle (one bar) is two seconds and the 160-second
 * film is exactly 80 bars. The chapters in stage.html turn over on the same
 * bar lines:
 *
 *   bars  0-3    title                  pad + guitar, the tune's pickup
 *   bars  4-5    card: how we met       groove starts
 *   bars  6-17   chapter one            full bossa, tune A
 *   bars 18-19   card: the early days
 *   bars 20-33   chapter two            tune B, vibes on top
 *   bars 34-35   card: adventures       groove keeps going
 *   bars 36-41   plane + Sicily         tune A an octave up, vibes
 *   bars 42-43   card: now              drums drop out
 *   bars 44-59   chapter three          Fmaj9 - Em7 - Dm9 - G7sus, tender
 *   bars 60-61   card: the future       groove comes back
 *   bars 62-69   chapter four           tune A an octave up
 *   bars 70-79   finale                 everything, then one chord rings
 */

setcps(0.5);

const BARS = 80;
const bars = (...ranges) =>
  '<' + Array.from({ length: BARS }, (_, i) => (ranges.some(([a, b]) => i >= a && i < b) ? 1 : 0)).join(' ') + '>';

// ---- harmony, one chord a bar --------------------------------------------
const CHORDS = {
  C:   { v: 'e3,g3,b3,d4', r: 'c2', f: 'g1' },   // Cmaj9
  Am:  { v: 'c3,e3,g3,b3', r: 'a1', f: 'e2' },   // Am9
  Dm:  { v: 'f3,a3,c4,e4', r: 'd2', f: 'a1' },   // Dm9
  G:   { v: 'f3,b3,e4',    r: 'g1', f: 'd2' },   // G13
  F:   { v: 'a3,c4,e4,g4', r: 'f1', f: 'c2' },   // Fmaj9
  Em:  { v: 'g3,b3,d4',    r: 'e2', f: 'b1' },   // Em7
  Gs:  { v: 'f3,a3,c4,d4', r: 'g1', f: 'd2' },   // G7sus
};
const A = ['C', 'Am', 'Dm', 'G'];
const B = ['F', 'Em', 'Dm', 'Gs'];
const prog = [];
for (let i = 0; i < BARS; i++) {
  if (i >= 42 && i < 60) prog.push(B[i % 4]);
  else if (i >= 76) prog.push(['F', 'Gs', 'C', 'C'][i - 76]);
  else prog.push(A[i % 4]);
}
const seq = (fn) => '<' + prog.map(fn).join(' ') + '>';

const VOICING = seq((c) => '[' + CHORDS[c].v + ']');
// bossa bass: root on 1, fifth on the and-of-2 tied into 3, root on the and-of-4
const BASSLINE = seq((c) => '[' + CHORDS[c].r + ' ~ ~ ' + CHORDS[c].f + ' ' + CHORDS[c].f + ' ~ ~ ' + CHORDS[c].r + ']');

// ---- tunes, eighth notes, written over C-Am-Dm-G / F-Em-Dm-G7sus ----------
const TUNE_A = '<[e5 ~ d5 e5 ~ g5 ~ ~] [a4 ~ c5 ~ e5 d5 ~ ~] [f5 ~ e5 d5 ~ c5 ~ a4] [b4 ~ ~ d5 g4 ~ ~ ~]>';
const TUNE_B = '<[g5 ~ e5 ~ c5 ~ d5 e5] [c5 ~ a4 ~ ~ e5 ~ ~] [a5 ~ f5 ~ d5 ~ e5 f5] [d5 ~ b4 ~ g4 ~ ~ ~]>';
const TUNE_C = '<[~ ~ a4 c5 e5 ~ ~ ~] [d5 ~ ~ b4 g4 ~ ~ ~] [~ ~ f4 a4 c5 ~ e5 ~] [d5 ~ ~ ~ ~ ~ ~ ~]>';

// ---- where each layer plays -----------------------------------------------
const PAD     = bars([0, 6], [42, 62], [70, 80]);
const COMP    = bars([0, 42], [44, 79]);
const BASS    = bars([4, 42], [46, 78]);
const GROOVE  = bars([4, 42], [60, 78]);           // kick, rim, shaker
const LEAD_A  = bars([2, 18]);
const LEAD_B  = bars([20, 34]);
const LEAD_C  = bars([46, 60]);
const LEAD_HI = bars([36, 42], [62, 76]);
const VIBES   = bars([24, 42], [54, 60], [70, 79]);
const BELLS   = bars([54, 60], [70, 80]);

stack(
  /* Pad: a soft bed under the title, the sincere chapter and the finale. */
  note(VOICING).s("sine")
    .attack(0.8).decay(0.6).sustain(0.6).release(1.4)
    .lpf(1800).room(0.6).roomsize(4)
    .gain(0.2)
    .mask(PAD),

  /* Guitar comp: the syncopated bossa chord figure, plucked and warm. */
  note(VOICING).s("triangle")
    .struct("x ~ ~ x ~ ~ x ~ ~ ~ x ~ ~ x ~ ~")
    .attack(0.003).decay(0.28).sustain(0.08).release(0.2)
    .lpf(2400)
    .room(0.3)
    .gain("<0.22 0.2 0.22 0.19>")
    .mask(COMP),

  /* Upright-ish bass. */
  note(BASSLINE).s("triangle")
    .attack(0.005).decay(0.35).sustain(0.35).release(0.18)
    .lpf(700)
    .gain(0.62)
    .mask(BASS),
  note(BASSLINE).s("sine")
    .attack(0.005).decay(0.4).sustain(0.3).release(0.2)
    .gain(0.4)
    .mask(BASS),

  /* Soft kick, following the bass. */
  note("c1").s("sine")
    .struct("x ~ ~ x x ~ ~ x")
    .attack(0.001).decay(0.18).sustain(0).release(0.05)
    .gain("[0.7 0.35 0.6 0.35]")
    .mask(GROOVE),

  /* Rim: the bossa clave, across two bars. */
  s("white")
    .struct("[x ~ ~ x ~ ~ x ~ ~ ~ x ~ ~ x ~ ~]/2")
    .attack(0.001).decay(0.025).sustain(0)
    .bpf(2600).resonance(6)
    .gain(0.5)
    .mask(GROOVE),

  /* Shaker: sixteenths with a lilt. */
  s("white")
    .struct("x*16")
    .attack(0.004).decay(0.035).sustain(0)
    .hpf(6500)
    .gain("[0.14 0.05 0.09 0.05]*4")
    .pan(sine.range(0.4, 0.6).fast(1))
    .mask(bars([4, 42], [52, 78])),

  /* Lead: a whistled tune, three versions. */
  note(TUNE_A).s("sine")
    .attack(0.02).decay(0.3).sustain(0.5).release(0.25)
    .delay(0.25).delaytime(0.375).delayfeedback(0.25)
    .room(0.35)
    .gain(0.3)
    .mask(LEAD_A),
  note(TUNE_B).s("sine")
    .attack(0.02).decay(0.3).sustain(0.5).release(0.25)
    .delay(0.25).delaytime(0.375).delayfeedback(0.25)
    .room(0.35)
    .gain(0.3)
    .mask(LEAD_B),
  note(TUNE_C).s("sine")
    .attack(0.06).decay(0.5).sustain(0.5).release(0.6)
    .delay(0.3).delaytime(0.5).delayfeedback(0.3)
    .room(0.6).roomsize(4)
    .gain(0.3)
    .mask(LEAD_C),
  note(TUNE_A).add(note(12)).s("sine")
    .attack(0.02).decay(0.25).sustain(0.4).release(0.2)
    .delay(0.3).delaytime(0.375).delayfeedback(0.3)
    .room(0.4)
    .gain(0.2)
    .mask(LEAD_HI),

  /* Vibes: the tune's shadow, an octave down, bell-ish. */
  note(VOICING).arp("~ 0 ~ 1 ~ 2 ~ 1").add(note(12)).s("triangle")
    .attack(0.002).decay(0.4).sustain(0).release(0.3)
    .room(0.5)
    .gain(0.14)
    .mask(VIBES),

  /* Bells: sparkles for "proud of you" and the finale. */
  note("<c6 e6 g6 b5>(3,8)").s("triangle")
    .attack(0.002).decay(0.5).sustain(0).release(0.4)
    .delay(0.4).delaytime(0.25).delayfeedback(0.4)
    .room(0.7).roomsize(5)
    .gain(0.13)
    .mask(BELLS),
);
