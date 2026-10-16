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
      "tracks": [                     recorded audio, placed by time
        {"at": 2.4, "file": "voice/intro.wav", "gain": 1.0, "pan": 0.0}
      ],
      "duck": {"gain": 0.3, "attack": 0.12, "release": 0.45},
      "master": {"fadeIn": 0.15, "fadeOut": 1.1, "peak": 0.72}
    }

`tracks` are WAV files (PCM, 8/16/24/32-bit, mono or stereo, any rate),
relative to the cue sheet: a voiceover, a recorded line, a sound you did not
synthesize. `duck` lowers the bed and the cues while any track is sounding, so
a voice sits on top of the music instead of fighting it.

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


def read_wav(file, sample_rate):
    """
    A WAV as a list of (left, right) floats at the sheet's rate.

    Standard library only, like the rest of this engine: `wave` reads the
    container, the samples are unpacked by hand, and a different rate is
    resampled linearly. Linear is not mastering grade, which is why the
    pipeline that makes the files should write them at the sheet's rate.
    """
    with wave.open(file, "rb") as handle:
        channels = handle.getnchannels()
        width = handle.getsampwidth()
        rate = handle.getframerate()
        raw = handle.readframes(handle.getnframes())

    count = len(raw) // width
    if width == 1:
        values = [(b - 128) / 128.0 for b in raw]
    elif width == 2:
        values = [v / 32768.0 for v in struct.unpack(f"<{count}h", raw)]
    elif width == 3:
        values = [
            int.from_bytes(raw[i:i + 3], "little", signed=True) / 8388608.0
            for i in range(0, len(raw), 3)
        ]
    elif width == 4:
        values = [v / 2147483648.0 for v in struct.unpack(f"<{count}i", raw)]
    else:
        raise SystemExit(f"{file}: unsupported sample width {width * 8} bits")

    left = values[0::channels]
    right = values[1::channels] if channels > 1 else left

    if rate != sample_rate:
        ratio = rate / sample_rate
        n = int(len(left) / ratio)

        def resample(src):
            out = [0.0] * n
            last = len(src) - 1
            for i in range(n):
                x = i * ratio
                j = int(x)
                k = x - j
                out[i] = src[j] * (1 - k) + src[min(j + 1, last)] * k
            return out

        left, right = resample(left), resample(right)
    return left, right


def place_tracks(mix, tracks, base, duck):
    """
    Lay recorded tracks over everything else, ducking what is underneath.

    The duck is an envelope over the spans where a track sounds, with a short
    attack before it starts and a slower release after it ends, so the bed
    makes room for a voice instead of being switched off and on.
    """
    if not tracks:
        return
    spans = []
    loaded = []
    for track in tracks:
        file = os.path.join(base, track["file"])
        if not os.path.exists(file):
            raise SystemExit(f"Track not found: {file}")
        left, right = read_wav(file, mix.sr)
        loaded.append((track, left, right))
        spans.append((track["at"], track["at"] + len(left) / mix.sr))

    if duck:
        floor = duck.get("gain", 0.3)
        attack = max(1e-3, duck.get("attack", 0.12))
        release = max(1e-3, duck.get("release", 0.45))
        depth = [0.0] * mix.n
        for start, end in spans:
            first = max(0, int((start - attack) * mix.sr))
            last = min(mix.n, int((end + release) * mix.sr) + 1)
            for i in range(first, last):
                t = i / mix.sr
                if t < start:
                    d = 1 - (start - t) / attack
                elif t > end:
                    d = 1 - (t - end) / release
                else:
                    d = 1.0
                if d > depth[i]:
                    depth[i] = d
        for i, d in enumerate(depth):
            if d:
                k = 1 - d * (1 - floor)
                mix.left[i] *= k
                mix.right[i] *= k

    for track, left, right in loaded:
        gain = track.get("gain", 1.0)
        pan = track.get("pan", 0.0)
        if left is right:
            mix.place(track["at"], left, gain, pan)
        else:
            mix.place(track["at"], left, gain, -1.0)
            mix.place(track["at"], right, gain, 1.0)


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

    place_tracks(
        mix,
        sheet.get("tracks", []),
        os.path.dirname(os.path.abspath(args.cues)),
        sheet.get("duck"),
    )

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
