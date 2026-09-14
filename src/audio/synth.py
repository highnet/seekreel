"""
A small synthesis kit.

No sample library and no numpy: everything here is additive synthesis over a
plain list of floats. That is slower than it could be — a minute of stereo at
48kHz is about six seconds of work — and in exchange the whole soundtrack is
one file with no binary assets, no licences to track, and nothing to download.

Every sound takes a handful of keyword arguments and returns a mono list of
samples in roughly -1..1. Panning and mixing are the caller's job, which is
what lets a cue sheet stay declarative.
"""
import math
import random

SR = 48000

NOTE_OFFSETS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(note):
    """Scientific pitch name to frequency. C4 is middle C; A4 is 440."""
    letter, rest = note[0].upper(), note[1:]
    semis = NOTE_OFFSETS[letter]
    while rest and rest[0] in "#b":
        semis += 1 if rest[0] == "#" else -1
        rest = rest[1:]
    return 440.0 * 2 ** (((int(rest) + 1) * 12 + semis - 69) / 12)


def env_ad(n, attack, decay_tau, sr=SR):
    """Percussive envelope: a short linear attack, then an exponential tail."""
    a = max(1, int(attack * sr))
    return [
        (i / a) if i < a else math.exp(-(i - a) / (decay_tau * sr))
        for i in range(n)
    ]


def noise(n, seed=0):
    rnd = random.Random(seed)
    return [rnd.uniform(-1, 1) for _ in range(n)]


def lowpass(signal, cut, sr=SR):
    a = math.exp(-2 * math.pi * cut / sr)
    out = [0.0] * len(signal)
    z = 0.0
    for i, s in enumerate(signal):
        z = s * (1 - a) + z * a
        out[i] = z
    return out


def highpass(signal, cut, sr=SR):
    return [s - l for s, l in zip(signal, lowpass(signal, cut, sr))]


# --- pitched voices ---------------------------------------------------------

def marimba(note="C4", dur=0.55, bright=1.0, sr=SR):
    """A wooden pluck: fundamental plus a fourth partial, both decaying fast."""
    f = hz(note)
    n = int(dur * sr)
    e = env_ad(n, 0.002, 0.32 * dur / 0.5, sr)
    w0, w1, w2 = (2 * math.pi * f * k / sr for k in (1, 4.02, 9.1))
    return [
        e[i]
        * (
            math.sin(w0 * i)
            + 0.30 * bright * e[i] * math.sin(w1 * i)
            + 0.08 * bright * e[i] * e[i] * math.sin(w2 * i)
        )
        * 0.42
        for i in range(n)
    ]


def bass(note="C2", dur=2.0, sr=SR):
    """A soft sine bass with a touch of second harmonic and a slow attack."""
    f = hz(note)
    n = int(dur * sr)
    w = 2 * math.pi * f / sr
    a = int(0.012 * sr)
    rel = int(0.10 * sr)
    out = [0.0] * n
    for i in range(n):
        amp = (i / a) if i < a else 1.0
        if i > n - rel:
            amp *= (n - i) / rel
        amp *= math.exp(-i / (1.9 * sr))
        out[i] = amp * (math.sin(w * i) + 0.18 * math.sin(2 * w * i)) * 0.5
    return out


def pad(note="C4", dur=4.0, sr=SR):
    """A quiet held tone, two voices slightly apart so it breathes."""
    f = hz(note)
    n = int(dur * sr)
    a = int(0.35 * sr)
    rel = int(0.9 * sr)
    out = [0.0] * n
    for i in range(n):
        amp = (i / a) if i < a else 1.0
        if i > n - rel:
            amp *= max(0.0, (n - i) / rel)
        out[i] = amp * (
            math.sin(2 * math.pi * f * i / sr)
            + math.sin(2 * math.pi * f * 1.004 * i / sr)
        ) * 0.11
    return out


def swell(note="F2", dur=1.6, sr=SR):
    """A sine under a raised-sine window: an arrival, or a departure."""
    f = hz(note)
    n = int(dur * sr)
    return [
        math.sin(math.pi * i / n) ** 2 * math.sin(2 * math.pi * f * i / sr) * 0.22
        for i in range(n)
    ]


