"""Ambient sound bed for an episode (no musical instruments): night wind, soft footsteps,
a rustle when the branch is moved, one bell-like chime at the reward moment, dawn birds.
usage: python3 engine/audio.py out/ep01.wav <duration> <stopAt> <resumeAt> [rewardAt]"""
import sys, wave, numpy as np
out, DUR, STOP, RESUME = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
REWARD = float(sys.argv[5]) if len(sys.argv) > 5 else STOP + 2.0
SR = 44100; N = int(DUR * SR); t = np.arange(N) / SR; rs = np.random.RandomState(3)
ss = lambda a, b, x: (lambda u: u * u * (3 - 2 * u))(np.clip((x - a) / (b - a), 0, 1))
def band(n, lo, hi, seed):
    x = np.random.RandomState(seed).randn(n); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X *= np.exp(-0.5 * (np.log((f + 1) / np.sqrt(lo * hi)) / (np.log(hi / lo) / 2.2)) ** 2)
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def place(buf, sig, at, gain):
    i = int(at * SR)
    if i < 0 or i >= len(buf): return
    sig = sig[: len(buf) - i]; buf[i:i + len(sig)] += sig * gain
L = np.zeros(N); R = np.zeros(N)
# wind
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.047 * t + 1)
L += band(N, 120, 700, 1) * 0.085 * lfo; R += band(N, 120, 700, 2) * 0.085 * lfo
# footsteps, synced with the animation's walk cycle
sp = 1 - ss(STOP - 0.7, STOP, t) + ss(RESUME, RESUME + 0.8, t)
ph = np.cumsum(165 * sp / SR) / 34
k = np.floor(ph / np.pi - 0.5); idx = np.nonzero(np.diff(k) > 0)[0]
for j, i in enumerate(idx):
    n = int(0.13 * SR); e = np.exp(-np.arange(n) / (0.028 * SR))
    s = band(n, 250, 1600, 100 + j) * e
    pan = 0.45 + 0.1 * (j % 2); place(L, s, i / SR, 0.16 * pan * 2); place(R, s, i / SR, 0.16 * (1 - pan) * 2)
# rustle while moving the branch
n = int(1.0 * SR); env = np.sin(np.linspace(0, np.pi, n)) ** 2 * (0.6 + 0.4 * np.sin(np.linspace(0, 40, n)) ** 2)
s = band(n, 1500, 6000, 50) * env; place(L, s, STOP + 0.9, 0.07); place(R, s, STOP + 0.9, 0.06)
# reward chime (single bell-like tone) + airy shimmer
T0 = REWARD; n = int(5 * SR); tt = np.arange(n) / SR; bell = np.zeros(n)
for f, a, dcy in [(587.3, 1, 2.2), (880, .6, 1.8), (1174.7, .45, 1.4), (1760, .25, 1.0), (2349.3, .12, .7)]:
    bell += a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / dcy)
bell *= np.minimum(1, tt / 0.01); place(L, bell, T0, 0.05); place(R, bell, T0 + 0.012, 0.05)
n = int(6 * SR); sh = band(n, 3000, 9000, 60) * np.sin(np.linspace(0, np.pi, n)) ** 2; place(L, sh, T0 - 0.3, 0.02); place(R, sh, T0 - 0.3, 0.02)
# dawn birds
for j in range(16):
    at = T0 + 4 + rs.rand() * (DUR - T0 - 6); f0 = 2600 + rs.rand() * 1800
    for c in range(rs.randint(2, 5)):
        n = int(0.09 * SR); tt = np.arange(n) / SR; f = f0 + 900 * np.sin(np.pi * tt / 0.09) * (1 if c % 2 else -0.6)
        ch = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.09) ** 2
        p = rs.rand(); g = 0.018 + 0.02 * rs.rand(); place(L, ch, at + c * 0.13, g * p * 2); place(R, ch, at + c * 0.13, g * (1 - p) * 2)
fade = ss(0, 0.6, t) * (1 - ss(DUR - 0.8, DUR, t))
st = np.stack([L, R], 1) * fade[:, None]; st = np.tanh(st * 1.6) / 1.6
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767 * 2.2).clip(-32767, 32767).astype('<i2').tobytes())
print('wrote', out, 'steps:', len(idx))
