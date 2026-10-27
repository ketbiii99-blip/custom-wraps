"""Procedural textures: parchment sheet, blueprint paper and film-grain tiles."""
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import zoom, gaussian_filter
import os, sys

out = sys.argv[1]
rng = np.random.default_rng(7)

def noise(h, w, scale):
    g = rng.random((h // scale + 2, w // scale + 2))
    return zoom(g, scale, order=3)[:h, :w]

def fractal(h, w, scales):
    acc = np.zeros((h, w)); tot = 0
    for s, a in scales:
        acc += noise(h, w, s) * a; tot += a
    acc /= tot
    return (acc - acc.min()) / (acc.max() - acc.min())

H, W = 1920, 1080
# Parchment
n = fractal(H, W, [(240, 1), (90, .6), (30, .35), (8, .2), (2, .12)])
fib = gaussian_filter(rng.random((H, W)), (0.6, 14))
fib = (fib - fib.mean()) / fib.std()
yy, xx = np.mgrid[0:H, 0:W]
edge = np.minimum.reduce([xx, W - xx, yy, H - yy]).astype(float)
burn = np.clip(edge / 180, 0, 1) ** 0.6
stains = fractal(H, W, [(400, 1), (150, .5)])
stain = np.clip((stains - .62) * 3, 0, 1)
base = np.array([236, 214, 168], float)
dark = np.array([150, 104, 52], float)
t = 0.18 + 0.32 * n + 0.012 * fib + 0.35 * (1 - burn) + 0.25 * stain
t = np.clip(t, 0, 1)[..., None]
img = base * (1 - t) + dark * t
img = np.clip(img + rng.normal(0, 3, img.shape), 0, 255).astype(np.uint8)
Image.fromarray(img).save(os.path.join(out, 'parchment.png'))

# Blueprint paper
n = fractal(H, W, [(300, 1), (60, .4), (6, .15)])
b0 = np.array([9, 33, 78], float); b1 = np.array([20, 58, 118], float)
r = np.sqrt((xx - W / 2) ** 2 + (yy - H * .45) ** 2) / (H * .7)
t = np.clip(0.55 * n + 0.6 * (1 - r), 0, 1)[..., None]
img = b0 * (1 - t) + b1 * t
img = np.clip(img + rng.normal(0, 2.5, img.shape), 0, 255).astype(np.uint8)
Image.fromarray(img).save(os.path.join(out, 'blueprint_paper.png'))

# Grain tiles (mid-grey based, for overlay blending)
for i in range(8):
    g = rng.normal(128, 38, (540, 540))
    g = gaussian_filter(g, 0.55)
    Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), 'L').save(os.path.join(out, f'grain_{i}.png'))
print('ok')
