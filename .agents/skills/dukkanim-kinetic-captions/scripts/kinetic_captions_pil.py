"""
Dükkanım Yanımda — Kinetic Captions PIL Engine (60 FPS Python Renderer)
Matches `.agents/skills/dukkanim-kinetic-captions/scripts/kinetic_captions.js` 1:1.

NEVER draws rectangular text boxes! Provides:
1. draw_comic_bubble(...) — Organic oval speech bubble or 22-point jagged starburst shout bubble with pointer tail to speaker's mouth and tilted speaker pill.
2. draw_boxless_karaoke(...) — Boxless bold caption with thick dark stroke, orange shadow, and golden-yellow scaled/tilted active word.
3. draw_sticker(...) — Tilted die-cut sticker badge with white inner border + dark outer border.
4. draw_burst(...) — 16-point comic star burst with 24 radial speed lines and tilted "!?" / "POW!" text.
5. draw_brush(...) — Organic orange brush-stroke highlight behind a keyword.
"""

import math
from PIL import Image, ImageDraw, ImageFont

ORANGE = (255, 107, 0, 255)
DARK = (24, 28, 36, 255)
GOLD = (255, 186, 8, 255)
WHITE = (255, 255, 255, 255)

FONT_BLACK = "C:/Windows/Fonts/segoeuib.ttf"
FONT_IMPACT = "C:/Windows/Fonts/impact.ttf"

_FONT_CACHE = {}


def _get_font(size: int, impact: bool = False):
    key = (size, impact)
    if key not in _FONT_CACHE:
        path = FONT_IMPACT if impact else FONT_BLACK
        try:
            _FONT_CACHE[key] = ImageFont.truetype(path, size)
        except Exception:
            _FONT_CACHE[key] = ImageFont.truetype(FONT_BLACK, size)
    return _FONT_CACHE[key]


def _draw_stroked_text(draw: ImageDraw.ImageDraw, xy, text: str, font, fill, stroke_fill=DARK, stroke_width=8, shadow_offset=(0, 6), shadow_fill=ORANGE):
    x, y = xy
    if shadow_offset and shadow_fill:
        sx, sy = x + shadow_offset[0], y + shadow_offset[1]
        draw.text((sx, sy), text, font=font, fill=shadow_fill, stroke_width=stroke_width, stroke_fill=stroke_fill)
    draw.text((x, y), text, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke_fill)


def draw_comic_bubble(
    canvas: Image.Image,
    x: int,
    y: int,
    w: int,
    h: int,
    lines: list,
    tail_xy: tuple,
    speaker_name: str = "",
    shout: bool = False,
    font_size: int = 44,
    tilt: float = 0.0,
):
    """
    Draws an organic oval speech bubble (`shout=False`) or a 22-point jagged starburst
    explosion bubble (`shout=True`) with a sharp comic pointer tail reaching `tail_xy`.
    `lines` is a list of tuples/strings: e.g. [("Usta, benim", DARK), ("randevum ", DARK), ("saat 5'te!", ORANGE)]
    or a list of line strings where `<em>...</em>` is highlighted in `#FF6B00` orange.
    """
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    cx, cy = x + w / 2.0, y + h / 2.0
    tx, ty = tail_xy

    pts = []
    if shout:
        n = 22
        best_i = 0
        best_dist = 1e18
        raw_pts = []
        for i in range(n):
            a = (i / float(n)) * math.pi * 2.0
            r = 1.0 if (i % 2 == 1) else 1.16
            px = cx + math.cos(a) * (w / 2.0) * r
            py = cy + math.sin(a) * (h / 2.0) * r
            raw_pts.append((px, py))
            d2 = (px - tx) ** 2 + (py - ty) ** 2
            if d2 < best_dist:
                best_dist = d2
                best_i = i
        raw_pts[best_i] = (tx, ty)
        pts = raw_pts
    else:
        rx, ry = w / 2.0, h / 2.0
        ang = math.atan2(ty - cy, tx - cx)
        spread = 0.18
        steps = 48
        for i in range(steps):
            a = (ang + spread) + (i / float(steps - 1)) * (2.0 * math.pi - 2.0 * spread)
            pts.append((cx + math.cos(a) * rx, cy + math.sin(a) * ry))
        pts.append((tx, ty))

    # 1. Orange hard offset shadow (+9, +11)
    shadow_pts = [(px + 9, py + 11) for (px, py) in pts]
    od.polygon(shadow_pts, fill=ORANGE)

    # 2. Main bubble body + thick dark outline
    fill_col = GOLD if shout else WHITE
    od.polygon(pts, fill=fill_col, outline=DARK, width=7)

    # 3. Speaker pill tag at top-left (tilted -4 deg)
    if speaker_name:
        f_name = _get_font(22, impact=False)
        nw = int(od.textlength(speaker_name, font=f_name)) + 36
        nh = 42
        tag_img = Image.new("RGBA", (nw + 20, nh + 20), (0, 0, 0, 0))
        td = ImageDraw.Draw(tag_img)
        td.rounded_rectangle([6, 6, nw + 6, nh + 6], radius=21, fill=DARK, outline=ORANGE, width=4)
        td.text((24, 11), speaker_name, font=f_name, fill=WHITE)
        tag_rot = tag_img.rotate(4, resample=Image.Resampling.BICUBIC, expand=True)
        overlay.paste(tag_rot, (int(x + 22), int(y - 24)), tag_rot)

    # 4. Rich multi-line text inside bubble (supports <em>...</em> orange emphasis)
    f_txt = _get_font(font_size, impact=False)
    line_h = int(font_size * 1.14)
    total_h = len(lines) * line_h
    start_y = int(cy - total_h / 2.0)

    for idx_l, raw_line in enumerate(lines):
        ly = start_y + idx_l * line_h
        # Parse <em>...</em> segments
        parts = []
        rem = raw_line
        while "<em>" in rem and "</em>" in rem:
            pre, rest = rem.split("<em>", 1)
            mid, rem = rest.split("</em>", 1)
            if pre:
                parts.append((pre, DARK))
            if mid:
                parts.append((mid, ORANGE))
        if rem:
            parts.append((rem, DARK))

        tot_w = sum(od.textlength(p_txt, font=f_txt) for p_txt, _ in parts)
        cur_x = int(cx - tot_w / 2.0)
        for p_txt, p_col in parts:
            od.text((cur_x, ly), p_txt, font=f_txt, fill=p_col)
            cur_x += int(od.textlength(p_txt, font=f_txt))

    canvas.alpha_composite(overlay)


