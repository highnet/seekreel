/*
 * "Fries for Two" — the family pack's bossa nova, as a Strudel pattern.
 *
 * Every voice is synthesized (no samples), so `seekreel audio` renders it
 * offline with no network. cps 0.5 makes one cycle — one bar — two seconds.
 *
 * Arrange it for your own film by editing BARS and the sections below: each
 * layer plays in the bar ranges listed for it. The sample movie is 24 bars
 * (48 seconds), and its scenes turn over on these same bar lines:
 *
 *   bars  0-1   title            pad and guitar
 *   bars  2-3   card: picnic     the groove starts
 *   bars  4-9   the picnic       full bossa, the whistled tune
 *   bars 10-11  card: getaway
 *   bars 12-16  the getaway      tune up an octave, vibes
 *   bars 17-18  card: museum     drums drop out
 *   bars 19-23  the museum       soft, bells, one chord rings out
 *
 * Note: Strudel reads every double-quoted string as a pattern, so plain
 * JavaScript strings in the setup code below use single quotes.
 */

setcps(0.5);

const BARS = 24;
const bars = (...ranges) =>
  '<' + Array.from({ length: BARS }, (_, i) => (ranges.some(([a, b]) => i >= a && i < b) ? 1 : 0)).join(' ') + '>';

// ---- harmony, one chord a bar ------------------------------------------------
const CHORDS = {
  C:  { v: 'e3,g3,b3,d4', r: 'c2', f: 'g1' },   // Cmaj9
  Am: { v: 'c3,e3,g3,b3', r: 'a1', f: 'e2' },   // Am9
  Dm: { v: 'f3,a3,c4,e4', r: 'd2', f: 'a1' },   // Dm9
  G:  { v: 'f3,b3,e4',    r: 'g1', f: 'd2' },   // G13
  F:  { v: 'a3,c4,e4,g4', r: 'f1', f: 'c2' },   // Fmaj9
  Em: { v: 'g3,b3,d4',    r: 'e2', f: 'b1' },   // Em7
  Gs: { v: 'f3,a3,c4,d4', r: 'g1', f: 'd2' },   // G7sus
};
const A = ['C', 'Am', 'Dm', 'G'];
const B = ['F', 'Em', 'Dm', 'Gs'];
const ENDING = ['F', 'Gs', 'C', 'C'];
const prog = [];
for (let i = 0; i < BARS; i++) {
  if (i >= 17 && i < 20) prog.push(B[i % 4]);
  else if (i >= BARS - 4) prog.push(ENDING[i - (BARS - 4)]);
  else prog.push(A[i % 4]);
}
const seq = (fn) => '<' + prog.map(fn).join(' ') + '>';
const VOICING = seq((c) => '[' + CHORDS[c].v + ']');
const BASSLINE = seq((c) => '[' + CHORDS[c].r + ' ~ ~ ' + CHORDS[c].f + ' ' + CHORDS[c].f + ' ~ ~ ' + CHORDS[c].r + ']');

const TUNE = '<[e5 ~ d5 e5 ~ g5 ~ ~] [a4 ~ c5 ~ e5 d5 ~ ~] [f5 ~ e5 d5 ~ c5 ~ a4] [b4 ~ ~ d5 g4 ~ ~ ~]>';

// ---- the arrangement: which bars each layer plays --------------------------------
const PAD     = bars([0, 4], [17, 24]);
const COMP    = bars([0, 23]);
const BASS    = bars([2, 17], [19, 22]);
const GROOVE  = bars([2, 17]);
const SHAKER  = bars([2, 17], [20, 22]);
const LEAD    = bars([1, 10]);
const LEAD_HI = bars([12, 17]);
const VIBES   = bars([12, 23]);
const BELLS   = bars([19, 24]);

stack(
  note(VOICING).s("sine").attack(0.8).decay(0.6).sustain(0.6).release(1.4)
    .lpf(1800).room(0.6).roomsize(4).gain(0.2).mask(PAD),

  note(VOICING).s("triangle").struct("x ~ ~ x ~ ~ x ~ ~ ~ x ~ ~ x ~ ~")
    .attack(0.003).decay(0.28).sustain(0.08).release(0.2).lpf(2400).room(0.3)
    .gain("<0.22 0.2 0.22 0.19>").mask(COMP),

  note(BASSLINE).s("triangle").attack(0.005).decay(0.35).sustain(0.35).release(0.18)
    .lpf(700).gain(0.62).mask(BASS),
  note(BASSLINE).s("sine").attack(0.005).decay(0.4).sustain(0.3).release(0.2)
    .gain(0.4).mask(BASS),

  note("c1").s("sine").struct("x ~ ~ x x ~ ~ x")
    .attack(0.001).decay(0.18).sustain(0).release(0.05)
    .gain("[0.7 0.35 0.6 0.35]").mask(GROOVE),

  s("white").struct("[x ~ ~ x ~ ~ x ~ ~ ~ x ~ ~ x ~ ~]/2")
    .attack(0.001).decay(0.025).sustain(0).bpf(2600).resonance(6)
    .gain(0.5).mask(GROOVE),

  s("white").struct("x*16").attack(0.004).decay(0.035).sustain(0).hpf(6500)
    .gain("[0.14 0.05 0.09 0.05]*4").pan(sine.range(0.4, 0.6).fast(1)).mask(SHAKER),

  note(TUNE).s("sine").attack(0.02).decay(0.3).sustain(0.5).release(0.25)
    .delay(0.25).delaytime(0.375).delayfeedback(0.25).room(0.35)
    .gain(0.3).mask(LEAD),
  note(TUNE).add(note(12)).s("sine").attack(0.02).decay(0.25).sustain(0.4).release(0.2)
    .delay(0.3).delaytime(0.375).delayfeedback(0.3).room(0.4)
    .gain(0.2).mask(LEAD_HI),

  note(VOICING).arp("~ 0 ~ 1 ~ 2 ~ 1").add(note(12)).s("triangle")
    .attack(0.002).decay(0.4).sustain(0).release(0.3).room(0.5)
    .gain(0.14).mask(VIBES),

  note("<c6 e6 g6 b5>(3,8)").s("triangle").attack(0.002).decay(0.5).sustain(0).release(0.4)
    .delay(0.4).delaytime(0.25).delayfeedback(0.4).room(0.7).roomsize(5)
    .gain(0.13).mask(BELLS),
);
