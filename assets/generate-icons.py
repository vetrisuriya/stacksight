#!/usr/bin/env python3
"""
StackSight – generate-icons.py
Generates all image assets using only Python 3 stdlib (struct + zlib).

Outputs:
  icon16.png   icon48.png   icon128.png   — Extension icons
  promo440.png             (440×280)      — Chrome Web Store small promo tile
  promo1400.png            (1400×560)     — Chrome Web Store marquee promo tile

Run from project root:
    python3 assets/generate-icons.py
"""

import zlib
import struct
import os

# ── Colour palette ───────────────────────────────────────────────────────────
BG_DARK    = (15,  23,  42)    # #0F172A  slate-900
BG_MID     = (30,  41,  59)    # #1E293B  slate-800
ACCENT     = (99, 102, 241)    # #6366F1  indigo-500
ACCENT_LT  = (129, 140, 248)   # #818CF8  indigo-400
WHITE      = (255, 255, 255)
MUTED      = (148, 163, 184)   # #94A3B8  slate-400
GREEN      = ( 34, 197,  94)   # #22C55E
YELLOW     = (245, 158,  11)   # #F59E0B
RED        = (239,  68,  68)   # #EF4444


# ── PNG writer ───────────────────────────────────────────────────────────────

def _png_chunk(name: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(name + data) & 0xFFFFFFFF
    return struct.pack('>I', len(data)) + name + data + struct.pack('>I', crc)


def write_png(pixels: list, width: int, height: int, path: str) -> None:
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    raw  = b''
    for row in range(height):
        raw += b'\x00'
        for col in range(width):
            r, g, b = pixels[row * width + col]
            raw += bytes([r, g, b])
    idat = zlib.compress(raw, level=9)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(_png_chunk(b'IHDR', ihdr))
        f.write(_png_chunk(b'IDAT', idat))
        f.write(_png_chunk(b'IEND', b''))


# ── Drawing primitives ───────────────────────────────────────────────────────

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_c(a, b, t):
    return tuple(int(lerp(a[i], b[i], t)) for i in range(3))

def dist2(x1, y1, x2, y2):
    return ((x1-x2)**2 + (y1-y2)**2) ** 0.5

def blend(base, overlay, alpha):
    return tuple(int(base[i]*(1-alpha) + overlay[i]*alpha) for i in range(3))

def in_rounded_square_sdf(x, y, cx, cy, half, r):
    qx = abs(x - cx) - (half - r)
    qy = abs(y - cy) - (half - r)
    return (max(qx,0)**2 + max(qy,0)**2)**0.5 + min(max(qx,qy), 0) - r


# ── S-glyph sampler ──────────────────────────────────────────────────────────

def sample_s(nx, ny):
    """
    Returns 0.0–1.0 opacity for the letter S in normalised [-1,1] space.
    Composed of two arcs + a centre connector.
    """
    sw = 0.18

    # Top arc
    top_cx, top_cy, top_r = 0.05, -0.42, 0.35
    top_d  = abs(dist2(nx, ny, top_cx, top_cy) - top_r)
    in_top = (top_d < sw) and (ny < -0.10) and not (nx > 0.22 and ny < -0.55)

    # Bottom arc
    bot_cx, bot_cy, bot_r = -0.05, 0.42, 0.35
    bot_d  = abs(dist2(nx, ny, bot_cx, bot_cy) - bot_r)
    in_bot = (bot_d < sw) and (ny > 0.10) and not (nx < -0.22 and ny > 0.55)

    # Centre diagonal
    lx1, ly1, lx2, ly2 = -0.30, -0.08, 0.30, 0.08
    ldx, ldy = lx2-lx1, ly2-ly1
    t   = max(0.0, min(1.0, ((nx-lx1)*ldx + (ny-ly1)*ldy) / (ldx**2+ldy**2)))
    ctr_d  = dist2(nx, ny, lx1+t*ldx, ly1+t*ldy)
    in_ctr = ctr_d < sw * 0.9

    if in_top or in_bot or in_ctr:
        md = min(
            top_d if in_top else 99,
            bot_d if in_bot else 99,
            ctr_d if in_ctr else 99,
        )
        return max(0.0, 1.0 - md / sw)
    return 0.0


# ── Icon renderer ─────────────────────────────────────────────────────────────

def draw_icon(size: int) -> list:
    pixels = []
    cx = cy = size / 2
    half   = size * 0.42
    corner = size * 0.18

    for row in range(size):
        for col in range(size):
            x, y = col + 0.5, row + 0.5

            sdf = in_rounded_square_sdf(x, y, cx, cy, half, corner)
            if sdf < 0:
                t  = (row / size) * 0.6
                bg = lerp_c(ACCENT, BG_MID, t)
            elif sdf < 1.2:
                t  = (row / size) * 0.6
                aa = sdf / 1.2
                bg = lerp_c(lerp_c(ACCENT, BG_MID, t), BG_DARK, aa)
            else:
                pixels.append(BG_DARK)
                continue

            nx = (x - cx) / (size * 0.38)
            ny = (y - cy) / (size * 0.38)
            strength = sample_s(nx, ny)
            if strength > 0:
                pixels.append(blend(bg, WHITE, strength))
            else:
                pixels.append(bg)

    return pixels


# ── Promo tile renderer ───────────────────────────────────────────────────────

def draw_promo(w: int, h: int) -> list:
    """
    Renders a dark promo tile with:
    - Radial indigo glow top-left
    - Extension icon (large) left side
    - Text right side (simulated as coloured blocks)
    """
    pixels = []
    for row in range(h):
        for col in range(w):
            x, y = col + 0.5, row + 0.5

            # Background gradient
            t  = row / h
            bg = lerp_c(BG_DARK, BG_MID, t * 0.5)

            # Radial glow top-left
            gd = dist2(x, y, w * 0.28, h * 0.42) / (w * 0.55)
            if gd < 1.0:
                glow_strength = max(0, (1 - gd) ** 2) * 0.22
                bg = blend(bg, ACCENT, glow_strength)

            # ── Icon box ────────────────────────────────────────────────────
            icon_size  = int(h * 0.52)
            icon_cx    = int(w * 0.18)
            icon_cy    = int(h * 0.5)
            icon_half  = icon_size * 0.42
            icon_r     = icon_size * 0.18

            sdf = in_rounded_square_sdf(x, y, icon_cx, icon_cy, icon_half, icon_r)
            if sdf < 0:
                it  = ((y - (icon_cy - icon_size/2)) / icon_size) * 0.6
                bg2 = lerp_c(ACCENT, BG_MID, it)
                nx  = (x - icon_cx) / (icon_size * 0.38)
                ny  = (y - icon_cy) / (icon_size * 0.38)
                st  = sample_s(nx, ny)
                if st > 0:
                    pixels.append(blend(bg2, WHITE, st))
                else:
                    pixels.append(bg2)
                continue
            elif sdf < 2.0:
                pixels.append(bg)
                continue

            # ── Text blocks (simulated) ─────────────────────────────────────
            tx_left = int(w * 0.36)

            # Title bar: "StackSight"
            title_y1 = int(h * 0.22)
            title_y2 = int(h * 0.42)
            title_x2 = int(w * 0.88)
            if tx_left <= x <= title_x2 and title_y1 <= y <= title_y2:
                bar_t  = (x - tx_left) / (title_x2 - tx_left)
                bar_bk = lerp_c(WHITE, ACCENT_LT, bar_t * 0.3)
                pixels.append(bar_bk)
                continue

            # Subtitle bar 1
            sub1_y1 = int(h * 0.50)
            sub1_y2 = int(h * 0.63)
            sub1_x2 = int(w * 0.82)
            if tx_left <= x <= sub1_x2 and sub1_y1 <= y <= sub1_y2:
                pixels.append(MUTED)
                continue

            # Subtitle bar 2 (shorter)
            sub2_y1 = int(h * 0.67)
            sub2_y2 = int(h * 0.78)
            sub2_x2 = int(w * 0.70)
            if tx_left <= x <= sub2_x2 and sub2_y1 <= y <= sub2_y2:
                pixels.append(MUTED)
                continue

            # Accent dots row
            dot_y = int(h * 0.85)
            dot_r = int(h * 0.04)
            dot_xs = [
                int(w * 0.38),
                int(w * 0.48),
                int(w * 0.58),
                int(w * 0.68),
                int(w * 0.78),
            ]
            dot_colors = [GREEN, ACCENT_LT, YELLOW, ACCENT, RED]
            drew_dot = False
            for i, (dx, dc) in enumerate(zip(dot_xs, dot_colors)):
                if dist2(x, y, dx, dot_y) < dot_r:
                    pixels.append(dc)
                    drew_dot = True
                    break
            if drew_dot:
                continue

            pixels.append(bg)

    return pixels


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))

    jobs = [
        (16,   16,   'icon',  f'icon16.png'),
        (48,   48,   'icon',  f'icon48.png'),
        (128,  128,  'icon',  f'icon128.png'),
        (440,  280,  'promo', f'promo440.png'),
        (1400, 560,  'promo', f'promo1400.png'),
    ]

    for w, h, kind, name in jobs:
        if kind == 'icon':
            pixels = draw_icon(w)
        else:
            pixels = draw_promo(w, h)
        path = os.path.join(out_dir, name)
        write_png(pixels, w, h, path)
        print(f'✓  {name:20s} ({w}×{h}) → {path}')

    print('\nAll assets generated successfully.')
    print('\nFor the Chrome Web Store you need:')
    print('  • icon128.png   — Store icon (128×128)')
    print('  • promo440.png  — Small promotional tile (440×280)')
    print('  • promo1400.png — Marquee promotional tile (1400×560)  [optional]')
    print('  • 1–5 screenshots at 1280×800 or 640×400 (take manually from Chrome)')


if __name__ == '__main__':
    main()
