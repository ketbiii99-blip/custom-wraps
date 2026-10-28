"""Soundtrack for the fast cut (AlMaqtaReel): a 120 bpm Hijaz groove with
impacts, a tape rewind, whooshes and a drop, locked to the edit's frames.

Every cue is given in video frames (30 fps) to match src/reel/Reel.tsx.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
N = SR * 30
rng = np.random.default_rng(58)
L = np.zeros(N)
R = np.zeros(N)
FPS = 30
BEAT = 0.5


def fr(n):
    return n / FPS


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, min(hi, SR / 2 - 100)], "bandpass", fs=SR, output="sos"), x)


def lp(x, f):
    return sosfilt(butter(2, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, "highpass", fs=SR, output="sos"), x)


def place(x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    n = min(len(x), N - i)
    L[i:i + n] += x[:n] * g * np.cos((pan + 1) * np.pi / 4)
    R[i:i + n] += x[:n] * g * np.sin((pan + 1) * np.pi / 4)


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def noise(sec):
    return rng.standard_normal(int(sec * SR))


# ------------------------------------------------------------------ drums
def kick(g=1.0, sec=0.42, f0=160, f1=42):
    t = tt(sec)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    x += lp(noise(sec), 3000) * np.exp(-t * 90) * 0.4
    return x * g


def clap(g=1.0):
    x = np.zeros(int(0.25 * SR))
    for d in (0, 0.011, 0.022):
        i = int(d * SR)
        n = noise(0.25 - d) * np.exp(-tt(0.25 - d) * (60 if d < 0.02 else 18))
        x[i:] += n
    return bp(x, 900, 6000) * g


def hat(g=1.0, open_=False):
    sec = 0.2 if open_ else 0.045
    return hp(noise(sec), 7000) * np.exp(-tt(sec) * (14 if open_ else 80)) * g


def dum(g=1.0):
    t = tt(0.35)
    f = 85 + 60 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + bp(noise(0.35), 200, 900) * np.exp(-t * 40) * 0.3) * g


def tek(g=1.0):
    t = tt(0.09)
    return (bp(noise(0.09), 1800, 6500) * np.exp(-t * 55) + np.sin(2 * np.pi * 620 * t) * np.exp(-t * 60) * 0.5) * g


def impact(g=1.0, sec=2.4):
    t = tt(sec)
    boom = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-t * 1.2) + 28) / SR) * np.exp(-t * 2.0)
    crack = lp(noise(sec), 4000) * np.exp(-t * 9)
    tail = bp(noise(sec), 300, 3000) * np.exp(-t * 2.5) * 0.25
    return (boom * 1.0 + crack * 0.5 + tail) * g


def whoosh(sec=0.5, up=True, g=1.0):
    x = noise(sec)
    out = np.zeros_like(x)
    step = 1200
    for i in range(0, len(x), step):
        p = i / len(x)
        p = p if up else 1 - p
        f0 = 300 + 5000 * p ** 1.5
        out[i:i + step] = bp(x[i:i + step], f0, f0 * 2.2)
    env = np.sin(np.linspace(0, np.pi, len(x))) ** 1.5
    return out * env * g


def riser(sec, g=1.0):
    t = tt(sec)
    f = 110 * 2 ** (t / sec * 3)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return (tone * 0.3 + whoosh(sec, True) * 1.2) * (t / sec) ** 2 * g


def pluck(freq, sec=0.6, bright=0.6):
    n = int(sec * SR)
    p = max(2, int(SR / freq))
    buf = lp(rng.uniform(-1, 1, p), 1500 + 5000 * bright)
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.994 * 0.5 * (v + buf[(i + 1) % p])
    return bp(out, 90, 7000) * np.exp(-np.linspace(0, 4, n))


def saw(freq, sec, harm=10):
    t = tt(sec)
    return sum(np.sin(2 * np.pi * freq * h * t) / h for h in range(1, harm))


def bass(m, sec, g=1.0):
    x = lp(saw(midi(m), sec, 8), 600)
    e = np.minimum(1, tt(sec) / 0.005) * np.exp(-tt(sec) * 3)
    return x * e * g


def pad(notes, sec, g=1.0, attack=0.4, release=1.5):
    t = tt(sec)
    x = sum(saw(midi(m + d), sec, 6) for m in notes for d in (-0.07, 0.06))
    x = lp(x, 2200)
    e = np.minimum(1, t / attack) * np.clip((sec - t) / release, 0, 1)
    return x * e * g


# ------------------------------------------------------------------ HOOK 0–5 s
place(impact(1.0), 0.0)
place(whoosh(0.35, False, 0.6), 0.0, pan=0.2)
for f in (2, 12, 22):
    place(kick(0.9, f0=200), fr(f))
    place(clap(0.5), fr(f), pan=0.1)
for f in (45, 55):
    place(impact(0.7, 1.2), fr(f))
    place(kick(1.0), fr(f))
# a pulse under the words
for b in np.arange(0, 2.0, BEAT / 2):
    place(hat(0.25), b, pan=0.4)

# tape rewind 2.1–3.33 s
rw = tt(1.25)
warble = np.sin(2 * np.pi * np.cumsum(900 + 700 * np.sin(2 * np.pi * 9 * rw) + 1600 * (rw / 1.25)) / SR)
rewind = (warble * 0.25 + bp(noise(1.25), 1500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * rw)) * 0.6) * np.minimum(1, rw / 0.1)
place(rewind * 0.55, fr(63), pan=-0.1)
for i in range(12):
    place(tek(0.35), fr(64) + i * 0.1, pan=(-1) ** i * 0.5)
rev_cym = hp(noise(0.9), 5000) * np.linspace(0, 1, int(0.9 * SR)) ** 3
place(rev_cym * 0.4, fr(100) - 0.9)

# 1968 lands
place(impact(1.2, 3.0), fr(100))
place(kick(1.2, f0=120, f1=35, sec=0.8), fr(100))
crackle = np.zeros(int(1.6 * SR))
for _ in range(220):
    i = rng.integers(0, len(crackle) - 200)
    crackle[i:i + 60] += rng.standard_normal(60) * np.exp(-np.linspace(0, 6, 60))
place(hp(crackle, 1500) * 0.25, fr(100))
for i in range(3):
    place(kick(0.6, f0=110, sec=0.3), fr(100) + 0.5 + i * 0.5)

# ------------------------------------------------------------------ GROOVE 5–19 s
HIJAZ_BASS = [38, 38, 42, 43, 45, 43, 42, 39]
RIFF = [62, 63, 66, 67, 69, 67, 66, 63, 62, 66, 69, 70, 69, 67, 66, 62]


def groove(start, end, energy=1.0, dumtek=True, riff=True):
    for i, b in enumerate(np.arange(start, end - 1e-6, BEAT)):
        place(kick(0.9 * energy), b)
        if i % 2 == 1:
            place(clap(0.55 * energy), b, pan=0.05)
        place(hat(0.3 * energy), b + BEAT / 2, pan=0.35)
        place(hat(0.15 * energy), b + BEAT / 4, pan=0.35)
        place(hat(0.15 * energy), b + 3 * BEAT / 4, pan=0.35)
        if dumtek:
            place(dum(0.35 * energy), b + BEAT * 0.75, pan=-0.3)
            place(tek(0.3 * energy), b + BEAT * 0.25, pan=-0.35)
        place(bass(HIJAZ_BASS[i % 8], BEAT * 0.9, 0.35 * energy), b)
        place(bass(HIJAZ_BASS[i % 8], BEAT * 0.4, 0.25 * energy), b + BEAT / 2)
        if riff:
            place(pluck(midi(RIFF[(2 * i) % 16]), 0.4), b, 0.16 * energy, pan=0.3)
            place(pluck(midi(RIFF[(2 * i + 1) % 16]), 0.4), b + BEAT / 2, 0.13 * energy, pan=0.3)


groove(fr(150), fr(555), 1.0)

# transitions inside the groove
place(whoosh(0.5, True, 0.9), fr(225) - 0.2, pan=-0.5)          # whip out of the parchment
place(whoosh(0.4, False, 0.8), fr(240), pan=0.5)                # whip into the archive
for f in (270, 290):
    place(impact(0.5, 0.8), fr(f))
shutter = bp(noise(0.08), 1500, 8000) * np.exp(-tt(0.08) * 40)
place(shutter * 0.8, fr(290))
place(shutter * 0.6, fr(290) + 0.06)
glitch = np.zeros(int(0.45 * SR))
for i in range(0, len(glitch), 1200):
    if rng.random() > 0.4:
        glitch[i:i + 1200] = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2000) * tt(0.025)[:1200])) * 0.3
place(glitch, fr(316), pan=0.2)
place(impact(0.6, 1.0), fr(330))
place(whoosh(0.35, False, 0.6), fr(330))
for i, f in enumerate(np.linspace(436, 449, 5)):                  # paper folds
    place(bp(noise(0.12), 800, 6000) * np.exp(-tt(0.12) * 30) * 0.5, fr(f), pan=(-1) ** i * 0.4)
place(impact(0.5, 0.9), fr(450))
place(pad([50, 57, 63], fr(570) - fr(450), 0.03), fr(450))

# ------------------------------------------------------------------ BUILD + DROP
place(riser(fr(570) - fr(540), 0.9), fr(540))
roll_times = []
t0 = fr(540)
step = 0.125
while t0 < fr(570) - 0.03:
    roll_times.append(t0)
    t0 += step
    step = max(0.035, step * 0.9)
for i, t in enumerate(roll_times):
    place(clap(0.25 + 0.5 * i / len(roll_times)), t, pan=0.1)
for f in (555, 560, 564, 567):
    place(kick(0.7, f0=220, sec=0.2), fr(f))

place(impact(1.4, 3.2), fr(570))
place(kick(1.4, f0=110, f1=32, sec=1.0), fr(570))
place(hp(noise(2.5), 6000) * np.exp(-tt(2.5) * 1.6) * 0.25, fr(570), pan=0.3)
groove(fr(570) + BEAT, fr(750), 1.25)
for f in (570, 600, 630):
    place(pad([50, 54, 57, 62], 1.4, 0.05, attack=0.01, release=1.2), fr(f))
for f in (660, 690, 712, 734):                                    # slider swishes
    place(whoosh(0.3, True, 0.7), fr(f) - 0.05, pan=0.4)

# ------------------------------------------------------------------ SIGNATURE 25–30 s
place(whoosh(0.6, False, 0.7), fr(750))
place(impact(1.0, 3.0), fr(750))
place(pad([38, 45, 50, 54, 57, 62, 66], 30 - fr(750), 0.045, attack=0.05, release=3.0), fr(750))
place(impact(0.9, 2.5), fr(792))
for i, (t, m) in enumerate([(fr(792), 86), (fr(800), 90), (fr(808), 93), (fr(820), 98)]):
    t2 = tt(2.5)
    chime = sum(a * np.sin(2 * np.pi * midi(m) * r * t2) * np.exp(-t2 * d) for a, r, d in [(1, 1, 1.4), (0.4, 2, 2.4), (0.2, 3, 3.5)])
    place(chime * 0.05, t, pan=(-1) ** i * 0.3)
for t, m in [(26.6, 69), (27.1, 66), (27.6, 67), (28.1, 69), (28.8, 74)]:
    place(pluck(midi(m), 1.6, 0.6), t, 0.2, pan=0.2)
for b in np.arange(fr(792), 29.0, BEAT):
    place(dum(0.3), b, pan=-0.3)
    place(tek(0.2), b + BEAT / 2, pan=0.3)

# ------------------------------------------------------------------ master
mix = np.stack([L, R], 1)
rev = np.zeros_like(mix)
for d, g in [(0.029, 0.3), (0.043, 0.26), (0.067, 0.2), (0.101, 0.15), (0.157, 0.1)]:
    i = int(d * SR)
    rev[i:, 0] += mix[:-i, 1] * g
    rev[i:, 1] += mix[:-i, 0] * g
mix = mix + lp(rev.T, 6000).T * 0.4
mix = hp(mix.T, 28).T
fade = np.ones(N)
fade[-int(1.0 * SR):] = np.linspace(1, 0, int(1.0 * SR)) ** 1.6
mix *= fade[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.93 / np.abs(mix).max()
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print("ok")
