#!/usr/bin/env python3
"""
OEP — Imagen Open Graph (1200x630) para compartir el sitio.
Versión clara editorial: fondo papel, puntos reales de expedientes
(public/data/geo/points.json) y la retícula de Chile (geo/chile.json)
con titular serif. Uso: .venv/bin/python scripts/build-og-image.py
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
POINTS = ROOT / 'public/data/geo/points.json'
OUTLINE = ROOT / 'public/data/geo/chile.json'
OUT = ROOT / 'public/og.jpg'
W, H = 1200, 630

PAPER = (250, 248, 245)
INK = (20, 23, 28)
EMERALD = (14, 159, 110)
COPPER = (194, 112, 61)
SLATE = (100, 116, 139)

LON0, LON1 = -76.5, -66.0
LAT0, LAT1 = -56.5, -17.0

FONT_SERIF_BOLD = '/System/Library/Fonts/Supplemental/Georgia Bold.ttf'
FONT_SERIF_ITALIC = '/System/Library/Fonts/Supplemental/Georgia Bold Italic.ttf'
FONT_REG = '/System/Library/Fonts/Supplemental/Arial.ttf'
FONT_MONO = '/System/Library/Fonts/Supplemental/Courier New Bold.ttf'


def project(lon, lat, box, k):
    """Misma proyección que HeroCanvas: plana con corrección coseno."""
    x0, y0, w, h = box
    s = min(w / ((LON1 - LON0) * k), h / (LAT1 - LAT0))
    ox = x0 + (w - (LON1 - LON0) * k * s) / 2
    oy = y0 + (h - (LAT1 - LAT0) * s) / 2
    return ox + (lon * k - LON0 * k) * s, oy + (LAT1 - lat) * s


def main():
    k = 0.80  # cos(-36.75°)
    img = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(img)

    # Mapa ocupando el tercio derecho
    box = (W * 0.52, 40, W * 0.44, H - 80)

    # 1) Retícula de Chile: rasteriza el outline con PIL y muestrea la grilla
    mask_w, mask_h = 440, 520
    mask = Image.new('L', (mask_w, mask_h), 0)
    md = ImageDraw.Draw(mask)
    outline = json.loads(OUTLINE.read_text())
    coords = outline['features'][0]['geometry']['coordinates']
    mbox = (4, 4, mask_w - 8, mask_h - 8)
    for poly in coords:
        for ring in poly:
            pts = [project(lon, lat, mbox, k) for lon, lat in ring]
            md.polygon(pts, fill=255)
    # Centra la máscara en el box del mapa
    mx = int(box[0] + (box[2] - mask_w) / 2)
    my = int(box[1] + (box[3] - mask_h) / 2)
    px = mask.load()
    step = 9
    for yy in range(step // 2, mask_h, step):
        for xx in range(step // 2, mask_w, step):
            if px[xx, yy] > 100:
                draw.rectangle((mx + xx, my + yy, mx + xx + 2, my + yy + 2), fill=(20, 23, 28, 36))

    # 2) Partículas por expediente
    data = json.loads(POINTS.read_text())
    for lon, lat, mmu, eg, _anio in data['points']:
        if not (LON0 <= lon <= LON1 and LAT0 <= lat <= LAT1):
            continue
        x, y = project(lon, lat, (mx, my, mask_w, mask_h), k)
        r = min(1.2 + (max(mmu, 0) ** 0.5) / 16, 4.5)
        color = EMERALD if eg == 0 else COPPER if eg in (1, 2) else (148, 163, 184)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=color)

    # 3) Veladura izquierda en papel para la tipografía
    overlay = Image.new('L', (W, 1))
    for x in range(W):
        overlay.putpixel((x, 0), int(255 * max(0.0, 1 - x / (W * 0.62))))
    img.paste(Image.new('RGB', (W, H), PAPER), (0, 0), overlay.resize((W, H)))

    draw = ImageDraw.Draw(img)
    f_eyebrow = ImageFont.truetype(FONT_MONO, 19)
    f_title = ImageFont.truetype(FONT_SERIF_BOLD, 72)
    f_title_it = ImageFont.truetype(FONT_SERIF_ITALIC, 72)
    f_sub = ImageFont.truetype(FONT_REG, 26)

    margin = 72
    y = 140
    draw.text((margin, y), 'OBSERVATORIO ECONÓMICO DE PERMISOS', font=f_eyebrow, fill=SLATE)
    y += 44
    draw.text((margin, y), '1993 – 2026 · T2', font=f_eyebrow, fill=SLATE)
    y += 68
    draw.text((margin, y), 'Tres décadas de permisos,', font=f_title, fill=INK)
    y += 88
    draw.text((margin, y), 'tiempo, inversión y empleo.', font=f_title_it, fill=EMERALD)
    y += 130
    draw.text((margin, y), '30.119 proyectos · US$ 1,05 BN declarados ante el SEIA',
              font=f_sub, fill=(51, 65, 85))
    y += 44
    draw.rectangle((margin, y, margin + 56, y + 6), fill=EMERALD)
    draw.rectangle((margin + 64, y, margin + 120, y + 6), fill=COPPER)

    img.save(OUT, quality=88)
    print(f'OK — {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
