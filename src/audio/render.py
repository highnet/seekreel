"""
Turn a cue sheet into a WAV.

The cue sheet is JSON so that the soundtrack is data rather than a program:
a shot moving by half a second is one number, and the file diffs usefully
against the version that came before it.

    python3 render.py --cues cues.json --out soundtrack.wav

Schema, all keys optional except `duration`:

    {
      "duration": 43,                 seconds; the film's length
      "sampleRate": 48000,
      "bed": {                        an optional looping music bed
        "tempo": 100,                 bpm
        "barsPerChord": 2,
        "progression": [ {"tones": ["D3","F3","A3","C4"], "root": "D2"}, ... ],
        "figure": [0, 2, 1, 3],       indices into `tones`, one per eighth
        "dense": [7.0, 39.0],         the window where the bed plays in full
        "bassFrom": 5.0,              no bass before this
        "shaker": true
      },
      "cues": [                       one-off sounds, placed by time
        {"at": 9.75, "sound": "shutter", "gain": 0.9, "pan": -0.05},
        {"at": 19.9, "sound": "pad", "note": "F3", "dur": 5.0, "pan": -0.2},
        {"at": 17.3, "sound": "pip", "freq": 740}
      ],
      "master": {"fadeIn": 0.15, "fadeOut": 1.1, "peak": 0.72}
    }

A cue's extra keys are passed straight to the sound, so `note`, `dur`,
`freq` and `seed` all work wherever the sound in question takes them.
"""
import argparse
import json
import math
import os
import struct
import sys
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth  # noqa: E402

#: Arguments the mixer consumes rather than passing to the sound.
MIX_KEYS = {"at", "sound", "gain", "pan"}


class Mixer:
    def __init__(self, duration, sample_rate):
        self.sr = sample_rate
        self.n = int(duration * sample_rate)
        self.left = [0.0] * self.n
        self.right = [0.0] * self.n

    def place(self, at, samples, gain=1.0, pan=0.0):
        """Equal-power pan: -1 hard left, 0 centre, +1 hard right."""
        angle = (max(-1.0, min(1.0, pan)) + 1) * math.pi / 4
        for buf, level in ((self.left, math.cos(angle)), (self.right, math.sin(angle))):
            start = int(at * self.sr)
            offset = 0
            if start < 0:
                offset = -start
                start = 0
            end = min(self.n, start + len(samples) - offset)
            for i in range(end - start):
                buf[start + i] += samples[offset + i] * gain * level


def build_bed(mix, bed, duration):
    """
    A looping figure, thinned outside the window the film is busy in.

    The density gate is a blunt instrument on purpose: a bed that follows the
    film exactly ends up composed, and a composed bed competes with what is on
    screen. Two states — sparse and full — is enough.
    """
    tempo = bed.get("tempo", 100)
    beat = 60.0 / tempo
    bar = beat * 4
    block = bar * bed.get("barsPerChord", 2)
    progression = bed.get("progression", [])
    figure = bed.get("figure", [0, 1, 2, 3])
    dense_from, dense_to = bed.get("dense", [0.0, duration])
    bass_from = bed.get("bassFrom", 0.0)
    if not progression:
        return

    t = 0.0
    index = 0
    while t < duration:
        chord = progression[index % len(progression)]
        tones = chord["tones"]
        dense = dense_from <= t < dense_to
        weight = 1.0 if dense else 0.55

        for step, which in enumerate(figure):
            at = t + step * beat / 2
            if at >= duration:
                break
            if not dense and step % 2:
                continue
            note = tones[which % len(tones)]
            accent = 0.85 if step % 4 == 0 else 0.55
            pan = -0.35 + 0.7 * (which / max(1, len(tones) - 1))
            mix.place(at, synth.marimba(note, 0.55, sr=mix.sr), accent * weight, pan)

        if chord.get("root") and t >= bass_from:
            mix.place(t, synth.bass(chord["root"], block * 0.95, sr=mix.sr), 0.85 * weight, 0.0)

        if dense and bed.get("shaker", True):
            step = 0.0
            while step < block and t + step < duration:
                gain = 0.55 if (step / beat) % 2 < 1 else 0.30
                mix.place(
                    t + step,
                    synth.shaker(seed=int((t + step) * 100) % 997, sr=mix.sr),
                    gain,
                    0.45,
                )
                step += beat / 2

        t += block
        index += 1


def master(mix, settings):
    """Fades at both ends, then a soft knee so transients cannot clip."""
    fade_in = int(settings.get("fadeIn", 0.15) * mix.sr)
    fade_out = int(settings.get("fadeOut", 1.0) * mix.sr)
    for i in range(min(fade_in, mix.n)):
        k = i / fade_in
        mix.left[i] *= k
        mix.right[i] *= k
    for i in range(min(fade_out, mix.n)):
        k = (fade_out - i) / fade_out
        mix.left[mix.n - fade_out + i] *= k
        mix.right[mix.n - fade_out + i] *= k

    peak = max(max(map(abs, mix.left), default=0.0), max(map(abs, mix.right), default=0.0))
    target = settings.get("peak", 0.72)
    drive = min(1.0, target / peak) if peak > target else 1.0

    frames = bytearray()
    for i in range(mix.n):
        l = math.tanh(mix.left[i] * drive * 1.15) * 0.84
        r = math.tanh(mix.right[i] * drive * 1.15) * 0.84
        frames += struct.pack(
            "<hh",
            int(max(-1.0, min(1.0, l)) * 32000),
            int(max(-1.0, min(1.0, r)) * 32000),
        )
    return bytes(frames), peak


def main():
    parser = argparse.ArgumentParser(description="Render a seekreel cue sheet to a WAV.")
    parser.add_argument("--cues", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    with open(args.cues) as handle:
        sheet = json.load(handle)

    duration = sheet["duration"]
    sample_rate = sheet.get("sampleRate", synth.SR)
    mix = Mixer(duration, sample_rate)

    if sheet.get("bed"):
        build_bed(mix, sheet["bed"], duration)

    for cue in sheet.get("cues", []):
        name = cue["sound"]
        if name not in synth.SOUNDS:
            raise SystemExit(
                f"Unknown sound {name!r} at {cue.get('at')}s. "
                f"Available: {', '.join(sorted(synth.SOUNDS))}"
            )
        kwargs = {k: v for k, v in cue.items() if k not in MIX_KEYS}
        kwargs.setdefault("sr", sample_rate)
        mix.place(cue["at"], synth.SOUNDS[name](**kwargs), cue.get("gain", 1.0), cue.get("pan", 0.0))

    frames, peak = master(mix, sheet.get("master", {}))

    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    with wave.open(args.out, "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(frames)

    print(f"{args.out}  {duration}s  peak {peak:.3f}"
          f"{'  (limited)' if peak > sheet.get('master', {}).get('peak', 0.72) else ''}")


if __name__ == "__main__":
    main()
