"""
Dükkanım Yanımda — Code-Driven 2D Articulated Vector Puppet Engine ("Usta" & Customer)
======================================================================================
100% programmatic vector character renderer with Forward Kinematics (FK) joints,
2x supersampled Lanczos anti-aliasing, audio-synced lip-sync mouth, natural blinking,
eyebrow expressions, and articulated props:
  - Opening & closing Barber Scissors ("makas açıp kapatma") + flying hair snippets
  - Barber Comb in left hand
  - Buzzing Cordless Hair Clipper
  - Ringing Smartphone & "Slide Phone into Apron Pocket" animation
  - Dükkanım Yanımda Live Tablet showcase & waving/pointing gestures
  - Walking cycle & Customer in Barber Chair rig
"""

import math
from PIL import Image, ImageDraw

# Official Brand & Character Palette
ORANGE = (255, 107, 0, 255)
ORANGE_DEEP = (224, 85, 0, 255)
ORANGE_DARK = (184, 67, 0, 255)
ORANGE_LIGHT = (255, 154, 77, 255)
NAVY_SHIRT = (30, 46, 74, 255)
NAVY_DARK = (21, 33, 54, 255)
NAVY_CUFF = (42, 64, 102, 255)
CHARCOAL_PANTS = (44, 51, 62, 255)
BOOT_BROWN = (110, 59, 30, 255)
STRAP_BROWN = (140, 74, 39, 255)
SKIN = (244, 194, 159, 255)
SKIN_SHADOW = (229, 172, 131, 255)
HAIR_DARK = (42, 48, 60, 255)
BEARD_DARK = (37, 43, 54, 255)
SILVER_STREAK = (148, 163, 184, 255)
OUTLINE = (24, 28, 36, 255)
WHITE = (255, 255, 255, 255)
STEEL_LIGHT = (241, 245, 249, 255)
STEEL_MID = (148, 163, 184, 255)
STEEL_DARK = (71, 85, 105, 255)
GREEN = (34, 197, 94, 255)
GOLD = (255, 186, 8, 255)
RED_MOUTH = (74, 21, 27, 255)
TONGUE_PINK = (224, 90, 90, 255)


def _rot_pt(x, y, cx, cy, deg):
    rad = math.radians(deg)
    ca, sa = math.cos(rad), math.sin(rad)
    dx, dy = x - cx, y - cy
    return (cx + dx * ca - dy * sa, cy + dx * sa + dy * ca)


def _draw_capsule(draw, p1, p2, r, fill, outline=OUTLINE, width=7):
    """Draws a rounded limb segment (capsule) between p1 and p2."""
    x1, y1 = p1
    x2, y2 = p2
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy)
    if length < 1e-3:
        draw.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=fill, outline=outline, width=width)
        return
    ux, uy = dx / length, dy / length
    nx, ny = -uy * r, ux * r

    poly = [
        (x1 + nx, y1 + ny),
        (x2 + nx, y2 + ny),
        (x2 - nx, y2 - ny),
        (x1 - nx, y1 - ny),
    ]
    draw.polygon(poly, fill=fill)
    draw.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=fill, outline=outline, width=width)
    draw.ellipse([x2 - r, y2 - r, x2 + r, y2 + r], fill=fill, outline=outline, width=width)
    r_in = max(1, r - width)
    nx_i, ny_i = -uy * r_in, ux * r_in
    poly_in = [
        (x1 + nx_i, y1 + ny_i),
        (x2 + nx_i, y2 + ny_i),
        (x2 - nx_i, y2 - ny_i),
        (x1 - nx_i, y1 - ny_i),
    ]
    draw.polygon(poly_in, fill=fill)
    draw.ellipse([x1 - r_in, y1 - r_in, x1 + r_in, y1 + r_in], fill=fill)
    draw.ellipse([x2 - r_in, y2 - r_in, x2 + r_in, y2 + r_in], fill=fill)
    draw.line([(x1 + nx, y1 + ny), (x2 + nx, y2 + ny)], fill=outline, width=width)
    draw.line([(x1 - nx, y1 - ny), (x2 - nx, y2 - ny)], fill=outline, width=width)