def chime(note="C5", dur=1.5, sr=SR):
    """Struck once and allowed to ring: the fundamental, a fifth, an octave."""
    f = hz(note)
    n = int(dur * sr)
    out = [0.0] * n
    for ratio, gain, tau in ((1.0, 1.0, 0.55), (1.5, 0.6, 0.45), (2.0, 0.3, 0.30)):
        w = 2 * math.pi * f * ratio / sr
        for i in range(n):
            out[i] += math.exp(-i / (tau * sr)) * math.sin(w * i) * gain
    return [v * 0.085 for v in out]


def pip(freq=880.0, dur=0.18, sr=SR):
    """A step completing. Small, and lower than a notification."""
    n = int(dur * sr)
    e = env_ad(n, 0.003, 0.05, sr)
    w = 2 * math.pi * freq / sr
    return [
        e[i] * (math.sin(w * i) + 0.22 * math.sin(3 * w * i)) * 0.17 for i in range(n)
    ]


# --- interface sounds -------------------------------------------------------

def tick(freq=1800.0, dur=0.05, seed=11, sr=SR):
    """The click a page turn gets. Wood, not glass."""
    n = int(dur * sr)
    e = env_ad(n, 0.0005, 0.011, sr)
    w = 2 * math.pi * freq / sr
    tone = [
        e[i] * (math.sin(w * i) * 0.5 + math.sin(2.7 * w * i) * 0.2) * 0.30
        for i in range(n)
    ]
    body = lowpass(noise(n, seed), 2500, sr)
    return [tone[i] + body[i] * e[i] * 0.10 for i in range(n)]


def shutter(dur=0.14, sr=SR):
    """Two clacks, a mirror's worth apart."""
    n = int(dur * sr)
    out = [0.0] * n
    for signal, at, gain in ((tick(2400, 0.035, 11, sr), 0.0, 1.1),
                             (tick(1500, 0.05, 12, sr), 0.045, 0.9)):
        off = int(at * sr)
        for i, v in enumerate(signal):
            if off + i < n:
                out[off + i] += v * gain
    return out


def pop(dur=0.10, sr=SR):
    """A finger landing on glass: a short rising blip."""
    n = int(dur * sr)
    e = env_ad(n, 0.001, 0.022, sr)
    out = [0.0] * n
    phase = 0.0
    for i in range(n):
        phase += 2 * math.pi * (520 + 900 * (i / n) ** 0.6) / sr
        out[i] = e[i] * math.sin(phase) * 0.34
    return out


def whoosh(dur=0.55, seed=23, sr=SR):
    """Something coming free of something else: a band sweeping up."""
    n = int(dur * sr)
    s = noise(n, seed)
    lo = lowpass(s, 900, sr)
    hi = highpass(lowpass(s, 5200, sr), 1400, sr)
    out = [0.0] * n
    for i in range(n):
        x = i / n
        out[i] = (math.sin(math.pi * x) ** 1.6) * (lo[i] * (1 - x) + hi[i] * x) * 0.26
    return out


def stamp(dur=0.22, seed=31, sr=SR):
    """Paper pressed onto something. A thud and a rustle."""
    n = int(dur * sr)
    e = env_ad(n, 0.0008, 0.035, sr)
    thud = [
        math.exp(-i / (0.020 * sr)) * math.sin(2 * math.pi * 120 * i / sr) * 0.5
        for i in range(n)
    ]
    paper = lowpass(highpass(noise(n, seed), 1200, sr), 6000, sr)
    return [thud[i] + paper[i] * e[i] * 0.5 for i in range(n)]


def tray(dur=0.08, seed=41, sr=SR):
    """Something set down in a box."""
    n = int(dur * sr)
    e = env_ad(n, 0.0005, 0.012, sr)
    body = lowpass(noise(n, seed), 1800, sr)
    return [
        (body[i] * 0.8 + math.sin(2 * math.pi * 320 * i / sr) * 0.35) * e[i] * 0.30
        for i in range(n)
    ]


def shaker(dur=0.09, seed=0, sr=SR):
    n = int(dur * sr)
    s = highpass(noise(n, seed), 3000, sr)
    e = env_ad(n, 0.001, 0.02, sr)
    return [s[i] * e[i] * 0.16 for i in range(n)]


#: Everything a cue sheet may name in its `sound` field.
SOUNDS = {
    "marimba": marimba,
    "bass": bass,
    "pad": pad,
    "swell": swell,
    "chime": chime,
    "pip": pip,
    "tick": tick,
    "shutter": shutter,
    "pop": pop,
    "whoosh": whoosh,
    "stamp": stamp,
    "tray": tray,
    "shaker": shaker,
}
