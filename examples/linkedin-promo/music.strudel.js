/*
 * seekreel — the promo's soundtrack, as a Strudel pattern.
 *
 * Rendered by `seekreel audio` through an OfflineAudioContext: this file is
 * never played in real time, it is queried once for the whole film and rendered
 * as fast as the machine can manage.
 *
 * The grid: cps 0.5, so a cycle is two seconds and the film is twenty-four of
 * them. The picture cuts every two cycles — every four seconds, twelve shots —
 * and each section below turns over on the same boundary, so a cut lands on a
 * downbeat rather than near one.
 *
 *   cycles  0-1   the wordmark        pad, and one rising sweep
 *   cycles  2-3   the contract        kick arrives
 *   cycles  4-5   determinism         hats and sub
 *   cycles  6-7   the commands        bass starts moving
 *   cycles  8-9   the deliverables    snare on the backbeat
 *   cycles 10-11  3D                  filtered down, low and wide
 *   cycles 12-13  React, GSAP, plain  everything back, bells in
 *   cycles 14-15  sound               breakdown — bass and bells alone
 *   cycles 16-17  TypeScript          full again
 *   cycles 18-19  install             bells an octave up
 *   cycles 20-21  the repository      the loudest it gets
 *   cycles 22-23  the end card        everything drops but pad and one bell
 *
 * Every voice is synthesised. Nothing here loads a sample, which is why the
 * render needs no network and the repo carries no audio.
 */

setcps(0.5);

// C minor: i - VI - III - VII, one chord a cycle, six times round the film.
const ROOT = "<c2 ab1 eb2 bb1>";
const BASS = "<c3 ab2 eb3 bb2>";
const VOICING = "<[c3,eb3,g3] [ab2,c3,eb3] [eb3,g3,bb3] [bb2,d3,f3]>";

// Which cycles each layer sounds in. Twenty-four digits, twenty-four cycles.
const KICK  = "<0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 0 0>";
const HATS  = "<0 0 0 0 1 1 1 1 1 1 0 0 1 1 0 0 1 1 1 1 1 1 0 0>";
const SUB   = "<0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0>";
const BASSY = "<0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0>";
const SNARE = "<0 0 0 0 0 0 0 0 1 1 0 0 1 1 0 0 1 1 1 1 1 1 0 0>";
const BELLS = "<0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 0>";
const HIGH  = "<0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 0 0>";
const SWEEP = "<0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0 0>";

stack(
  /* Pad: under the whole film, slow enough to swell into the wordmark rather
     than start. */
  note(VOICING)
    .s("triangle")
    .attack(0.9).decay(0.5).sustain(0.7).release(1.6)
    .lpf(1500)
    .room(0.7).roomsize(5)
    .gain(0.32),

  /* Kick: half-time, which at this tempo reads as a walk rather than a dance
     track. The click of noise on top is the transient a sine does not have. */
  note("c1").s("sine")
    .attack(0.001).decay(0.3).sustain(0).release(0.08)
    .struct("x ~ ~ ~ x ~ ~ ~")
    .gain(1.0)
    .mask(KICK),
  s("white")
    .decay(0.012).sustain(0)
    .lpf(900)
    .struct("x ~ ~ ~ x ~ ~ ~")
    .gain(0.45)
    .mask(KICK),

  /* Sub: the chord's root under the kick, riding the same envelope so the two
     read as one hit. */
  note(ROOT).s("sine")
    .attack(0.01).decay(0.6).sustain(0.3).release(0.4)
    .gain(0.5)
    .mask(SUB),

  /* Bass: a saw through a filter that opens across two cycles. This is the
     voice that makes it music rather than a UI sound set. */
  note(BASS).s("sawtooth")
    .struct("x ~ x x ~ x ~ ~")
    .attack(0.005).decay(0.2).sustain(0.15).release(0.14)
    .lpf(sine.range(420, 1600).slow(4))
    .resonance(11)
    .gain(0.4)
    .mask(BASSY),

  /* Hats: eighths, off-beats quieter, panned a little so the middle stays
     clear for the type. */
  s("white")
    .struct("x*8")
    .decay(0.03).sustain(0)
    .hpf(7200)
    .gain("[0.28 0.13]*4")
    .pan(sine.range(0.35, 0.65).fast(2))
    .mask(HATS),

  /* Snare: backbeat, from the deliverables shot on. */
  s("pink")
    .struct("~ x ~ x")
    .attack(0.001).decay(0.15).sustain(0)
    .bpf(1900).resonance(4)
    .room(0.3)
    .gain(0.4)
    .mask(SNARE),

  /* Bells: the euclidean figure anyone hums afterwards, and the one voice that
     carries through the end card alone. */
  note("<c5 eb5 g5 bb4>(3,8)")
    .s("triangle")
    .attack(0.002).decay(0.32).sustain(0).release(0.2)
    .delay(0.4).delaytime(0.18).delayfeedback(0.35)
    .room(0.6).roomsize(5)
    .gain(0.38)
    .mask(BELLS),
  note("<c6 eb6 g6>(5,8)")
    .s("triangle")
    .decay(0.18).sustain(0)
    .delay(0.35).delaytime(0.12)
    .gain(0.18)
    .mask(HIGH),

  /* A rising sweep into each act: the oldest trick there is, still working. */
  s("white")
    .struct("x")
    .attack(1.6).decay(0.4).sustain(0).release(0.2)
    .hpf(saw.range(300, 9000).slow(2))
    .gain(0.2)
    .mask(SWEEP),
);
