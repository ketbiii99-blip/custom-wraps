"""Sound effects bed for the minimal format (no instruments): soft whooshes, one low thud, airy shimmer.
usage: python3 engine/sfx_minimal.py out.wav <duration> <whoosh times,comma> <thud times,comma> <shimmer time>"""
import sys, wave, numpy as np
out, DUR = sys.argv[1], float(sys.argv[2]); WH = [float(x) for x in sys.argv[3].split(',')]; THUDS = [float(x) for x in sys.argv[4].split(',')]; SHIM = float(sys.argv[5])
SR = 44100; N = int(DUR * SR); L = np.zeros(N); R = np.zeros(N)
def band(n, lo, hi, seed):
    x = np.random.RandomState(seed).randn(n); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X *= np.exp(-0.5 * (np.log((f + 1) / np.sqrt(lo * hi)) / (np.log(hi / lo) / 2.2)) ** 2); y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def place(buf, sig, at, gain):
    i = int(max(0, at) * SR)
    if i >= len(buf): return
    sig = sig[: len(buf) - i]; buf[i:i + len(sig)] += sig * gain
for j, w in enumerate(WH):
    n = int(0.5 * SR); s = band(n, 400, 4000, 30 + j) * np.sin(np.linspace(0, np.pi, n)) ** 3
    place(L, s, w - 0.3, 0.07); place(R, s, w - 0.26, 0.07)
n = int(0.7 * SR); tt = np.arange(n) / SR
thud = np.sin(2 * np.pi * (70 * tt + 60 * (1 - np.exp(-tt * 18)) / 18)) * np.exp(-tt / 0.16) + band(n, 60, 300, 9) * np.exp(-tt / 0.06) * 0.5
for THUD in THUDS: place(L, thud, THUD, 0.3); place(R, thud, THUD, 0.3)
n = int(5.5 * SR); sh = band(n, 3500, 10000, 60) * np.sin(np.linspace(0, np.pi, n)) ** 2
place(L, sh, SHIM, 0.022); place(R, sh, SHIM + 0.02, 0.022)
st = np.stack([L, R], 1)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.tanh(st * 1.4) / 1.4 * 32767 * 2.0).clip(-32767, 32767).astype('<i2').tobytes())
