#!/usr/bin/env python3
"""Side-by-side contact sheet: reference video frames vs captured implementation frames.

Usage: python3 tools/compare.py [ours_dir] [out.png]
Needs ffmpeg, Pillow, numpy. Reference frames are extracted to reference/frames/.
Also reports the final lockup bands (mark / KARVON / STUDIO) for both.
"""
import glob, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'karvon intro.mp4')
REF = os.path.join(ROOT, 'reference/frames')
ours_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'reference/ours')
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'reference/compare.png')


def ref_frame(t):
    os.makedirs(REF, exist_ok=True)
    p = os.path.join(REF, f't{t:05.2f}.png')
    if not os.path.exists(p):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', VIDEO, '-frames:v', '1', p], check=True)
    return p


def bands(img):
    a = np.asarray(img.convert('RGB')).astype(int)
    lum = a.mean(2)
    d = (lum < 110)[:, 380:900]
    r = d.sum(1)
    segs, cur = [], None
    for y, v in enumerate(list(r) + [0]):
        if v > 2 and cur is None: cur = y
        if v <= 2 and cur is not None:
            if y - cur > 6:
                xs = np.nonzero(d[cur:y].sum(0))[0] + 380
                segs.append((cur, y - 1, int(xs.min()), int(xs.max())))
            cur = None
    return segs


def main():
    files = sorted(glob.glob(os.path.join(ours_dir, 't*.png')))
    if not files:
        sys.exit('no captured frames in ' + ours_dir)
    tw, th = 480, 270
    sheet = Image.new('RGB', (tw * 2 + 30, (th + 24) * len(files)), (30, 30, 30))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        t = float(re.search(r't(\d+\.\d+)', f).group(1))
        ref = Image.open(ref_frame(t)).convert('RGB')
        ours = Image.open(f).convert('RGB')
        y = i * (th + 24)
        d.text((6, y + 4), f't = {t:.2f}s   reference', fill=(240, 240, 240))
        d.text((tw + 36, y + 4), 'implementation', fill=(240, 240, 240))
        sheet.paste(ref.resize((tw, th)), (0, y + 20))
        sheet.paste(ours.resize((tw, th)), (tw + 30, y + 20))
        if t >= 9.5:
            print(f't={t}: reference bands {bands(ref)}')
            print(f't={t}: ours      bands {bands(ours)}')
        ra, oa = np.asarray(ref).astype(float), np.asarray(ours.resize(ref.size)).astype(float)
        print(f't={t:5.2f}  mean RGB ref {ra.reshape(-1,3).mean(0).round(0)}  ours {oa.reshape(-1,3).mean(0).round(0)}')
    sheet.save(out)
    print('wrote', out)


if __name__ == '__main__':
    main()
