"""Synthesises the 30-second score and sound design for the film.

Everything is generated from noise and simple oscillators: wind, water, paper,
projector, drafting pen, folding card, a riser, and a small Hijaz-mode score
(oud-like plucks, a frame drum and a string-like pad) resolving on D.
Cue times are in seconds and follow the scene timeline in src/lib.ts.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(1968)
t = np.arange(N) / SR

L = np.zeros(N)
R = np.zeros(N)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x)


def env(start, attack, hold, release, length=N):
    tt = np.arange(length) / SR - start
    e = np.clip(tt / attack, 0, 1) if attack > 0 else (tt >= 0).astype(float)
    e = e * np.clip(1 - (tt - attack - hold) / release, 0, 1)
    e[tt < 0] = 0
    return e


def place(x, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    n = min(len(x), N - i)
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + n] += x[:n] * gain * l
    R[i:i + n] += x[:n] * gain * r


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- ambience
pink = lp(rng.standard_normal(N), 900) * 0.6
wind_lfo = 0.55 + 0.45 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.037 * t + 1)
wind = bp(rng.standard_normal(N), 250, 1400) * wind_lfo
wind_env = env(0, 2.5, 3.2, 2.0) + 0.25 * env(16, 2, 4, 3)
place(wind * wind_env * 0.05, 0, pan=-0.2)
place(bp(rng.standard_normal(N), 300, 1600) * wind_lfo[::-1] * wind_env * 0.045, 0, pan=0.3)

# water lapping: brown noise with slow swells
brown = np.cumsum(rng.standard_normal(N))
brown = hp(brown, 40)
brown /= np.abs(brown).max()
lap = 0.5 + 0.5 * np.sin(2 * np.pi * 0.42 * t) ** 2
water = bp(brown, 120, 900) * lap
water_env = env(0.2, 2.0, 3.0, 2.5) + env(22.5, 1.5, 6, 1.5) * 0.9
place(water * water_env * 0.5, 0, pan=0.1)

# ---------------------------------------------------------------- scene 1
# ink scratching while the line is written (~0.8 s – 2.8 s)
for i in range(46):
    s = 0.8 + i * 0.043 + rng.uniform(-0.01, 0.01)
    x = bp(noise(0.05), 2500, 7000) * np.hanning(int(0.05 * SR)) * rng.uniform(0.3, 1)
    place(x * 0.022, s, pan=0.35)
# paper unfolding (~2.1 s – 4.0 s): crackles
for i in range(70):
    s = 2.1 + rng.uniform(0, 1.9)
    ln = rng.uniform(0.004, 0.03)
    x = bp(noise(ln), 1500, 7000) * np.exp(-np.linspace(0, 6, int(ln * SR)))
    place(x * rng.uniform(0.05, 0.16), s, pan=rng.uniform(-0.6, 0.6))
place(bp(noise(1.6), 200, 2500) * env(0, 0.6, 0.3, 0.7, int(1.6 * SR)) * 0.12, 2.2)
# wind gust lifting the page (4.5 s – 5.9 s)
g = noise(1.8)
sweep = np.linspace(400, 2600, len(g))
gust = np.zeros_like(g)
for k0 in range(0, len(g), 2400):
    seg = g[k0:k0 + 2400]
    f0 = sweep[k0]
    gust[k0:k0 + 2400] = bp(seg, f0 * 0.6, min(f0 * 1.6, 20000))
place(gust * env(0, 0.9, 0.2, 0.7, len(g)) * 0.22, 4.4, pan=0.4)

# ---------------------------------------------------------------- scene 2
# projector: soft shutter clicks and motor hum (5 s – 10 s)
proj_env = env(5.0, 0.5, 4.0, 0.6)
click = np.zeros(N)
for s in np.arange(5.0, 10.2, 1 / 24):
    i = int(s * SR)
    ln = int(0.006 * SR)
    if i + ln < N:
        click[i:i + ln] += rng.standard_normal(ln) * np.exp(-np.linspace(0, 5, ln))
click = bp(click, 800, 5000)
hum = 0.4 * np.sin(2 * np.pi * 50 * t) + 0.2 * np.sin(2 * np.pi * 100 * t)
place((click * 0.07 + hum * 0.012) * proj_env, 0, pan=-0.25)
# photo placed down (~7.3 s)
th = np.sin(2 * np.pi * 70 * np.arange(int(0.4 * SR)) / SR) * np.exp(-np.linspace(0, 9, int(0.4 * SR)))
place(th * 0.35 + bp(noise(0.4), 600, 4000) * np.exp(-np.linspace(0, 14, int(0.4 * SR))) * 0.12, 7.3)
# freeze into blueprint shimmer (9.7 s – 11 s)
sh = sum(np.sin(2 * np.pi * midi(m) * np.arange(int(1.6 * SR)) / SR) for m in (86, 90, 93))
place(sh * env(0, 0.5, 0.3, 0.8, len(sh)) * 0.025, 9.6, pan=0.2)
place(gust[::-1] * 0.12, 9.4, pan=-0.3)

# ---------------------------------------------------------------- scene 3
# drafting: pen strokes and ruler ticks (10.5 s – 15.5 s)
for i in range(26):
    s = 10.6 + i * 0.19 + rng.uniform(-0.04, 0.04)
    ln = rng.uniform(0.12, 0.35)
    x = bp(noise(ln), 2500, 9000) * np.sin(np.linspace(0, np.pi, int(ln * SR))) ** 2
    place(x * 0.035, s, pan=rng.uniform(-0.5, 0.5))
for s in np.arange(12.3, 15.0, 0.27):
    x = hp(noise(0.01), 4000) * np.exp(-np.linspace(0, 8, int(0.01 * SR)))
    place(x * 0.08, s, pan=0.5)
# 1968 settles on the arch (~14.4 s): bell
bt = np.arange(int(3.5 * SR)) / SR
bell = sum(a * np.sin(2 * np.pi * midi(74) * r * bt) * np.exp(-bt * d) for a, r, d in [(1, 1, 1.2), (0.5, 2.76, 2.2), (0.3, 5.4, 3.5), (0.2, 8.9, 5)])
place(bell * 0.06, 14.4, pan=0.0)

# ---------------------------------------------------------------- scene 4
# folding card (15.6 s – 16.9 s)
for i, s in enumerate(np.linspace(15.6, 16.8, 6)):
    ln = 0.14
    x = bp(noise(ln), 700, 6000) * np.exp(-np.linspace(0, 7, int(ln * SR)))
    th = np.sin(2 * np.pi * 110 * np.arange(int(ln * SR)) / SR) * np.exp(-np.linspace(0, 10, int(ln * SR)))
    place(x * 0.16 + th * 0.12, s, pan=(-1) ** i * 0.4)
# riser into reality (19.8 s – 23.0 s)
rl = 3.2
rt = np.arange(int(rl * SR)) / SR
freq = 110 * 2 ** (rt / rl * 2)
riser = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.25 + np.sin(2 * np.pi * np.cumsum(freq * 1.5) / SR) * 0.12
rn = noise(rl)
rnf = np.zeros_like(rn)
for k0 in range(0, len(rn), 2400):
    f0 = 300 + 6000 * (k0 / len(rn)) ** 2
    rnf[k0:k0 + 2400] = bp(rn[k0:k0 + 2400], f0, min(f0 * 2, 20000))
place((riser + rnf * 0.35) * (rt / rl) ** 2 * 0.3, 19.8)

# ---------------------------------------------------------------- music
def pluck(freq, dur, bright=0.5):
    """Karplus–Strong string with a short plectrum transient (oud-like)."""
    n = int(dur * SR)
    p = int(SR / freq)
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, 1500 + 4000 * bright)
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.996 * 0.5 * (v + buf[(i + 1) % p])
    body = bp(out, 90, 5000)
    return body * np.exp(-np.linspace(0, 3.2, n))


def pad(notes, start, dur, gain, attack=1.5, release=2.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.zeros(n)
    for m in notes:
        for det in (-0.08, 0.0, 0.07):
            f = midi(m + det)
            ph = rng.uniform(0, 2 * np.pi)
            # band-limited saw-ish: a few harmonics
            x += sum(np.sin(2 * np.pi * f * h * tt + ph * h) / h for h in range(1, 7))
    x = lp(x, 1800)
    e = env(0, attack, max(dur - attack - release, 0), release, n)
    place(x * e * gain, start, pan=-0.15)
    place(x * e * gain * 0.9, start + 0.013, pan=0.15)


# D Hijaz: D Eb F# G A Bb C
D3, Eb3, Fs3, G3, A3, Bb3, C4 = 50, 51, 54, 55, 57, 58, 60
D4, Eb4, Fs4, G4, A4, Bb4, C5, D5 = 62, 63, 66, 67, 69, 70, 72, 74

# low drone from the start
place(sum(np.sin(2 * np.pi * midi(m) * t) * a for m, a in [(38, 1), (45, 0.5), (50, 0.35)]) * (env(0.3, 4, 18, 3) * 0.035), 0)

# oud motif in the archival scene and the blueprint scene
motif = [(5.4, D4), (5.8, Eb4), (6.2, Fs4), (6.9, G4), (7.6, Fs4), (8.0, Eb4), (8.6, D4),
         (10.4, A4), (10.8, Bb4), (11.2, A4), (11.8, G4), (12.4, Fs4), (13.0, Eb4), (13.6, Fs4), (14.4, D4)]
for s, m in motif:
    place(pluck(midi(m), 1.6, 0.55), s, gain=0.16, pan=0.25)
    place(pluck(midi(m - 12), 1.2, 0.3), s, gain=0.05, pan=-0.2)

# frame drum from the paper world onwards (80 bpm)
def daf(start, accent):
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (95 - 30 * tt) * tt) * np.exp(-tt * 9)
    jingle = bp(rng.standard_normal(n), 5000, 12000) * np.exp(-tt * 14)
    place(body * 0.5 * accent + jingle * 0.08 * accent, start, pan=-0.1)


beat = 60 / 80
for i, s in enumerate(np.arange(16.6, 23.0, beat / 2)):
    pattern = [1, 0, 0.5, 0.6, 0, 0.5, 0.8, 0.4]
    a = pattern[i % 8]
    if a:
        daf(s, a * (0.4 + 0.6 * (s - 16.6) / 6.4))

# pads: tension through the paper world, warm resolution on D at the reveal
pad([D3, A3, Eb4], 15.6, 4.6, 0.012)
pad([G3, Bb3, D4, Fs4], 19.6, 3.6, 0.014, attack=1.0, release=0.8)
pad([D3, A3, D4, Fs4, A4], 22.9, 7.1, 0.02, attack=0.25, release=3.6)
pad([38, 45], 22.9, 7.1, 0.02, attack=0.2, release=3.8)

# impact at the reveal (~22.9 s)
it = np.arange(int(2.5 * SR)) / SR
boom = np.sin(2 * np.pi * (60 - 20 * it) * it) * np.exp(-it * 2.2)
place(boom * 0.45 + lp(rng.standard_normal(len(it)), 3000) * np.exp(-it * 5) * 0.05, 22.9)
cym = hp(rng.standard_normal(int(3 * SR)), 6000) * np.exp(-np.linspace(0, 4, int(3 * SR)))
place(cym * 0.035, 22.9, pan=0.3)

# final melody and signature chimes
for s, m in [(23.6, A4), (24.2, Fs4), (24.8, G4), (25.4, A4), (26.2, D5), (27.4, A4), (28.0, Fs4), (28.6, D4)]:
    place(pluck(midi(m), 2.2, 0.6), s, gain=0.15, pan=0.2)
for s, m in [(27.6, 86), (28.4, 90), (29.0, 93)]:
    bt = np.arange(int(2.5 * SR)) / SR
    ch = sum(a * np.sin(2 * np.pi * midi(m) * r * bt) * np.exp(-bt * d) for a, r, d in [(1, 1, 1.6), (0.35, 2.0, 2.4), (0.2, 3.0, 3.4)])
    place(ch * 0.03, s, pan=0.0)

# ---------------------------------------------------------------- master
mix = np.stack([L, R], axis=1)
# gentle room: short multi-tap reverb
rev = np.zeros_like(mix)
for d, g in [(0.031, 0.32), (0.047, 0.28), (0.071, 0.22), (0.113, 0.17), (0.167, 0.12), (0.241, 0.08)]:
    i = int(d * SR)
    rev[i:, 0] += mix[:-i, 1] * g
    rev[i:, 1] += mix[:-i, 0] * g
mix = mix + lp(rev.T, 5000).T * 0.6
mix = hp(mix.T, 25).T
fade = np.ones(N)
fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR)) ** 1.5
fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
mix *= fade[:, None]
# soft clip and normalise
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix *= 0.89 / np.abs(mix).max()
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print("ok", mix.shape[0] / SR, "s")
