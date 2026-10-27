#!/usr/bin/env python3
"""Trace the KARVON geometric K into flat polygons.

Source: the brand-kit PNG (a raster extraction; natively ~168px, upscaled to 1024).
The mark is built from straight-edged facets, so we describe it as named vertices
shared between facets, then nudge each vertex (greedy, 1px steps) to maximise
per-class pixel agreement with the PNG.

Outputs:
  src/intro/mark-geometry.js     polygon data (single source for SVG, 3D, icons)
  public/brand/karvon-mark.svg   colour mark
  public/brand/karvon-mark-mono.svg   single-colour (currentColor) mark
  reference/trace-overlay.png    diff overlay for review

Usage: python3 tools/trace-mark.py [--no-opt]
"""
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'KARVON-STUDIO-Full-Brand-Kit/02-marks/transparent-png/karvon-geometric-k-transparent-1024px.png')

# Facet classes: 1 charcoal, 2 dark slate, 3 slate
COLORS = {1: '#262B2F', 2: '#45515A', 3: '#687A86'}

# Named vertices in the 1024px image space (y down). Initial estimates from segmentation.
P = {
    'chTopL': (238, 272), 'chTopR': (405, 106), 'chBotR': (405, 491), 'chBotL': (275, 625),
    'chNotchIn': (275, 398), 'chNotchOut': (238, 432),
    'slTopR': (571, 325), 'slTopL': (405, 325),
    'wallTop': (237, 423), 'wallL': (104, 552), 'wallMid': (237, 705), 'wallBotL': (104, 990), 'wallBotR': (237, 990),
    'stTopL': (275, 717), 'stTopR': (405, 585), 'stBotL': (275, 990), 'stBotR': (405, 990),
    'armTL': (662, 323), 'armTR': (837, 325), 'crotch': (544, 623), 'armLegL': (405, 668),
    'legBR': (909, 990), 'legBL': (727, 990),
    'botTop': (405, 765), 'botMid': (533, 895), 'botR': (625, 990), 'botL': (405, 990),
    'cuTL': (689, 489), 'cuR': (917, 668), 'cuBL': (689, 728), 'cuMid': (783, 812), 'cuBR': (917, 945),
}
# Vertices that must stay locked to another's coordinate (keep edges vertical/aligned).
TIE = [  # (name, other, axis)  axis 0 = share x, 1 = share y
    ('chBotR', 'chTopR', 0), ('slTopL', 'chTopR', 0), ('stTopR', 'chTopR', 0), ('stBotR', 'chTopR', 0),
    ('armLegL', 'chTopR', 0), ('botTop', 'chTopR', 0), ('botL', 'chTopR', 0),
    ('chNotchOut', 'chTopL', 0), ('chNotchIn', 'chBotL', 0), ('stTopL', 'chBotL', 0), ('stBotL', 'chBotL', 0),
    ('wallTop', 'wallBotR', 0), ('wallMid', 'wallBotR', 0), ('wallBotL', 'wallL', 0),
    ('slTopR', 'slTopL', 1), ('armTR', 'armTL', 1),
    ('wallBotR', 'stBotL', 1), ('wallBotL', 'stBotL', 1), ('stBotR', 'stBotL', 1), ('botL', 'stBotL', 1),
    ('botR', 'stBotL', 1), ('legBR', 'stBotL', 1), ('legBL', 'stBotL', 1),
    ('cuBL', 'cuTL', 0), ('cuBR', 'cuR', 0),
]
TIED = {(k, ax) for k, _, ax in TIE}

# id, class, vertex names (clockwise in image space), role in animation
PIECES = [
    ('chimney',   1, ['chTopL', 'chTopR', 'chBotR', 'chBotL', 'chNotchIn', 'chNotchOut']),
    ('slateTop',  3, ['slTopL', 'slTopR', 'chBotR']),
    ('wallSlate', 3, ['wallL', 'wallTop', 'wallMid']),
    ('wallFace',  1, ['wallL', 'wallMid', 'wallBotR', 'wallBotL']),
    ('stem',      1, ['stTopL', 'stTopR', 'stBotR', 'stBotL']),
    ('arm',       1, ['stTopR', 'armTL', 'armTR', 'crotch', 'armLegL']),
    ('leg',       1, ['armLegL', 'crotch', 'legBR', 'legBL']),
    ('slateBot',  3, ['botTop', 'botMid', 'botL']),
    ('charBot',   1, ['botL', 'botMid', 'botR']),
    ('cubeTop',   3, ['cuTL', 'cuR', 'cuBL']),
    ('cubeMid',   2, ['cuBL', 'cuR', 'cuMid']),
    ('cubeRight', 1, ['cuMid', 'cuR', 'cuBR']),
]


def load_target():
    a = np.asarray(Image.open(SRC).convert('RGBA')).astype(int)
    A, lum = a[..., 3], a[..., :3].mean(2)
    cls = np.zeros(A.shape, np.int8)
    op = A > 160
    cls[op & (lum < 62)] = 1
    cls[op & (lum >= 62) & (lum < 98)] = 2
    cls[op & (lum >= 98) & (lum < 150)] = 3
    # ignore anti-aliased fringe pixels (partial alpha) when scoring
    care = (A > 230) | (A < 20)
    return cls, care, a


