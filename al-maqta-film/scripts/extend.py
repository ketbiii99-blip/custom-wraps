"""Extends paper_main.png past its edges with a blurred mirror so the diorama
can be framed wider than the source without visible borders."""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt

src, dst, pad = sys.argv[1], sys.argv[2], int(sys.argv[3])
a = np.asarray(Image.open(src).convert("RGB")).astype(float)
h, w, _ = a.shape
ext = np.pad(a, ((pad, pad), (pad, pad), (0, 0)), mode="reflect")
inside = np.zeros(ext.shape[:2], bool)
inside[pad:pad + h, pad:pad + w] = True
d = distance_transform_edt(~inside)
out = ext.copy()
for sigma, lo in [(10, 0), (22, 60), (40, 160), (60, 300)]:
    b = gaussian_filter(ext, (sigma, sigma, 0))
    m = np.clip((d - lo) / 60, 0, 1)[..., None]
    out = out * (1 - m) + b * m
# soften the seam itself
seam = gaussian_filter(ext, (6, 6, 0))
m = np.clip(1 - np.abs(d - 4) / 18, 0, 1)[..., None] * (d > 0)[..., None]
out = out * (1 - m) + seam * m
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst)