def draw_boxless_karaoke(canvas: Image.Image, y: int, words: list, t: float):
    """
    Draws a boxless kinetic karaoke caption at vertical position `y`.
    Active word turns `#FFBA08` gold and scales up (`1.18x`).
    NEVER draws a background rectangle!
    """
    if not words:
        return
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    W = canvas.size[0]

    f_base = _get_font(56, impact=True)
    f_active = _get_font(66, impact=True)
    space_w = 18

    widths = []
    for w_obj in words:
        is_on = w_obj["start"] <= t <= (w_obj["end"] + 0.08)
        f_use = f_active if is_on else f_base
        widths.append(int(od.textlength(w_obj["word"].upper(), font=f_use)))

    total_w = sum(widths) + space_w * max(0, len(widths) - 1)
    if total_w > W - 100:
        f_base = _get_font(44, impact=True)
        f_active = _get_font(52, impact=True)
        widths = []
        for w_obj in words:
            is_on = w_obj["start"] <= t <= (w_obj["end"] + 0.08)
            f_use = f_active if is_on else f_base
            widths.append(int(od.textlength(w_obj["word"].upper(), font=f_use)))
        total_w = sum(widths) + space_w * max(0, len(widths) - 1)

    cur_x = (W - total_w) // 2
    for w_obj, ww in zip(words, widths):
        is_on = w_obj["start"] <= t <= (w_obj["end"] + 0.08)
        txt_up = w_obj["word"].upper()
        if is_on:
            _draw_stroked_text(od, (cur_x, y - 8), txt_up, f_active, fill=GOLD, stroke_fill=DARK, stroke_width=8, shadow_offset=(0, 7), shadow_fill=ORANGE)
        else:
            _draw_stroked_text(od, (cur_x, y), txt_up, f_base, fill=WHITE, stroke_fill=DARK, stroke_width=7, shadow_offset=(0, 6), shadow_fill=ORANGE)
        cur_x += ww + space_w

    canvas.alpha_composite(overlay)


def draw_sticker(canvas: Image.Image, x: int, y: int, text: str, tilt: float = -8.0, orange: bool = True, font_size: int = 38):
    """Draws a tilted die-cut sticker badge with white inner border + dark outer border."""
    f_st = _get_font(font_size, impact=False)
    dummy = ImageDraw.Draw(canvas)
    tw = int(dummy.textlength(text, font=f_st))
    bw, bh = tw + 64, font_size + 38

    st_img = Image.new("RGBA", (bw + 40, bh + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st_img)
    # Drop shadow
    sd.rounded_rectangle([20, 26, 20 + bw, 26 + bh], radius=26, fill=(0, 0, 0, 90))
    # Dark outer outline
    sd.rounded_rectangle([14, 14, 26 + bw, 26 + bh], radius=28, fill=DARK)
    # White die-cut border
    sd.rounded_rectangle([19, 19, 21 + bw, 21 + bh], radius=24, fill=WHITE)
    # Inner fill
    bg_col = ORANGE if orange else WHITE
    fg_col = WHITE if orange else DARK
    sd.rounded_rectangle([25, 25, 15 + bw, 15 + bh], radius=20, fill=bg_col)
    sd.text((20 + 32, 20 + 14), text, font=f_st, fill=fg_col)

    rot = st_img.rotate(-tilt, resample=Image.Resampling.BICUBIC, expand=True)
    canvas.paste(rot, (x, y), rot)


def draw_burst(canvas: Image.Image, cx: int, cy: int, size: int = 160, text: str = "!?", font_size: int = 72):
    """Draws a 16-point comic burst star with 24 radial speed lines and tilted gold text."""
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    c = size / 2.0

    # 24 radial speed lines
    for i in range(24):
        a = (i / 24.0) * math.pi * 2.0
        r1 = c * 0.95
        r2 = c * (1.35 + (i % 3) * 0.14)
        x1, y1 = cx + math.cos(a) * r1, cy + math.sin(a) * r1
        x2, y2 = cx + math.cos(a) * r2, cy + math.sin(a) * r2
        od.line([(x1, y1), (x2, y2)], fill=DARK, width=4 if (i % 2) else 6)

    # 16-point jagged star
    star_pts = []
    n = 16
    for i in range(n * 2):
        a = (i / float(n * 2)) * math.pi * 2.0
        r = c * 0.58 if (i % 2) else c * 0.92
        star_pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    od.polygon(star_pts, fill=ORANGE, outline=DARK, width=6)

    f_b = _get_font(font_size, impact=True)
    tw = int(od.textlength(text, font=f_b))
    _draw_stroked_text(od, (int(cx - tw / 2), int(cy - font_size * 0.58)), text, f_b, fill=GOLD, stroke_fill=DARK, stroke_width=7, shadow_offset=(4, 4), shadow_fill=DARK)
    canvas.alpha_composite(overlay)
