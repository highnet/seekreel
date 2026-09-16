/*
 * seekreel — the promo's soundtrack, as a Strudel pattern.
 *
 * Rendered by `seekreel audio` through an OfflineAudioContext: this file is
 * never played in real time, it is queried once for the whole film and
 * rendered as fast as the machine can manage. Same source, same WAV, every
 * time — the sound keeps the promise the picture makes.
 *
 * The grid: cps 0.625, so a cycle is 1.6s and the film is exactly ten of them.
 * The picture cuts every two cycles — 3.2, 6.4, 9.6, 12.8 — so every section
 * below lines up with a shot rather than drifting past it.
 *
 *   cycles 0-1   the wordmark      pad only, no pulse yet
 *   cycles 2-3   the scrubber      kick, hats, sub
 *   cycles 4-5   the contract      bells arrive on the three rules
 *   cycles 6-7   the commands      snare, the bass starts moving
 *   cycles 8-9   the end card      everything drops but the pad and one bell
 *
 * Every voice is synthesised. Nothing here loads a sample, which is why the
 * render needs no network and the repo carries no audio.
 */

setcps(0.625);

// C minor: i - VI - III - VII, one chord a cycle, the whole film twice round.
const ROOT = "<c2 ab1 eb2 bb1>";
const VOICING = "<[c3,eb3,g3] [ab2,c3,eb3] [eb3,g3,bb3] [bb2,d3,f3]>";
// The same roots an octave up, which is where a saw bass actually sits.
const BASS = "<c3 ab2 eb3 bb2>";

// Which cycles each layer is allowed to sound in. Ten digits, ten cycles.
const PULSE = "<0 0 1 1 1 1 1 1 0 0>";
const BELLS = "<0 0 0 0 1 1 1 1 1 0>";
const DRIVE = "<0 0 0 0 0 0 1 1 0 0>";

stack(
  /* Pad: the only thing under the whole film. Slow attack so it swells into
     the wordmark rather than starting. */
  note(VOICING)
    .s("triangle")
    .attack(0.8).decay(0.4).sustain(0.7).release(1.4)
    .lpf(1600)
    .room(0.7).roomsize(4)
    .gain(0.34),

  /* Kick: half-time, which at 150bpm reads as a 75bpm walk rather than a
     dance track. It has a click of noise on top because a sine alone has no
     transient and disappears under everything else. */
  note("c1").s("sine")
    .attack(0.001).decay(0.26).sustain(0).release(0.08)
    .struct("x ~ ~ ~ x ~ ~ ~")
    .gain(1.0)
    .mask(PULSE),
  s("white")
    .decay(0.012).sustain(0)
    .lpf(900)
    .struct("x ~ ~ ~ x ~ ~ ~")
    .gain(0.5)
    .mask(PULSE),

  /* Sub: the chord's root, an octave under the bass, riding the same envelope
     as the kick so the two read as one hit. */
  note(ROOT).s("sine")
    .attack(0.01).decay(0.5).sustain(0.35).release(0.3)
    .gain(0.55)
    .mask(PULSE),

  /* Bass: a saw through a filter that opens across each cycle. This is the
     voice that makes it sound like music rather than a UI sound set. */
  note(BASS)
    .s("sawtooth")
    .struct("x ~ x x ~ x ~ ~")
    .attack(0.005).decay(0.18).sustain(0.15).release(0.12)
    .lpf(sine.range(420, 1500).slow(4))
    .resonance(12)
    .gain(0.42)
    .mask(PULSE),

  /* Hats: straight eighths, the off-beats quieter, a little swing so it does
     not sit exactly on the frame grid the picture is already on. */
  s("white")
    .struct("x*8")
    .decay(0.03).sustain(0)
    .hpf(7200)
    .gain("[0.3 0.14]*4")
    .pan(sine.range(0.35, 0.65).fast(2))
    .mask(PULSE),

  /* Snare: backbeat, arriving only for the commands section. */
  s("pink")
    .struct("~ x ~ x")
    .attack(0.001).decay(0.14).sustain(0)
    .bpf(1900).resonance(4)
    .room(0.3)
    .gain(0.42)
    .mask(DRIVE),

  /* Bells: the euclidean 3-in-8 figure, delayed, which is the line anyone
     hums afterwards. It carries through the end card alone. */
  note("<c5 eb5 g5 bb4>(3,8)")
    .s("triangle")
    .attack(0.002).decay(0.3).sustain(0).release(0.2)
    .delay(0.4).delaytime(0.16).delayfeedback(0.35)
    .room(0.6).roomsize(5)
    .gain(0.4)
    .mask(BELLS),

  /* One rising sweep into the beat, and one into the end card. Noise through
     a filter that climbs — the oldest trick there is, and it still works. */
  s("white")
    .struct("x")
    .attack(1.2).decay(0.4).sustain(0).release(0.2)
    .hpf(saw.range(300, 9000).slow(2))
    .gain(0.22)
    .mask("<0 1 0 0 0 0 0 1 0 0>"),
);
