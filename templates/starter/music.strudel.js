/*
 * The soundtrack, as a Strudel pattern.
 *
 * `seekreel audio` queries this once for the whole film and renders it through
 * an OfflineAudioContext — no realtime playback, no recording, the same WAV
 * every time. Try it live at strudel.cc: the language is the same.
 *
 * cps is cycles per second, and it is the only number tying this grid to the
 * film's seconds. At 0.5 a cycle is two seconds, so this six-second film is
 * three of them — put the picture's cuts on those boundaries and they land on
 * the beat instead of near it.
 *
 * Every voice here is synthesised, so the render needs no network and the
 * project carries no audio files. Sample-based sounds — s("bd") and the drum
 * banks — download packs the first time they are asked for.
 */

setcps(0.5);

stack(
  // Kick: on the one and the three, with a click of noise for the transient a
  // sine alone does not have.
  note("c1").s("sine").struct("x ~ ~ ~ x ~ ~ ~").attack(0.001).decay(0.24).sustain(0),
  s("white").struct("x ~ ~ ~ x ~ ~ ~").decay(0.012).sustain(0).lpf(900).gain(0.45),

  // Hats: eighths, the off-beats quieter.
  s("white").struct("x*8").decay(0.03).sustain(0).hpf(7000).gain("[0.3 0.14]*4"),

  // Bass: one chord root a cycle, through a filter that opens as it goes.
  note("<c2 ab1 eb2>").s("sawtooth")
    .struct("x ~ x x ~ x ~ ~")
    .decay(0.2).sustain(0.15)
    .lpf(sine.range(400, 1400).slow(3))
    .gain(0.45),

  // Pad: the bed everything else sits on.
  note("<[c3,eb3,g3] [ab2,c3,eb3] [eb3,g3,bb3]>").s("triangle")
    .attack(0.7).sustain(0.7).release(1.2)
    .lpf(1600).room(0.7)
    .gain(0.32),

  // One bell figure, so there is something to remember.
  note("<c5 eb5 g5>(3,8)").s("triangle")
    .decay(0.3).sustain(0)
    .delay(0.4).delaytime(0.16).room(0.6)
    .gain(0.38),
);