def resolve(p):
    q = dict(p)
    for _ in range(2):  # chains (a->b->c) settle in two passes
        for k, o, ax in TIE:
            v = list(q[k]); v[ax] = q[o][ax]; q[k] = tuple(v)
    return q


def render(p, shape):
    im = Image.new('L', (shape[1], shape[0]), 0)
    d = ImageDraw.Draw(im)
    for _, c, names in PIECES:
        d.polygon([p[n] for n in names], fill=int(c))
    return np.asarray(im).astype(np.int8)


def score(p, cls, care):
    r = render(resolve(p), cls.shape)
    return int(((r == cls) & care).sum())


def optimise(cls, care):
    p = dict(P)
    best = score(p, cls, care)
    free = [k for k in P]
    for rnd in range(6):
        improved = False
        for k in free:
            for ax in (0, 1):
                if (k, ax) in TIED:
                    continue
                for step in (3, 1, -1, -3):
                    v = list(p[k]); v[ax] += step
                    trial = dict(p); trial[k] = tuple(v)
                    s = score(trial, cls, care)
                    if s > best:
                        best, p, improved = s, trial, True
        print(f'  round {rnd}: score {best}')
        if not improved:
            break
    return resolve(p)


def iou(p, cls, care):
    r = render(p, cls.shape)
    sil_r, sil_t = r > 0, cls > 0
    inter = (sil_r & sil_t & care).sum(); union = ((sil_r | sil_t) & care).sum()
    per = {}
    for c in (1, 2, 3):
        a, b = (r == c), (cls == c)
        per[c] = ((a & b & care).sum() / max(1, ((a | b) & care).sum()))
    return inter / union, per


def main():
    cls, care, rgba = load_target()
    p = resolve(P) if '--no-opt' in sys.argv else optimise(cls, care)
    sil, per = iou(p, cls, care)
    print(f'silhouette IoU {sil:.4f}  per-class IoU ' + ' '.join(f'{c}:{v:.3f}' for c, v in per.items()))

    xs = [v[0] for v in p.values()]; ys = [v[1] for v in p.values()]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    w, h = x1 - x0, y1 - y0
    # normalise: width = 1000 units, origin top-left of bounding box
    s = 1000 / w
    norm = lambda v: (round((v[0] - x0) * s, 1), round((v[1] - y0) * s, 1))
    pieces = [{'id': pid, 'tone': {1: 'charcoal', 2: 'slateDark', 3: 'slate'}[c],
               'points': [norm(p[n]) for n in names]} for pid, c, names in PIECES]
    W, H = 1000, round(h * s, 1)

    os.makedirs(os.path.join(ROOT, 'src/intro'), exist_ok=True)
    with open(os.path.join(ROOT, 'src/intro/mark-geometry.js'), 'w') as f:
        f.write('// Generated by tools/trace-mark.py — reference-derived trace of the KARVON K.\n')
        f.write(f'// Silhouette IoU vs brand PNG: {sil:.4f}. Units: mark width = 1000, y down.\n')
        f.write(f'export const MARK_SIZE = {{ w: {W}, h: {H} }};\n')
        f.write('export const TONES = ' + json.dumps({'charcoal': COLORS[1], 'slateDark': COLORS[2], 'slate': COLORS[3]}) + ';\n')
        f.write('export const PIECES = ' + json.dumps(pieces, indent=1) + ';\n')

    def svg(fill_for, extra=''):
        polys = '\n'.join(
            f'  <polygon points="{" ".join(f"{x:g},{y:g}" for x, y in pc["points"])}" fill="{fill_for(pc)}"/>'
            for pc in pieces)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:g} {H:g}"{extra}>\n'
                f'  <title>KARVON</title>\n{polys}\n</svg>\n')
    tone_hex = {'charcoal': COLORS[1], 'slateDark': COLORS[2], 'slate': COLORS[3]}
    os.makedirs(os.path.join(ROOT, 'public/brand'), exist_ok=True)
    open(os.path.join(ROOT, 'public/brand/karvon-mark.svg'), 'w').write(svg(lambda pc: tone_hex[pc['tone']]))
    open(os.path.join(ROOT, 'public/brand/karvon-mark-mono.svg'), 'w').write(svg(lambda pc: 'currentColor'))

    # overlay for review: target in grey, trace outline in ochre
    os.makedirs(os.path.join(ROOT, 'reference'), exist_ok=True)
    base = Image.fromarray(rgba.astype(np.uint8)).convert('RGBA')
    bg = Image.new('RGBA', base.size, (247, 245, 240, 255)); bg.alpha_composite(base)
    d = ImageDraw.Draw(bg)
    for _, c, names in PIECES:
        d.polygon([p[n] for n in names], outline=(181, 90, 48, 255), width=2)
    bg.convert('RGB').save(os.path.join(ROOT, 'reference/trace-overlay.png'))
    print('vertices:', {k: v for k, v in p.items()})


if __name__ == '__main__':
    main()
