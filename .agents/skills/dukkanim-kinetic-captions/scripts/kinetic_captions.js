/**
 * Dükkanım Yanımda — Kinetic Captions Library (HTML/SVG + optional GSAP, 60 FPS)
 *
 * Replaces boxy rectangle captions with 5 modern styles:
 *  1. comicBubble   — speech bubble with a tail pointing to the speaker (normal | shout)
 *  2. karaoke       — boxless bold caption, active word turns orange & pops
 *  3. brush         — orange brush-stroke highlight behind a key word
 *  4. sticker       — die-cut tilted sticker badge
 *  5. burst         — comic "POW!" star burst + speed lines
 *
 * Every function returns the created element. If a GSAP timeline `tl` is passed
 * with `at` (seconds), entrance animations are added; otherwise the element is
 * rendered in its final static state (useful for storyboard stills).
 */
(function (global) {
  const ORANGE = "#FF6B00";
  const DARK = "#181C24";
  const GOLD = "#FFBA08";
  let uid = 0;

  function injectCSS() {
    if (document.getElementById("kc-style")) return;
    const s = document.createElement("style");
    s.id = "kc-style";
    s.textContent = `
      .kc { position:absolute; z-index:50; pointer-events:none; }
      .kc-bubble svg { position:absolute; inset:0; overflow:visible; }
      .kc-bubble .kc-text { position:relative; font-family:"Segoe UI Black","Segoe UI",sans-serif; font-weight:900;
        color:${DARK}; text-align:center; line-height:1.08; padding:34px 44px; }
      .kc-bubble .kc-name { position:absolute; top:-26px; left:36px; background:${DARK}; color:#fff;
        font:800 24px "Segoe UI",sans-serif; padding:6px 18px; border-radius:999px; transform:rotate(-4deg);
        border:3px solid ${ORANGE}; letter-spacing:.5px; }
      .kc-bubble em { font-style:normal; color:${ORANGE}; }
      .kc-karaoke { left:50%; transform:translateX(-50%); width:960px; text-align:center;
        font-family:Impact,"Segoe UI Black",sans-serif; font-size:76px; line-height:1.05; letter-spacing:1px; }
      .kc-karaoke span { display:inline-block; margin:0 10px; color:#fff;
        -webkit-text-stroke:10px ${DARK}; paint-order:stroke fill; text-shadow:0 8px 0 ${ORANGE}; text-transform:uppercase; }
      .kc-karaoke span.on { color:${GOLD}; transform:scale(1.18) rotate(-2deg); }
      .kc-brush { font-family:Impact,sans-serif; text-transform:uppercase; color:#fff; white-space:nowrap; }
      .kc-brush svg { position:absolute; left:-6%; top:12%; width:112%; height:86%; overflow:visible; z-index:-1; }
      .kc-brush b { -webkit-text-stroke:6px ${DARK}; paint-order:stroke fill; font-weight:400; }
      .kc-sticker { background:#fff; color:${DARK}; font:900 46px "Segoe UI Black",sans-serif; padding:16px 30px;
        border-radius:26px; border:6px solid #fff; outline:5px solid ${DARK};
        box-shadow:0 14px 0 rgba(0,0,0,.18), 0 26px 40px rgba(0,0,0,.25); white-space:nowrap; }
      .kc-sticker.orange { background:${ORANGE}; color:#fff; }
      .kc-burst svg { overflow:visible; }
      .kc-burst .kc-pow { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-family:Impact,sans-serif; color:${GOLD}; -webkit-text-stroke:8px ${DARK}; paint-order:stroke fill;
        transform:rotate(-10deg); text-shadow:6px 6px 0 ${DARK}; }
    `;
    document.head.appendChild(s);
  }

  function mount(parent, cls, x, y) {
    injectCSS();
    const el = document.createElement("div");
    el.className = "kc " + cls;
    el.style.left = x + "px";
    el.style.top = y + "px";
    (parent || document.body).appendChild(el);
    return el;
  }

  // Organic cloud/ellipse bubble path with a tail to (tx,ty) in local coords
  function bubblePath(w, h, tx, ty, shout) {
    const cx = w / 2, cy = h / 2;
    if (shout) {
      // jagged explosion bubble
      const n = 22, pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = i % 2 ? 1.0 : 1.16;
        pts.push([cx + Math.cos(a) * (w / 2) * r, cy + Math.sin(a) * (h / 2) * r]);
      }
      // insert tail at the point closest to target
      let best = 0, bd = 1e9;
      pts.forEach((p, i) => { const d = (p[0] - tx) ** 2 + (p[1] - ty) ** 2; if (d < bd) { bd = d; best = i; } });
      pts.splice(best, 1, [tx, ty]);
      return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L") + " Z";
    }
    const rx = w / 2, ry = h / 2;
    const ang = Math.atan2(ty - cy, tx - cx), spread = 0.16;
    const a1 = [cx + Math.cos(ang - spread) * rx, cy + Math.sin(ang - spread) * ry];
    const a2 = [cx + Math.cos(ang + spread) * rx, cy + Math.sin(ang + spread) * ry];
    return `M${a1} Q${(a1[0] + tx) / 2},${(a1[1] + ty) / 2 + 8} ${tx},${ty} Q${(a2[0] + tx) / 2},${(a2[1] + ty) / 2 - 8} ${a2}
            A${rx},${ry} 0 1,1 ${a1} Z`;
  }

  const KineticCaptions = {
    /**
     * Comic speech bubble.
     * opts: { x, y, w, h, text (allows <em>), name, tailX, tailY (absolute px), shout, fontSize, tilt }
     */
    comicBubble(parent, opts, tl, at) {
      const { x, y, w = 560, h = 230, text, name, shout = false, fontSize = 48, tilt = 0 } = opts;
      const el = mount(parent, "kc-bubble", x, y);
      el.style.width = w + "px";
      el.style.height = h + "px";
      el.style.transform = `rotate(${tilt}deg)`;
      const tx = (opts.tailX ?? x + w * 0.3) - x, ty = (opts.tailY ?? y + h + 80) - y;
      const d = bubblePath(w, h, tx, ty, shout);
      const id = "kcb" + ++uid;
      el.innerHTML = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <defs><filter id="${id}s" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#000" flood-opacity=".28"/></filter></defs>
          <path d="${d}" transform="translate(9,11)" fill="${ORANGE}"/>
          <path d="${d}" fill="${shout ? GOLD : "#fff"}" stroke="${DARK}" stroke-width="7" stroke-linejoin="round" filter="url(#${id}s)"/>
        </svg>
        ${name ? `<div class="kc-name">${name}</div>` : ""}
        <div class="kc-text" style="font-size:${fontSize}px;height:${h}px;display:flex;align-items:center;justify-content:center"><div>${text}</div></div>`;
      if (tl) {
        tl.fromTo(el, { scale: 0, rotation: tilt - 12, transformOrigin: `${tx}px ${ty}px` },
          { scale: 1, rotation: tilt, duration: 0.5, ease: "elastic.out(1, 0.55)" }, at);
        if (shout) tl.to(el, { x: "+=6", yoyo: true, repeat: 9, duration: 0.04, ease: "none" }, at + 0.35);
      }
      return el;
    },

    /**
     * Boxless karaoke caption. words: [{w:"Benimki", s:0.0, e:0.4}, ...]; activeIndex for static stills.
     */
    karaoke(parent, { y = 1560, words, activeIndex = -1 }, tl, at = 0) {
      const el = mount(parent, "kc-karaoke", 0, y);
      el.style.left = "50%";
      el.innerHTML = words.map((w, i) => `<span class="${i === activeIndex ? "on" : ""}">${w.w}</span>`).join(" ");
      if (tl) {
        [...el.children].forEach((sp, i) => {
          const w = words[i];
          tl.fromTo(sp, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "back.out(3)" }, at + w.s - 0.08);
          tl.to(sp, { color: GOLD, scale: 1.18, rotation: -2, duration: 0.1, ease: "back.out(4)" }, at + w.s);
          tl.to(sp, { color: "#fff", scale: 1, rotation: 0, duration: 0.15 }, at + w.e);
        });
      }
      return el;
    },

    /** Brush-stroke highlight. opts: { x, y, text, fontSize, tilt, color } */
    brush(parent, { x, y, text, fontSize = 110, tilt = -4, color = ORANGE }, tl, at) {
      const el = mount(parent, "kc-brush", x, y);
      el.style.fontSize = fontSize + "px";
      el.style.transform = `rotate(${tilt}deg)`;
      el.innerHTML = `<svg viewBox="0 0 400 100" preserveAspectRatio="none">
          <path class="kc-stroke" d="M6,58 C60,20 140,30 210,26 C280,22 350,18 394,40 C380,70 320,86 240,82 C160,80 80,92 14,84 C2,78 0,66 6,58 Z"
            fill="${color}"/>
          <path d="M30,88 C120,96 260,92 380,76" stroke="${color}" stroke-width="5" fill="none" opacity=".7"/>
        </svg><b>${text}</b>`;
      if (tl) {
        const svg = el.querySelector("svg");
        tl.fromTo(svg, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.35, ease: "power2.out" }, at);
        tl.fromTo(el.querySelector("b"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(3)" }, at + 0.1);
      }
      return el;
    },

    /** Die-cut sticker. opts: { x, y, text, tilt, orange } */
    sticker(parent, { x, y, text, tilt = 6, orange = false, fontSize }, tl, at) {
      const el = mount(parent, "kc-sticker" + (orange ? " orange" : ""), x, y);
      el.innerHTML = text;
      if (fontSize) el.style.fontSize = fontSize + "px";
      el.style.transform = `rotate(${tilt}deg)`;
      if (tl) {
        tl.fromTo(el, { scale: 2.2, opacity: 0, rotation: tilt + 25 },
          { scale: 1, opacity: 1, rotation: tilt, duration: 0.35, ease: "back.out(2.5)" }, at);
        tl.to(el, { rotation: tilt - 3, yoyo: true, repeat: -1, duration: 1.2, ease: "sine.inOut" }, at + 0.4);
      }
      return el;
    },

    /** Comic burst with radial speed lines. opts: { x, y, size, text } */
    burst(parent, { x, y, size = 260, text = "POW!", fontSize = 80, lines = true }, tl, at) {
      const el = mount(parent, "kc-burst", x - size / 2, y - size / 2);
      el.style.width = el.style.height = size + "px";
      const c = size / 2, n = 16;
      let star = "";
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? c * 0.62 : c;
        star += (i ? "L" : "M") + (c + Math.cos(a) * r).toFixed(1) + "," + (c + Math.sin(a) * r).toFixed(1);
      }
      let sl = "";
      if (lines) for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2, r1 = c * 1.15, r2 = c * (1.5 + (i % 3) * 0.15);
        sl += `<line x1="${c + Math.cos(a) * r1}" y1="${c + Math.sin(a) * r1}" x2="${c + Math.cos(a) * r2}" y2="${c + Math.sin(a) * r2}"
                 stroke="${DARK}" stroke-width="${i % 2 ? 4 : 7}" stroke-linecap="round"/>`;
      }
      el.innerHTML = `<svg width="${size}" height="${size}">${sl}
          <path d="${star}Z" fill="${ORANGE}" stroke="${DARK}" stroke-width="7" stroke-linejoin="round"/></svg>
          <div class="kc-pow" style="font-size:${fontSize}px">${text}</div>`;
      if (tl) {
        tl.fromTo(el, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(3)" }, at);
        tl.to(el, { scale: 0, opacity: 0, duration: 0.2 }, at + 1.1);
      }
      return el;
    },
  };

  global.KineticCaptions = KineticCaptions;
})(typeof window !== "undefined" ? window : globalThis);
