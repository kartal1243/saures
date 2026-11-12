---
name: dukkanim-kinetic-captions
description: >-
  Dükkanım Yanımda videolarında düz dikdörtgen kutu yazılar yerine modern kinetik yazı stilleri
  (çizgi roman konuşma balonu, kutusuz karaoke altyazı, fırça vurgusu, sticker etiket, POW patlaması)
  kullanmak için skill. Herhangi bir Dükkanım Yanımda video/kare/Reels üretirken, diyalog, altyazı
  veya ekran yazısı eklenecekse bu skilli dukkanim-video-producer ile birlikte aktifleştir.
---

# Dükkanım Yanımda — Kinetik Yazı Stilleri

`dukkanim-video-producer` skilliyle **birlikte** kullanılır. Oradaki tüm kurallar (tek tek kare onayı,
sabit Usta karakteri, turuncu-beyaz tema, 60 FPS) geçerlidir. Bu skill sadece **yazıların nasıl
görüneceğini** belirler.

## 🛑 Altın Kurallar
1. **Ekranda aynı anda en fazla 1 ana yazı öğesi.** Diyalog varsa balon, yoksa karaoke altyazı. İkisi birden ve aynı metinle **asla**.
2. **Logo kutusu sürekli üstte durmaz.** Logo sadece açılışta ve kapanışta görünür.
3. **Düz dikdörtgen kutu yok.** Yazı ya karakterden çıkar (balon), ya kutusuz durur (karaoke), ya da sahnenin bir nesnesine yapışır (sticker, saat, ayna).
4. Bağırma, şaşırma veya kriz anlarında `shout` balonu + `burst` + hafif ekran sarsıntısı kullan.
5. Anahtar kelimeler (RANDEVU, 5'TE, ÇAKIŞMA YOK) `brush` ile vurgulanır. Cümle başına en fazla 1 vurgu.

## 🧰 Kütüphaneler: [kinetic_captions.js](./scripts/kinetic_captions.js) & [kinetic_captions_pil.py](./scripts/kinetic_captions_pil.py)

1. **HTML / Hyperframes / Headless Chrome için (`kinetic_captions.js`):**
   HTML'e ekle: `<script src="assets/kinetic_captions.js"></script>`. Ardından:

| Fonksiyon | Ne zaman? |
|---|---|
| `KineticCaptions.comicBubble(root, {x,y,w,h,text,name,tailX,tailY,shout,tilt}, tl, at)` | Karakter konuşurken. Kuyruk konuşanın ağzına (`tailX/Y`) bakar. |
| `KineticCaptions.karaoke(root, {y, words:[{w,s,e}]}, tl, at)` | Dış ses (voiceover). Kelimeler Whisper zamanlamasıyla patlar. |
| `KineticCaptions.brush(root, {x,y,text,fontSize,tilt}, tl, at)` | Tek anahtar kelime vurgusu. |
| `KineticCaptions.sticker(root, {x,y,text,tilt,orange}, tl, at)` | Kısa etiketler: `"AYNI SAAT?!"`, `"17:00"`. |
| `KineticCaptions.burst(root, {x,y,size,text}, tl, at)` | `"!?"`, `"POW!"`, `"HOP!"` radyal hız çizgili efektler. |

2. **Python 60 FPS Render Boru Hattı için (`kinetic_captions_pil.py`):**
   Python ile doğrudan PIL kareleri üretirken **kesinlikle `rounded_rectangle` metin kutusu çizme!** Bunun yerine `kinetic_captions_pil.py` içindeki birebir karşılıkları çağır:
   - `draw_comic_bubble(canvas, x, y, w, h, lines, tail_xy, speaker_name, shout=False)`
   - `draw_boxless_karaoke(canvas, y, words, t)`
   - `draw_sticker(canvas, x, y, text, tilt=-8.0, orange=True)`
   - `draw_burst(canvas, cx, cy, size=160, text="!?")`

- `tl` (GSAP timeline) verilmezse öğe **statik son hâliyle** çizilir; storyboard karesi için idealdir.
- Balon metninde `<em>...</em>` turuncu vurgu yapar.

## 🎬 Hareket Standartları
- Balon girişi: `elastic.out(1, .55)`, 0.5 sn. Kuyruk noktasından büyür.
- Karaoke: kelime girişi `back.out(3)`; aktif kelime altın sarısı (`#FFBA08`), %118 büyür, -2° döner.
- Fırça: soldan sağa `clip-path` ile 0.35 sn'de çizilir.
- Sticker: ekrana "yapıştırılır" (scale 2.2 → 1), sonra hafif sallanır.

## 📸 Storyboard Karesi Alma
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars `
  --window-size=1080,1920 --screenshot="kare.png" "file:///.../index.html"
```
Örnek tam sahne: [examples/randevu_kriz_kare.html](./examples/randevu_kriz_kare.html)