def _draw_scissors(draw, wrist_pt, base_angle_deg, open_angle_deg, scale=1.0):
    """
    Draws articulated Barber Scissors at wrist_pt with two independent blades
    that pivot open and closed by `open_angle_deg` ("makas açıp kapatma").
    """
    wx, wy = wrist_pt
    px, py = _rot_pt(wx + 44 * scale, wy, wx, wy, base_angle_deg)

    b1_ang = base_angle_deg + open_angle_deg * 0.5
    b1_tip = _rot_pt(px + 128 * scale, py, px, py, b1_ang)
    b1_top = _rot_pt(px + 18 * scale, py - 10 * scale, px, py, b1_ang)
    b1_bot = _rot_pt(px + 18 * scale, py + 8 * scale, px, py, b1_ang)
    b1_handle = _rot_pt(px - 40 * scale, py + 16 * scale, px, py, b1_ang)

    b2_ang = base_angle_deg - open_angle_deg * 0.5
    b2_tip = _rot_pt(px + 128 * scale, py, px, py, b2_ang)
    b2_top = _rot_pt(px + 18 * scale, py - 8 * scale, px, py, b2_ang)
    b2_bot = _rot_pt(px + 18 * scale, py + 10 * scale, px, py, b2_ang)
    b2_handle = _rot_pt(px - 40 * scale, py - 16 * scale, px, py, b2_ang)

    draw.line([b1_handle, (px, py)], fill=STEEL_DARK, width=int(11 * scale))
    draw.line([b2_handle, (px, py)], fill=STEEL_DARK, width=int(11 * scale))

    r_ring = int(18 * scale)
    for hx, hy in [b1_handle, b2_handle]:
        draw.ellipse(
            [hx - r_ring, hy - r_ring, hx + r_ring, hy + r_ring],
            fill=(0, 0, 0, 0),
            outline=OUTLINE,
            width=int(9 * scale),
        )
        draw.ellipse(
            [hx - r_ring + 3, hy - r_ring + 3, hx + r_ring - 3, hy + r_ring - 3],
            fill=(0, 0, 0, 0),
            outline=STEEL_MID,
            width=int(4 * scale),
        )

    for tip, p_a, p_b in [(b1_tip, b1_top, b1_bot), (b2_tip, b2_top, b2_bot)]:
        poly = [(px, py), p_a, tip, p_b]
        draw.polygon(poly, fill=STEEL_LIGHT, outline=OUTLINE, width=int(5 * scale))
        draw.line([(px, py), tip], fill=WHITE, width=int(3 * scale))

    r_piv = int(8 * scale)
    draw.ellipse([px - r_piv, py - r_piv, px + r_piv, py + r_piv], fill=ORANGE, outline=OUTLINE, width=int(4 * scale))

    return px, py, b1_tip, b2_tip


def _draw_comb(draw, wrist_pt, angle_deg, scale=1.0):
    """Draws an orange craftsman barber comb in the hand."""
    wx, wy = wrist_pt
    spine_len = 115 * scale
    spine_h = 18 * scale
    p1 = _rot_pt(wx - 18 * scale, wy - spine_h / 2, wx, wy, angle_deg)
    p2 = _rot_pt(wx + spine_len, wy - spine_h / 2, wx, wy, angle_deg)
    p3 = _rot_pt(wx + spine_len, wy + spine_h / 2, wx, wy, angle_deg)
    p4 = _rot_pt(wx - 18 * scale, wy + spine_h / 2, wx, wy, angle_deg)
    draw.polygon([p1, p2, p3, p4], fill=ORANGE, outline=OUTLINE, width=int(5 * scale))

    for i in range(9):
        tx = wx - 4 * scale + i * (12.0 * scale)
        t_start = _rot_pt(tx, wy + spine_h / 2, wx, wy, angle_deg)
        t_end = _rot_pt(tx, wy + spine_h / 2 + 24 * scale, wx, wy, angle_deg)
        draw.line([t_start, t_end], fill=OUTLINE, width=int(4 * scale))


def _draw_clipper(draw, wrist_pt, angle_deg, t=0.0, scale=1.0):
    """Draws a buzzing cordless electric hair clipper."""
    wx, wy = wrist_pt
    vib_x = 3.0 * math.sin(t * 95.0) * scale
    vib_y = 3.0 * math.cos(t * 95.0) * scale
    cx, cy = wx + vib_x, wy + vib_y

    bw, bh = 48 * scale, 108 * scale
    pts_body = [
        _rot_pt(cx - bw / 2, cy - bh * 0.65, cx, cy, angle_deg),
        _rot_pt(cx + bw / 2, cy - bh * 0.65, cx, cy, angle_deg),
        _rot_pt(cx + bw * 0.42, cy + bh * 0.35, cx, cy, angle_deg),
        _rot_pt(cx - bw * 0.42, cy + bh * 0.35, cx, cy, angle_deg),
    ]
    draw.polygon(pts_body, fill=OUTLINE, outline=WHITE, width=int(4 * scale))

    pts_grip = [
        _rot_pt(cx - bw * 0.3, cy - bh * 0.4, cx, cy, angle_deg),
        _rot_pt(cx + bw * 0.3, cy - bh * 0.4, cx, cy, angle_deg),
        _rot_pt(cx + bw * 0.26, cy + bh * 0.15, cx, cy, angle_deg),
        _rot_pt(cx - bw * 0.26, cy + bh * 0.15, cx, cy, angle_deg),
    ]
    draw.polygon(pts_grip, fill=ORANGE)

    pts_head = [
        _rot_pt(cx - bw * 0.46, cy - bh * 0.85, cx, cy, angle_deg),
        _rot_pt(cx + bw * 0.46, cy - bh * 0.85, cx, cy, angle_deg),
        _rot_pt(cx + bw * 0.46, cy - bh * 0.65, cx, cy, angle_deg),
        _rot_pt(cx - bw * 0.46, cy - bh * 0.65, cx, cy, angle_deg),
    ]
    draw.polygon(pts_head, fill=STEEL_LIGHT, outline=OUTLINE, width=int(4 * scale))

    tip_pt = _rot_pt(cx, cy - bh * 0.85, cx, cy, angle_deg)
    return tip_pt


