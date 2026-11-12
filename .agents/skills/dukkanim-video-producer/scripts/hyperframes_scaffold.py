"""
Dükkanım Yanımda — 60 FPS Hyperframes + Hareketli Usta Rig + Kinetik Yazı Proje Kurucu (Scaffold)
=================================================================================================
Sıfır Dikdörtgen Kutu Standardı:
- `dukkanim-video-producer` + `dukkanim-kinetic-captions` + `dukkanim-visual-storytelling`
- Asla `.brand-header-pill`, `#sceneHeadlineBox` veya `#karaokeContainer` gibi dikdörtgen kutular kullanmaz!
- Sadece organik konuşma balonları (`comicBubble`), patlama balonları (`shout`), eğimli `sticker`, `burst` ve kutusuz `karaoke` kullanır.
"""

import os
import sys
import json
import shutil

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))
KINETIC_SKILL_DIR = os.path.join(REPO_ROOT, ".agents", "skills", "dukkanim-kinetic-captions")


def scaffold_hyperframes_project(project_name, duration=22.0):
    target_dir = os.path.join(REPO_ROOT, "hyperframes-videos", project_name)
    assets_dir = os.path.join(target_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)

    # Copy Usta Vector Rig JS, Kinetic Captions JS, and official brand logos
    rig_js_src = os.path.join(SKILL_DIR, "scripts", "usta_vector_rig.js")
    shutil.copy2(rig_js_src, os.path.join(assets_dir, "usta_vector_rig.js"))

    kc_js_src = os.path.join(KINETIC_SKILL_DIR, "scripts", "kinetic_captions.js")
    if os.path.exists(kc_js_src):
        shutil.copy2(kc_js_src, os.path.join(assets_dir, "kinetic_captions.js"))

    for logo_file in ["logo.png", "logo-icon.png"]:
        src_logo = os.path.join(REPO_ROOT, "dist", "brand", logo_file)
        if os.path.exists(src_logo):
            shutil.copy2(src_logo, os.path.join(assets_dir, logo_file))

    pkg = {
        "name": project_name.replace("_", "-"),
        "private": True,
        "type": "module",
        "scripts": {
            "dev": "hyperframes preview",
            "check": "hyperframes check",
            "render": "hyperframes render --fps 60",
        },
    }
    with open(os.path.join(target_dir, "package.json"), "w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2, ensure_ascii=False)

    hf_cfg = {
        "$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
        "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
        "paths": {
            "blocks": "compositions",
            "components": "compositions/components",
            "assets": "assets",
        },
        "media": {"autoProxy": True},
    }
    with open(os.path.join(target_dir, "hyperframes.json"), "w", encoding="utf-8") as f:
        json.dump(hf_cfg, f, indent=2, ensure_ascii=False)

    html_content = f"""<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0" />
    <title>Dükkanım Yanımda — {project_name}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <script src="assets/usta_vector_rig.js"></script>
    <script src="assets/kinetic_captions.js"></script>
    <style>
      * {{ box-sizing: border-box; margin: 0; padding: 0; }}
      body {{
        width: 1080px;
        height: 1920px;
        background: #181C24;
        overflow: hidden;
        -webkit-font-smoothing: antialiased;
      }}
      #root {{
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: linear-gradient(#3a2618 0%, #4a3020 58%, #6b4a2e 58%, #8a6038 100%);
      }}
      .slats {{
        position: absolute; left: 0; top: 0; width: 100%; height: 1115px;
        background: repeating-linear-gradient(90deg, #5a3a22 0 70px, #4b2f1b 70px 74px, #644126 74px 140px, #4b2f1b 140px 144px);
      }}
      .floor {{
        position: absolute; left: 0; top: 1115px; width: 100%; height: 805px;
        background: repeating-linear-gradient(0deg, #9b6c40 0 90px, #8a5e36 90px 94px);
      }}
      .mirror {{
        position: absolute; right: 60px; top: 250px; width: 430px; height: 640px;
        border-radius: 215px 215px 30px 30px;
        background: linear-gradient(150deg, #9fb4c4, #5d7180 60%, #43525e);
        border: 16px solid #181C24;
        box-shadow: 0 0 0 6px #FF6B00, 0 0 70px rgba(255,140,40,.55);
      }}
      .vignette {{
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55));
        z-index: 40;
      }}
      #ustaStage {{
        position: absolute; left: 450px; top: 900px; width: 640px; height: 870px; z-index: 20;
      }}
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="{duration}"
      data-fps="60"
      data-width="1080"
      data-height="1920"
    >
      <div class="slats"></div>
      <div class="floor"></div>
      <div class="mirror"></div>
      <div id="ustaStage"></div>
      <div class="vignette"></div>
    </div>

    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      const root = document.getElementById("root");

      const usta = UstaVectorRig.create("#ustaStage", {{
        idPrefix: "ustaMain",
        showCustomer: true,
      }});

      usta.addAmbientLife(tl, {duration}, 0);
      usta.animateScissorsHaircut(tl, 0, 5.0);

      // Organik konuşma balonu (Asla dikdörtgen kutu kullanılmaz!)
      KineticCaptions.comicBubble(root, {{
        x: 70, y: 420, w: 540, h: 230, name: "USTA",
        text: "Elim makasta,<br><em>randevu cepte!</em>",
        fontSize: 52, tailX: 700, tailY: 1050, tilt: -3
      }}, tl, 0.2);

      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""
    with open(os.path.join(target_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Hyperframes 60 FPS project scaffolded at: {target_dir}")
    return target_dir


if __name__ == "__main__":
    p_name = sys.argv[1] if len(sys.argv) > 1 else "dukkanim_yeni_reklam"
    dur = float(sys.argv[2]) if len(sys.argv) > 2 else 22.0
    scaffold_hyperframes_project(p_name, dur)
