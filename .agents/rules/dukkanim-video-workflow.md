---
trigger: always_on
description: Dükkanım Yanımda video ve Reels üretim isteklerinde 6 aşamalı senaryo, seslendirme, tek tek kare onayı, hep aynı karakter ve zengin UI/efekt iş akışını zorunlu kılar.
---

# Dükkanım Yanımda — Video Üretim Kuralı (`dukkanim-video-producer`)

Kullanıcı yeni bir tanıtım videosu, Reels, Shorts veya animasyon fikri söylediğinde:
1. **Skill Aktivasyonu (3'lü Zorunlu Skill Seti):** İlk iş olarak şu 3 skilli birlikte oku ve talimatlarını harfiyen uygula:
   - `.agents/skills/dukkanim-video-producer/SKILL.md` (Ana 6 aşamalı süreç, sabit karakter, tek tek kare onayı)
   - `.agents/skills/dukkanim-kinetic-captions/SKILL.md` (Dikdörtgen kutu yasağı, organik/patlama konuşma balonları, kutusuz karaoke)
   - `.agents/skills/dukkanim-visual-storytelling/SKILL.md` (Az yazı — sahne başına maksimum 4–6 kelime, her şeyi yazıyla değil görsel aksiyon, mimik ve net ikonlarla müşteriye aktarma kuralı)
2. **Önce Senaryo & Kanca (Hook):** Kullanıcı bir konu verdiğinde hemen tüm videoyu render işlemine başlama! Önce insanları içine çeken, sahne sahne (veya 8 kare olarak) kurgulanmış senaryoyu yaz ve kullanıcının yönlendirmesini iste.
3. **Seslendirme Sorusu (ElevenLabs vs. Yerel Motor):** Senaryo aşamasında kullanıcıya seslendirmeyi ElevenLabs'tan kendisinin mi yapacağını yoksa yerleşik `dukkanim_voice_engine.py` motoruyla senin mi üretmeni istediğini mutlaka sor.
4. **Kareleri TEK TEK Yükleme & Sıralı Onay Kuralı (Asla Toplu Kare Atma!):**
   - Video için 7–8 kare hazırlarken **hepsini birden üretip yükleme!**
   - Önce sadece **1. Kareyi** üretip buraya yükle. **1. karenin onayını almadan kesinlikle 2. kareye geçme!**
   - Her kare tek tek kullanıcıdan onay aldıktan sonra bir sonraki kareye geç; tüm kareler onaylanınca 60 FPS videoyu birleştir.
5. **Karakter Hep Aynı Olacak (Sabit Karakter Kuralı):**
   - Tüm karelerde ve videolarda karakter(ler) **hep aynı** görünümde, aynı kıyafet ve aynı oranlarda kalacak; kareden kareye karakter tipi değişmeyecek.
6. **"Düz Dikdörtgen Kutu İçine Yazı Yazma" Yasağı — Kinetik Yazı (`dukkanim-kinetic-captions`) & Zengin Görsel Zorunluluğu:**
   - Sahnelerde diyalogları, başlıkları veya altyazıları **düz/yuvarlatılmış dikdörtgen kutular (`rounded_rectangle`) içine yazmak, ekranın üstüne sabit dikdörtgen logo barı koymak veya ekranın altına dikdörtgen altyazı kutusu çizmek KESİNLİKLE YASAKTIR!**
   - Diyaloglarda konuşan karakterin ağzına sivri kuyruğu uzanan **organik elips konuşma balonu (`comicBubble`)** veya kriz/bağırma anında **altın sarısı zikzaklı patlama balonu (`shout: true`)** kullan.
   - Dış ses (voiceover) olan yerlerde **kutusuz kinetik karaoke (`karaoke` — kalın koyu konturlu, turuncu gölgeli, aktif kelimesi altın sarısı büyüyen ve eğilen yazı)** kullan; aynı anda hem balon hem altyazı kullanma.
   - Aynanın veya saatin üstüne eğimli **die-cut `sticker` etiketler** (`"AYNI SAAT?!"`), karakterin şaşırma anlarına **radyal hız çizgili `burst` (`"!?")** ve anahtar kelimelere **`brush` fırça darbesi** ekle.
   - Her sahnede sıcak ahşap çıtalı duvarlar, etrafı ampullerle (`bulb` glow) çevrili kemerli berber aynası, tenteli cam kapı, berber direği, duvar saati, sıcak spot aydınlatma, bokeh ve `vignette` derinliği kullan.
7. **Üst Seviye 60 FPS Turuncu-Beyaz Tema:** Tüm videoları `#FF6B00` Turuncu & `#FFFFFF` Beyaz kurumsal temada, 60 FPS geçişler ve senkronize ses efektleriyle üret.