def _draw_phone_in_hand(draw, wrist_pt, angle_deg, ringing=True, t=0.0, scale=1.0):
    """Draws a smartphone in hand with side finger grip and optional ringing waves."""
    wx, wy = wrist_pt
    vib = (3.5 * math.sin(t * 55.0) * scale) if ringing else 0.0
    cx, cy = wx + vib, wy - 18 * scale

    pw, ph = 72 * scale, 128 * scale
    corners = [
        _rot_pt(cx - pw / 2, cy - ph / 2, cx, cy, angle_deg),
        _rot_pt(cx + pw / 2, cy - ph / 2, cx, cy, angle_deg),
        _rot_pt(cx + pw / 2, cy + ph / 2, cx, cy, angle_deg),
        _rot_pt(cx - pw / 2, cy + ph / 2, cx, cy, angle_deg),
    ]
    draw.polygon(corners, fill=OUTLINE, outline=ORANGE, width=int(5 * scale))

    in_w, in_h = pw - 12 * scale, ph - 18 * scale
    scr_corners = [
        _rot_pt(cx - in_w / 2, cy - in_h / 2, cx, cy, angle_deg),
        _rot_pt(cx + in_w / 2, cy - in_h / 2, cx, cy, angle_deg),
        _rot_pt(cx + in_w / 2, cy + in_h / 2, cx, cy, angle_deg),
        _rot_pt(cx - in_w / 2, cy + in_h / 2, cx, cy, angle_deg),
    ]
    draw.polygon(scr_corners, fill=WHITE)

    # Caller avatar & accept/decline dots on phone screen (never covered by palm!)
    draw.ellipse([cx - 14 * scale, cy - 28 * scale, cx + 14 * scale, cy], fill=ORANGE)
    draw.ellipse([cx - 18 * scale, cy + 16 * scale, cx - 4 * scale, cy + 30 * scale], fill=(239, 68, 68, 255))
    draw.ellipse([cx + 4 * scale, cy + 16 * scale, cx + 18 * scale, cy + 30 * scale], fill=GREEN)

    # Finger grip on outer edge of phone
    for fy_off in [-18, 0, 18]:
        fx, fy = _rot_pt(cx + pw * 0.48, cy + fy_off * scale, cx, cy, angle_deg)
        draw.ellipse([fx - 9 * scale, fy - 7 * scale, fx + 9 * scale, fy + 7 * scale], fill=SKIN, outline=OUTLINE, width=int(4 * scale))

    if ringing:
        for i in range(2):
            r_wave = int((52 + i * 20 + (t * 40) % 14) * scale)
            draw.arc(
                [cx - r_wave, cy - r_wave, cx + r_wave, cy + r_wave],
                start=205,
                end=335,
                fill=ORANGE,
                width=int(5 * scale),
            )


def _draw_tablet_in_hand(draw, wrist_pt, scale=1.0):
    """Draws the Dükkanım Yanımda Live Dashboard Tablet held cleanly in Usta's hand."""
    wx, wy = wrist_pt
    tw, th = int(172 * scale), int(224 * scale)
    tx, ty = int(wx - tw * 0.58), int(wy - th * 0.68)

    draw.rounded_rectangle([tx, ty, tx + tw, ty + th], radius=int(22 * scale), fill=OUTLINE, outline=ORANGE, width=int(6 * scale))
    pad = int(12 * scale)
    sx1, sy1, sx2, sy2 = tx + pad, ty + pad, tx + tw - pad, ty + th - pad
    draw.rounded_rectangle([sx1, sy1, sx2, sy2], radius=int(12 * scale), fill=WHITE)

    # Top Orange Brand Header Bar + Dükkanım Yanımda Logo
    import os
    draw.rounded_rectangle([sx1, sy1, sx2, sy1 + int(42 * scale)], radius=int(10 * scale), fill=ORANGE)
    draw.ellipse([sx1 + int(8 * scale), sy1 + int(5 * scale), sx1 + int(38 * scale), sy1 + int(35 * scale)], fill=WHITE)
    logo_p = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), "dist", "brand", "logo-icon.png")
    if os.path.exists(logo_p) and hasattr(draw, "_image"):
        try:
            lg_t = Image.open(logo_p).convert("RGBA").resize((int(26 * scale), int(26 * scale)), Image.Resampling.LANCZOS)
            draw._image.paste(lg_t, (sx1 + int(10 * scale), sy1 + int(7 * scale)), lg_t)
        except Exception:
            pass
    draw.rounded_rectangle([sx1 + int(44 * scale), sy1 + int(14 * scale), sx2 - int(12 * scale), sy1 + int(26 * scale)], radius=int(4 * scale), fill=WHITE)

    # Metric Pills
    my = sy1 + int(54 * scale)
    mw = (sx2 - sx1 - int(18 * scale)) // 2
    draw.rounded_rectangle([sx1 + int(4 * scale), my, sx1 + int(4 * scale) + mw, my + int(34 * scale)], radius=int(7 * scale), fill=(255, 243, 235, 255), outline=ORANGE, width=int(3 * scale))
    draw.rounded_rectangle([sx1 + int(14 * scale) + mw, my, sx2 - int(4 * scale), my + int(34 * scale)], radius=int(7 * scale), fill=(240, 253, 244, 255), outline=GREEN, width=int(3 * scale))

    # Animated Bar Chart on Tablet
    heights = [0.42, 0.62, 0.54, 0.84, 1.0]
    cols = [ORANGE, ORANGE, ORANGE_LIGHT, GOLD, GREEN]
    bx = sx1 + int(10 * scale)
    bw = int(20 * scale)
    max_bh = int(80 * scale)
    base_by = sy2 - int(14 * scale)
    for h_rat, c_bar in zip(heights, cols):
        bh = int(max_bh * h_rat)
        draw.rounded_rectangle([bx, base_by - bh, bx + bw, base_by], radius=int(4 * scale), fill=c_bar)
        bx += bw + int(8 * scale)

    # Sculpted fingers gripping the right bezel of the tablet
    for fy_off in [-30, -8, 14, 36]:
        fx, fy = tx + tw - 2, ty + th // 2 + int(fy_off * scale)
        draw.ellipse([fx - int(11 * scale), fy - int(8 * scale), fx + int(11 * scale), fy + int(8 * scale)], fill=SKIN, outline=OUTLINE, width=int(4 * scale))


def render_usta_rig_frame(
    width=700,
    height=900,
    t=0.0,
    pose="scissors_cut",
    emotion="happy",
    mouth_open=0.0,
    show_customer=None,
    pocket_phone=False,
):
    """
    Renders a single 60 FPS anti-aliased RGBA frame of our Code-Driven Animated Usta Character.
    All coordinates are proportioned so every pose and prop stays 100% inside the canvas!
    """
    if show_customer is None:
        show_customer = pose in ("scissors_cut", "clipper_cut")

    SS = 2
    W, H = width * SS, height * SS
    # Use a fixed internal reference coordinate space (1400 x 1800) and scale cleanly
    REF_W, REF_H = 1400, 1800
    canvas = Image.new("RGBA", (REF_W, REF_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    cx = REF_W // 2
    breath = math.sin(t * 2.8) * 5.0
    walk_phase = t * 7.5 if pose == "walk_happy" else 0.0
    bob_y = abs(math.sin(walk_phase)) * 12.0 if pose == "walk_happy" else breath

    # =========================================================================
    # 1. FLOOR SHADOW & LEGS / BOOTS (HEROIC CRAFTSMAN PROPORTIONS)
    # =========================================================================
    shadow_y = 1480
    d.ellipse([cx - 210, shadow_y - 24, cx + 210, shadow_y + 24], fill=(15, 23, 42, 38))

    hip_l = (cx - 74, int(1080 + bob_y))
    hip_r = (cx + 74, int(1080 + bob_y))

    leg_swing = math.sin(walk_phase) * 26.0 if pose == "walk_happy" else 0.0
    ankle_l = (int(hip_l[0] - leg_swing), shadow_y - 40 - int(max(0, math.cos(walk_phase)) * 16 if pose == "walk_happy" else 0))
    ankle_r = (int(hip_r[0] + leg_swing), shadow_y - 40 - int(max(0, -math.cos(walk_phase)) * 16 if pose == "walk_happy" else 0))

    _draw_capsule(d, hip_l, ankle_l, 42, CHARCOAL_PANTS, OUTLINE, width=8)
    _draw_capsule(d, hip_r, ankle_r, 42, CHARCOAL_PANTS, OUTLINE, width=8)

    for ax, ay, dir_sign in [(ankle_l[0], ankle_l[1], -1), (ankle_r[0], ankle_r[1], 1)]:
        d.rounded_rectangle([ax - 50, ay - 20, ax + 50, ay + 6], radius=10, fill=(59, 68, 84, 255), outline=OUTLINE, width=7)
        bx1 = ax - 66 if dir_sign < 0 else ax - 44
        bx2 = ax + 44 if dir_sign < 0 else ax + 66
        d.rounded_rectangle([bx1, ay + 4, bx2, ay + 44], radius=16, fill=BOOT_BROWN, outline=OUTLINE, width=8)
        d.line([bx1 + 6, ay + 36, bx2 - 6, ay + 36], fill=OUTLINE, width=6)

    # =========================================================================
    # 2. TORSO & SIGNATURE ORANGE CRAFTSMAN APRON
    # =========================================================================
    torso_top = int(610 + bob_y)
    torso_bot = int(1110 + bob_y)
    torso_w = 316

    d.rounded_rectangle(
        [cx - torso_w // 2, torso_top, cx + torso_w // 2, torso_bot],
        radius=66,
        fill=NAVY_SHIRT,
        outline=OUTLINE,
        width=8,
    )

    # Shirt Collar Flaps
    d.polygon([(cx - 60, torso_top - 4), (cx, torso_top + 44), (cx - 30, torso_top + 64), (cx - 88, torso_top + 14)], fill=NAVY_CUFF, outline=OUTLINE, width=7)
    d.polygon([(cx + 60, torso_top - 4), (cx, torso_top + 44), (cx + 30, torso_top + 64), (cx + 88, torso_top + 14)], fill=NAVY_CUFF, outline=OUTLINE, width=7)

    # Leather Apron Straps & Silver Buckles
    for sx in [cx - 98, cx + 68]:
        d.rounded_rectangle([sx, torso_top + 2, sx + 30, torso_top + 96], radius=9, fill=STRAP_BROWN, outline=OUTLINE, width=7)
        d.ellipse([sx + 4, torso_top + 70, sx + 26, torso_top + 92], fill=STEEL_LIGHT, outline=OUTLINE, width=6)

    # Orange Apron Main Bib & Skirt
    apron_top = torso_top + 72
    apron_bot = int(1215 + bob_y)
    apron_poly = [
        (cx - 124, apron_top),
        (cx + 124, apron_top),
        (cx + 148, apron_bot),
        (cx - 148, apron_bot),
    ]
    d.polygon(apron_poly, fill=ORANGE, outline=OUTLINE, width=8)

    # Apron Chest Shield Pocket & Brand Pin
    cp_y = apron_top + 38
    d.polygon(
        [(cx - 56, cp_y), (cx + 56, cp_y), (cx + 56, cp_y + 74), (cx, cp_y + 94), (cx - 56, cp_y + 74)],
        fill=ORANGE_DEEP,
        outline=OUTLINE,
        width=6,
    )
    d.rounded_rectangle([cx + 66, apron_top + 18, cx + 96, apron_top + 48], radius=7, fill=WHITE, outline=OUTLINE, width=5)
    d.ellipse([cx + 75, apron_top + 27, cx + 87, apron_top + 39], fill=ORANGE)

    # Phone Peeking Inside Apron Lower Pocket
    pock_y = apron_top + 195
    show_pock_phone = pocket_phone or (pose == "phone_to_pocket" and t > 0.45)
    if show_pock_phone:
        slide_in = min(1.0, max(0.0, (t - 0.40) / 0.25)) if pose == "phone_to_pocket" else 1.0
        py_off = int((1.0 - slide_in) * -40)
        d.rounded_rectangle([cx + 14, pock_y - 40 + py_off, cx + 84, pock_y + 38], radius=12, fill=OUTLINE, outline=GOLD, width=6)
        d.rounded_rectangle([cx + 22, pock_y - 30 + py_off, cx + 76, pock_y + 12], radius=5, fill=GREEN)

    # Apron Lower Divided Tool Pocket
    d.rounded_rectangle([cx - 98, pock_y, cx + 98, pock_y + 112], radius=20, fill=ORANGE_DARK, outline=OUTLINE, width=7)
    d.line([cx, pock_y, cx, pock_y + 112], fill=OUTLINE, width=7)

    # =========================================================================
    # 3. HEAD, SEAMLESS SCULPTED SALT-AND-PEPPER HAIR, BEARD & FACE
    # =========================================================================
    neck_y = torso_top - 18
    d.rounded_rectangle([cx - 34, neck_y - 38, cx + 34, neck_y + 28], radius=18, fill=SKIN_SHADOW, outline=OUTLINE, width=7)

    head_tilt_deg = 0.0
    if pose in ("scissors_cut", "clipper_cut"):
        head_tilt_deg = 2.8 * math.sin(t * 3.2)
    elif pose == "phone_dilemma" or emotion == "thinking":
        head_tilt_deg = -5.5 + 1.8 * math.sin(t * 2.5)
    else:
        head_tilt_deg = 1.8 * math.sin(t * 2.0)

    head_cx = cx + int(head_tilt_deg * 2.0)
    head_cy = neck_y - 118
    hw, hh = 198, 222

    # Ears
    d.ellipse([head_cx - 122, head_cy - 16, head_cx - 84, head_cy + 38], fill=SKIN, outline=OUTLINE, width=7)
    d.ellipse([head_cx + 84, head_cy - 16, head_cx + 122, head_cy + 38], fill=SKIN, outline=OUTLINE, width=7)

    # Back/Top Sculpted Hair Base (Connected seamlessly around the head & temples!)
    hair_top = head_cy - hh // 2 - 44
    d.rounded_rectangle(
        [head_cx - hw // 2 - 12, hair_top + 16, head_cx + hw // 2 + 12, head_cy + 32],
        radius=74,
        fill=HAIR_DARK,
        outline=OUTLINE,
        width=8,
    )
    # Pompadour Top Wave Puff
    d.ellipse(
        [head_cx - hw // 2 + 4, hair_top, head_cx + hw // 2 - 4, hair_top + 96],
        fill=HAIR_DARK,
        outline=OUTLINE,
        width=8,
    )
    # Fill inner hair union
    d.rounded_rectangle(
        [head_cx - hw // 2 - 4, hair_top + 24, head_cx + hw // 2 + 4, head_cy + 20],
        radius=50,
        fill=HAIR_DARK,
    )

    # Face Forehead & Cheek Skin Area (inset cleanly so sideburns stay connected!)
    d.rounded_rectangle(
        [head_cx - hw // 2 + 14, head_cy - hh // 2 + 24, head_cx + hw // 2 - 14, head_cy + hh // 2 - 6],
        radius=62,
        fill=SKIN,
        outline=OUTLINE,
        width=7,
    )

    # Silver-Gray Temple Streaks & Pompadour Swoop Lines
    d.arc([head_cx - 78, hair_top + 14, head_cx + 78, hair_top + 82], start=195, end=345, fill=SILVER_STREAK, width=10)
    d.arc([head_cx - 52, hair_top + 28, head_cx + 68, hair_top + 78], start=205, end=335, fill=SILVER_STREAK, width=7)
    # Silver sideburns at temples
    d.line([head_cx - hw // 2 + 4, head_cy - 44, head_cx - hw // 2 + 4, head_cy + 8], fill=SILVER_STREAK, width=10)
    d.line([head_cx + hw // 2 - 4, head_cy - 44, head_cx + hw // 2 - 4, head_cy + 8], fill=SILVER_STREAK, width=10)

    # Eyes & Blinking
    eye_y = head_cy - 10
    eye_lx, eye_rx = head_cx - 42, head_cx + 42
    blink_cycle = (t + 0.8) % 3.1
    is_blinking = blink_cycle < 0.13

    look_x, look_y = 0, 0
    if pose in ("scissors_cut", "clipper_cut", "razor_shave"):
        look_y = 6
    elif pose == "razor_freeze_shocked":
        look_x, look_y = -8, -4
    elif pose == "phone_dilemma":
        look_x, look_y = 7, -6
    elif pose == "tablet_showcase":
        look_x = 5 if (int(t * 1.5) % 2 == 1) else 0

    for ex in [eye_lx, eye_rx]:
        if is_blinking:
            d.line([ex - 20, eye_y, ex + 20, eye_y], fill=OUTLINE, width=7)
        else:
            d.ellipse([ex - 21, eye_y - 15, ex + 21, eye_y + 15], fill=WHITE, outline=OUTLINE, width=5)
            px_e, py_e = ex + look_x, eye_y + look_y
            d.ellipse([px_e - 10, py_e - 10, px_e + 10, py_e + 10], fill=(59, 35, 20, 255))
            d.ellipse([px_e - 5, py_e - 5, px_e + 5, py_e + 5], fill=OUTLINE)
            d.ellipse([px_e + 2, py_e - 6, px_e + 7, py_e - 1], fill=WHITE)

    # Expressive Eyebrows
    brow_y = eye_y - 30
    if emotion == "thinking" or pose == "phone_dilemma":
        d.line([eye_lx - 24, brow_y - 5, eye_lx + 24, brow_y - 14], fill=BEARD_DARK, width=12)
        d.line([eye_rx - 24, brow_y + 4, eye_rx + 24, brow_y - 4], fill=BEARD_DARK, width=12)
    elif emotion == "stressed":
        d.line([eye_lx - 24, brow_y - 7, eye_lx + 24, brow_y + 5], fill=BEARD_DARK, width=12)
        d.line([eye_rx - 24, brow_y + 5, eye_rx + 24, brow_y - 7], fill=BEARD_DARK, width=12)
    elif emotion == "focused" or pose in ("scissors_cut", "clipper_cut"):
        d.line([eye_lx - 24, brow_y - 2, eye_lx + 24, brow_y + 4], fill=BEARD_DARK, width=12)
        d.line([eye_rx - 24, brow_y + 4, eye_rx + 24, brow_y - 2], fill=BEARD_DARK, width=12)
    else:
        d.line([eye_lx - 24, brow_y, eye_lx + 24, brow_y - 5], fill=BEARD_DARK, width=12)
        d.line([eye_rx - 24, brow_y - 5, eye_rx + 24, brow_y], fill=BEARD_DARK, width=12)

    # Nose
    d.line([head_cx, eye_y - 2, head_cx - 4, eye_y + 32, head_cx + 7, eye_y + 36], fill=(196, 134, 94, 255), width=6)

    # Full Salt-and-Pepper Craftsman Beard
    beard_top = eye_y + 34
    beard_bot = head_cy + hh // 2 + 14
    d.chord(
        [head_cx - hw // 2 - 4, beard_top - 44, head_cx + hw // 2 + 4, beard_bot],
        start=0,
        end=180,
        fill=BEARD_DARK,
        outline=OUTLINE,
        width=8,
    )
    for s_off in [-32, 0, 32]:
        d.line([head_cx + s_off, beard_bot - 42, head_cx + int(s_off * 0.8), beard_bot - 12], fill=SILVER_STREAK, width=6)

    # Mustache
    m_y = beard_top + 16
    d.rounded_rectangle([head_cx - 58, m_y - 10, head_cx + 58, m_y + 12], radius=11, fill=HAIR_DARK, outline=OUTLINE, width=6)

    # Dynamic Lip-Sync Mouth
    m_open_px = int(12 + 30 * max(0.0, min(1.0, mouth_open)))
    my1 = m_y + 10
    my2 = my1 + m_open_px
    d.rounded_rectangle([head_cx - 38, my1, head_cx + 38, my2], radius=12, fill=RED_MOUTH, outline=OUTLINE, width=5)
    d.rectangle([head_cx - 30, my1 + 3, head_cx + 30, my1 + 12], fill=WHITE)
    if m_open_px > 20:
        d.ellipse([head_cx - 18, my2 - 12, head_cx + 18, my2 - 2], fill=TONGUE_PINK)

    # =========================================================================
    # 4. OPTIONAL CUSTOMER IN BARBER CHAIR (FOR HAIRCUT SCENES)
    # =========================================================================
    cust_cx, cust_cy = cx, int(REF_H * 0.57)
    if show_customer:
        d.chord(
            [cust_cx - 178, cust_cy + 40, cust_cx + 178, cust_cy + 310],
            start=180,
            end=360,
            fill=ORANGE,
            outline=OUTLINE,
            width=8,
        )
        for st_x in [-68, 0, 68]:
            d.line([cust_cx + st_x, cust_cy + 58, cust_cx + int(st_x * 1.22), cust_cy + 195], fill=WHITE, width=16)

        d.ellipse([cust_cx - 84, cust_cy - 78, cust_cx + 84, cust_cy + 88], fill=SKIN, outline=OUTLINE, width=8)
        d.chord(
            [cust_cx - 90, cust_cy - 94, cust_cx + 90, cust_cy + 36],
            start=170,
            end=370,
            fill=(28, 34, 44, 255),
            outline=OUTLINE,
            width=8,
        )

    # =========================================================================
    # 5. ARTICULATED ARMS & ACTIVE PROPS
    # =========================================================================
    sh_r = (cx - torso_w // 2 + 10, torso_top + 44)
    sh_l = (cx + torso_w // 2 - 10, torso_top + 44)

    if pose == "scissors_and_phone_chaos":
        # Scene 1 Hook: Makas bir elde (sağ el şık-şık açıp kapatır), çalan telefon öbür elde (sol el)!
        shake = math.sin(t * 14.0) * 14.0
        el_r = (int(sh_r[0] - 64), int(sh_r[1] + 82))
        wr_r = (int(sh_r[0] - 108 + shake), int(sh_r[1] - 28 + math.cos(t * 10.0) * 10))

        el_l = (int(sh_l[0] + 64), int(sh_l[1] + 82))
        wr_l = (int(sh_l[0] + 108 - shake), int(sh_l[1] - 24 + math.sin(t * 12.0) * 10))

        _draw_capsule(d, sh_r, el_r, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_r, wr_r, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_r[0] - 25, wr_r[1] - 25, wr_r[0] + 25, wr_r[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

        # Snipping Scissors held up in Right Hand!
        snip_open_deg = 34.0 * abs(math.sin(t * 22.0))
        _draw_scissors(d, wr_r, base_angle_deg=-55 + shake * 0.8, open_angle_deg=snip_open_deg, scale=1.18)

        _draw_capsule(d, sh_l, el_l, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_l, wr_l, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_l[0] - 24, wr_l[1] - 24, wr_l[0] + 24, wr_l[1] + 24], fill=SKIN, outline=OUTLINE, width=7)
        # Ringing Smartphone held up in Left Hand!
        _draw_phone_in_hand(d, wr_l, angle_deg=14, ringing=True, t=t, scale=1.18)

    elif pose == "scissors_cut":
        sweep = math.sin(t * 3.8)
        el_r = (int(sh_r[0] - 52 + sweep * 16), int(sh_r[1] + 105))
        wr_r = (int(cust_cx - 78 + sweep * 40), int(cust_cy - 90 + math.cos(t * 7.6) * 10))

        el_l = (int(sh_l[0] + 50 - sweep * 14), int(sh_l[1] + 105))
        wr_l = (int(cust_cx + 50 + sweep * 30), int(cust_cy - 84 - math.cos(t * 7.6) * 8))

        _draw_capsule(d, sh_r, el_r, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_r, wr_r, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_r[0] - 25, wr_r[1] - 25, wr_r[0] + 25, wr_r[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

        _draw_capsule(d, sh_l, el_l, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_l, wr_l, 25, SKIN, OUTLINE, width=7)
        _draw_comb(d, wr_l, angle_deg=155 + sweep * 12, scale=1.1)
        d.ellipse([wr_l[0] - 25, wr_l[1] - 25, wr_l[0] + 25, wr_l[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

        snip_open_deg = 32.0 * abs(math.sin(t * 19.0))
        px, py, tip1, tip2 = _draw_scissors(d, wr_r, base_angle_deg=-12 + sweep * 10, open_angle_deg=snip_open_deg, scale=1.15)

        for i in range(5):
            phase = (t * 4.5 + i * 0.22) % 1.0
            hx = int(px + 60 + math.sin(i * 2.1 + t * 8) * 50)
            hy = int(py - 10 - phase * 88)
            ang_h = t * 180 + i * 45
            hp1 = _rot_pt(hx - 11, hy, hx, hy, ang_h)
            hp2 = _rot_pt(hx + 11, hy, hx, hy, ang_h)
            d.line([hp1, hp2], fill=OUTLINE, width=5)

    elif pose == "clipper_cut":
        sweep = math.sin(t * 3.5)
        el_r = (int(sh_r[0] - 48 + sweep * 14), int(sh_r[1] + 108))
        wr_r = (int(cust_cx - 42 + sweep * 46), int(cust_cy - 62 + math.cos(t * 7.0) * 10))

        el_l = (int(sh_l[0] + 48 - sweep * 14), int(sh_l[1] + 108))
        wr_l = (int(cust_cx + 58 + sweep * 26), int(cust_cy - 82))

        _draw_capsule(d, sh_r, el_r, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_r, wr_r, 25, SKIN, OUTLINE, width=7)
        tip_pt = _draw_clipper(d, wr_r, angle_deg=48 + sweep * 12, t=t, scale=1.15)
        d.ellipse([wr_r[0] - 25, wr_r[1] - 25, wr_r[0] + 25, wr_r[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

        _draw_capsule(d, sh_l, el_l, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_l, wr_l, 25, SKIN, OUTLINE, width=7)
        _draw_comb(d, wr_l, angle_deg=160, scale=1.1)
        d.ellipse([wr_l[0] - 25, wr_l[1] - 25, wr_l[0] + 25, wr_l[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

        for i in range(4):
            sx = int(tip_pt[0] + math.sin(t * 25 + i * 1.7) * 32)
            sy = int(tip_pt[1] - ((t * 140 + i * 30) % 65))
            d.ellipse([sx - 5, sy - 5, sx + 5, sy + 5], fill=GOLD)

    elif pose in ("razor_shave", "razor_freeze_shocked"):
        # Usta shaving customer in chair with a classic straight razor (ustura)
        sweep = 0.0 if pose == "razor_freeze_shocked" else math.sin(t * 3.2)
        el_r = (int(sh_r[0] - 78 + sweep * 10), int(sh_r[1] + 155))
        wr_r = (int(cx - 135 + sweep * 18), int(torso_top + 355 + sweep * 8))

        el_l = (int(sh_l[0] + 68), int(sh_l[1] + 135))
        wr_l = (int(cx + 125), int(torso_top + 285))

        _draw_capsule(d, sh_r, el_r, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_r, wr_r, 25, SKIN, OUTLINE, width=7)

        _draw_capsule(d, sh_l, el_l, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_l, wr_l, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_l[0] - 25, wr_l[1] - 25, wr_l[0] + 25, wr_l[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

        # Classic Straight Razor (Ustura) held in Usta's Right Hand!
        rx, ry = wr_r
        # Open handle (black & orange)
        d.polygon([(rx - 15, ry - 18), (rx - 95, ry - 68), (rx - 82, ry - 86), (rx - 2, ry - 34)], fill=OUTLINE, outline=ORANGE, width=6)
        # Gleaming steel razor blade extending toward customer's cheek
        d.polygon([(rx - 6, ry - 12), (rx + 105, ry + 22), (rx + 96, ry + 44), (rx - 14, ry + 10)], fill=STEEL_LIGHT, outline=OUTLINE, width=6)
        d.line([(rx + 4, ry - 4), (rx + 95, ry + 24)], fill=WHITE, width=4)
        # Shaving foam dollop on blade
        d.ellipse([rx + 36, ry + 2, rx + 76, ry + 28], fill=WHITE, outline=STEEL_DARK, width=4)
        # Pivot pin & Usta's right hand gripping the razor tang
        d.ellipse([rx - 14, ry - 20, rx + 6, ry], fill=GOLD, outline=OUTLINE, width=5)
        d.ellipse([wr_r[0] - 25, wr_r[1] - 25, wr_r[0] + 25, wr_r[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

    elif pose == "phone_dilemma":
        el_r = (int(sh_r[0] - 58), int(sh_r[1] + 102))
        wr_r = (int(head_cx - 32), int(beard_bot - 10 + math.sin(t * 6.0) * 5))

        el_l = (int(sh_l[0] + 54), int(sh_l[1] + 92))
        wr_l = (int(sh_l[0] + 95), int(sh_l[1] - 12 + math.sin(t * 4.5) * 6))

        _draw_capsule(d, sh_r, el_r, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_r, wr_r, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_r[0] - 25, wr_r[1] - 25, wr_r[0] + 25, wr_r[1] + 25], fill=SKIN, outline=OUTLINE, width=7)

        _draw_capsule(d, sh_l, el_l, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_l, wr_l, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_l[0] - 24, wr_l[1] - 24, wr_l[0] + 24, wr_l[1] + 24], fill=SKIN, outline=OUTLINE, width=7)
        # Draw phone on top of palm so screen is 100% clear!
        _draw_phone_in_hand(d, wr_l, angle_deg=-10, ringing=True, t=t, scale=1.15)

    elif pose == "phone_to_pocket":
        prog = min(1.0, max(0.0, t / 0.45))
        el_l = (int(sh_l[0] + 52), int(sh_l[1] + 102))
        wr_l_start = (sh_l[0] + 95, sh_l[1] - 8)
        wr_l_end = (cx + 48, pock_y - 8)
        wr_l = (
            int(wr_l_start[0] + (wr_l_end[0] - wr_l_start[0]) * prog),
            int(wr_l_start[1] + (wr_l_end[1] - wr_l_start[1]) * prog),
        )

        el_r = (int(sh_r[0] - 58), int(sh_r[1] + 78))
        wr_r = (int(sh_r[0] - 105), int(sh_r[1] - 32 + math.sin(t * 8.0) * 12))

        _draw_capsule(d, sh_r, el_r, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_r, wr_r, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_r[0] - 26, wr_r[1] - 26, wr_r[0] + 26, wr_r[1] + 26], fill=SKIN, outline=OUTLINE, width=7)

        _draw_capsule(d, sh_l, el_l, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_l, wr_l, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_l[0] - 25, wr_l[1] - 25, wr_l[0] + 25, wr_l[1] + 25], fill=SKIN, outline=OUTLINE, width=7)
        if prog < 0.92:
            _draw_phone_in_hand(d, wr_l, angle_deg=8, ringing=False, t=t, scale=1.05)

    else:
        # 'tablet_showcase' or 'walk_happy'
        wave_ang = math.sin(t * 7.5) * 18.0
        el_r = (int(sh_r[0] - 56), int(sh_r[1] + 82))
        wr_r = (int(sh_r[0] - 110 + wave_ang), int(sh_r[1] - 36 + abs(wave_ang) * 0.4))

        el_l = (int(sh_l[0] + 52), int(sh_l[1] + 92))
        wr_l = (int(sh_l[0] + 82), int(sh_l[1] + 22 + math.sin(t * 2.8) * 6))

        _draw_capsule(d, sh_r, el_r, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_r, wr_r, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_r[0] - 26, wr_r[1] - 26, wr_r[0] + 26, wr_r[1] + 26], fill=SKIN, outline=OUTLINE, width=7)

        _draw_capsule(d, sh_l, el_l, 30, NAVY_SHIRT, OUTLINE, width=7)
        _draw_capsule(d, el_l, wr_l, 25, SKIN, OUTLINE, width=7)
        d.ellipse([wr_l[0] - 25, wr_l[1] - 25, wr_l[0] + 25, wr_l[1] + 25], fill=SKIN, outline=OUTLINE, width=7)
        if pose == "tablet_showcase":
            # Draw tablet on top of palm with side fingers gripping bezel!
            _draw_tablet_in_hand(d, wr_l, scale=1.12)

    # Crop active character region (x: 210..1190 -> 980px, y: 310..1530 -> 1220px)
    cropped = canvas.crop((210, 310, 1190, 1530))
    cw, ch = cropped.size

    # Preserve exact 1:1 aspect ratio inside (width, height) without any stretching!
    scale = min(width / cw, height / ch)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    out.paste(resized, ((width - new_w) // 2, (height - new_h) // 2), resized)
    return out
