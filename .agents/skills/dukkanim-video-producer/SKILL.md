---
name: dukkanim-video-producer
description: >-
  Dükkanım Yanımda resmi video, Reels, web sitesi tanıtımı ve animasyonlu reklam üretim skilli.
  Kullanıcı yeni bir video fikri söylediğinde, senaryo istediğinde, tanıtım videosu veya Reels
  hazırlatmak istediğinde bu skilli aktifleştir. İçerisinde 6 aşamalı interaktif süreç (Senaryo ->
  Seslendirme seçimi -> 8 kareyi TEK TEK yükleyip ilkinin onayını almadan ikincisine geçmeme kuralı ->
  Hep aynı sabit Usta karakteri -> 60 FPS Turuncu-Beyaz Hyperframes/FFmpeg render) bulunur.
---

# Dükkanım Yanımda — Üst Seviye Video & Animasyon Üretim Skilli

Bu skill, **Dükkanım Yanımda** markası için üretilecek tüm sosyal medya (Instagram Reels, TikTok, Shorts) ve web sitesi tanıtım videolarının **senaryo, kare kare (tek tek) onay, seslendirme, değişmez "Usta" karakteri ve 60 FPS Hyperframes/FFmpeg kurgu** standartlarını belirler.

---

## 🛑 KIRMIZI ÇİZGİ KURALLARI (ASLA İHLAL ETME!)

1. **KARAKTER HEP AYNI OLACAK & GERÇEK RESİM YERİNE %100 KODLA YAZILAN ANİMASYON KARAKTERLERİ KULLANILACAK:**
   - **Gerçekçi fotoğraf / AI insan resmi KULLANMA!** Kullanıcı her zaman **kodla yazılan 2D vektör animasyon karakterlerini** (bizim Usta karakterimiz + yan karakterler/müşteriler de kodla yazılmış animasyon karakteri olarak) istemektedir.
   - Karakterimiz tüm videolarda ve tüm karelerde **hep aynı** kalacaktır! Sahneden sahneye veya videodan videoya farklı tipte karakter üretmek **kesinlikle yasaktır**.
   - Her karede `.agents/skills/dukkanim-video-producer/scripts/usta_vector_puppet.py` ve `usta_vector_rig.js` içindeki standart **Usta** karakteri (kır saçlı/sakallı, lacivert gömlekli, `#FF6B00` turuncu esnaf önlüklü, kahverengi botlu ve sabit `1:1` oranlı) ve aynı vektör çizim stilinde kodlanmış müşteri karakterleri kullanılacaktır.
2. **KARELER TEK TEK YÜKLENECEK — İLKİNİN ONAYINI ALMADAN İKİNCİSİNE GEÇİLMEYECEK:**
   - Video için 7 veya 8 kare (sahne görseli) hazırlarken **tüm kareleri topluca üretip atmak veya doğrudan videoyu render etmek KESİNLİKLE YASAKTIR!**
   - Süreç şu şekilde işlemek zorundadır:
     - **Adım 1:** Sadece **1. Kareyi (Sahne 1)** üretip sohbete yükle ve dur! Kullanıcıya *"Kanka 1. kare hazır, onaylıyor musun? Düzeltmemi istediğin bir yer var mı?"* diye sor.
     - **Adım 2:** Kullanıcının **1. kare için açık onayını almadan kesinlikle 2. kareye geçme!** Kullanıcı revize isterse 1. kareyi düzeltip tekrar göster.
     - **Adım 3:** 1. kare onaylandıktan sonra **2. Kareyi** üretip yükle; onun onayını almadan **3. Kareye** geçme.
     - **Adım 4:** Tüm kareler (örn. 1'den 8'e kadar) bu şekilde **tek tek yüklendikten ve her biri sırayla onaylandıktan sonra** final 60 FPS video birleştirme/render işlemine geç.
3. **"DÜZ DİKDÖRTGEN KUTU İÇİNE YAZI YAZMA" YASAĞI — KİNETİK YAZI (`dukkanim-kinetic-captions`) & ZENGİN EFEKT ZORUNLULUĞU:**
   - Sahnelerde **düz veya yuvarlatılmış dikdörtgen (`rounded_rectangle`) çizip içine diyalog, üst başlık barı veya alt altyazı kutusu yazmak KESİNLİKLE YASAKTIR!**
   - Bu skill çalıştırıldığında **her zaman `.agents/skills/dukkanim-kinetic-captions/SKILL.md` ve `.agents/skills/dukkanim-visual-storytelling/SKILL.md` skilleriyle birlikte** kullanılır:
     - **Az Yazı, Maksimum Görsel Anlatım (`dukkanim-visual-storytelling`):** Ekranda yazı kalabalığı KESİNLİKLE YASAKTIR! Sahne başına **en fazla 4–6 kelime** kullanılır; verilmek istenen tüm mesaj uzun açıklamalarla değil, karakterlerin aksiyonu, yüz ifadeleri, sahne nesneleri ve telefon ekranındaki net görsel ikonlarla (`Logo + Saat + Avatar + ✓`) müşteriye geçirilir. Nesnelerin veya karakterlerin üstüne açıklayıcı etiket (`"Defter Karıştı"`, `"Rahatça Bekliyor"` vb.) yazılmaz!
     - **Üstte Sabit Logo/Başlık Dikdörtgeni YOK:** Ekranın tepesine her karede duran dikdörtgen marka barı koyma! Logo sadece açılışta ve kapanışta (veya sahne içindeki gerçek telefon/tablet ekranında) görünür.
     - **Altta Dikdörtgen Altyazı Kutusu YOK:** Ekranın altına dikdörtgen kapsül çizip içine altyazı yazma!
     - **Aynı Anda En Fazla 1 Ana Yazı Öğesi:** Karakter konuşuyorsa sadece **Çizgi Roman Konuşma Balonu (`comicBubble`)** kullanılır (altta ayrıca altyazı tekrarlanmaz!). Dış ses (voiceover) varsa **Kutusuz Kinetik Karaoke (`karaoke`)** kullanılır.
     - **5 Zorunlu Kinetik Yazı & Efekt Stili (`KineticCaptions`):**
       1. **`comicBubble` (Organik Elips veya Zikzaklı Patlama Balonu):** Normal konuşmada beyaz dolgulu, kalın `#181C24` konturlu, `#FF6B00` turuncu gölgeli organik elips balon; sivri kuyruğu (`tailX, tailY`) doğrudan konuşan karakterin ağzına bakar, sol üstünde `-4°` eğimli konuşmacı kapsülü (`MÜŞTERİ 1`, `USTA`) yer alır. Kriz/bağırma anında (`shout: true`) `#FFBA08` altın sarısı dolgulu, 22 köşeli **zikzaklı patlama (starburst) balonu** kullanılır!
       2. **`karaoke` (Kutusuz Kinetik Altyazı):** Arka plan kutusu olmadan kalın `Impact` / `Segoe UI Black` fontuyla, `10px` `#181C24` dış kontur ve `#FF6B00` sert gölgeyle doğrudan sahne üzerine yazılır; okunan kelime `#FFBA08` altın sarısı olup `%118` büyür ve `-2°` döner.
       3. **`sticker` (Die-Cut Eğimli Yapıştırma Etiket):** Aynanın, saatin veya sahne nesnesinin üstüne `6°–8°` eğimli yapıştırılan, beyaz iç çerçeveli + koyu dış konturlu `#FF6B00` turuncu etiket (Örn: `"AYNI SAAT?!"`, `"17:00"`).
       4. **`burst` (Çizgi Roman Şok / `!?` / `POW!` Patlaması + Radyal Hız Çizgileri):** Şaşırma ve kriz anlarında karakterin yanında 16 köşeli turuncu yıldız patlaması, 24 adet radyal hız çizgisi (`speed lines`) ve `-10°` eğimli altın sarısı `"!?"` vurgusu.
       5. **`brush` (Fırça Darbesi Vurgusu):** Anahtar kelimenin arkasında organik `#FF6B00` fırça darbesi.
   - **Zengin Sahne Mekânı ve Atmosfer (Referans: `examples/randevu_kriz_kare.html`):**
     - Boş düz renk arka plan yerine sıcak ahşap çıtalı duvarlar, etrafı sıcak sarı ampullerle (`bulb` glow) çevrili kemerli berber aynası, turuncu-beyaz tenteli cam kapı ve altın kapı zili, berber direği (`barber pole`), kalın turuncu çerçeveli duvar saati, yumuşak bokeh ışık küreleri ve sinematik `vignette` kullanılacaktır.
   - **3D Perspektifli Cihazlar & Glassmorphism Arayüzler:**
     - Uygulama ekranları gösterilirken düz kutu yerine 3D perspektif açılı telefon/tablet ekranları, dairesel grafikler ve zengin mikro-animasyonlar kullanılacaktır.

---

## 🚨 Zorunlu 6 Aşamalı Video Üretim İş Akışı (Asla Aşama Atlama!)

Kullanıcı *"Bugün aklımda şöyle bir fikir var..."*, *"Site için tanıtım videosu yapalım"* veya *"Yeni bir Reels çekelim"* dediğinde **kesinlikle doğrudan video render işlemine veya toplu kare üretimine başlama!** Aşağıdaki 6 aşamayı sırasıyla uygula:

### Aşama 1: İnsanı İçine Çeken Senaryo & Kanca (Hook) Tasarımı
1. Kullanıcının verdiği konuyu analiz et ve **ilk 3 saniyede izleyiciyi ekrana kilitleyen (Hook)**, esnafın/müşterinin yaşadığı gerçek derdi gösteren (**Pain Point / Çatışma**), **Dükkanım Yanımda**'nın pratik çözümünü sunan (**Solution**) ve etkileşime çağıran (**Interactive CTA**) bir senaryo hazırla.
2. Senaryoyu kullanıcıya şu yapı ile sun:
   - **Hedef Süre & Tempo:** (Örn: `20–25 saniye · 60 FPS Yüksek Tempo`)
   - **Sahne Sahne Akış Tablosu:**
     - **Sahne Süresi** (`0.0s - 3.0s` vb.)
     - **Kod Tabanlı Usta Karakterinin Hareketi:** (Örn: `scissors_cut` — Usta sağ eliyle makası şık-şık açıp kapatarak müşteri saçını keser, sol eliyle tarak tutar, göz kırpar ve konuşur).
     - **Ekran / Hyperframes Efekt & Geçişleri:** (Örn: Diagonal Turuncu-Beyaz kurdele geçişi, 3D iPhone / Web Tarayıcı kartı yaylanarak açılır, canlı sayaç döner).
     - **Seslendirme Metni (Voiceover):** Doğal, samimi, akıcı esnaf/reklam Türkçesi.
3. Daha fazla senaryo kalıbı için [Senaryo Şablonları Rehberi](./references/scenario_templates.md) dosyasına başvur.

### Aşama 2: Kullanıcı Yönlendirmesi & Senaryo Onayı
- Senaryoyu sunduktan sonra kullanıcıdan geri bildirim iste:
  *"Kanka senaryo kurgusu ve Usta'nın sahne hareketleri nasıl? Eklemek veya değiştirmek istediğin bir yer var mı?"*
- Kullanıcının istediği revizeleri senaryoya anında uygula.

### Aşama 3: Seslendirme Seçimi (Sorarak İlerleme: ElevenLabs vs. Yerel Ses Motoru)
- Senaryo onaylandığında (veya senaryo sunumunun hemen altında) kullanıcıya **mutlaka şu soruyu sor**:
  1. **Seçenek A (ElevenLabs):** *"Seslendirmeyi ElevenLabs'tan sen üretip MP3 olarak mı atacaksın?"*
     - Kullanıcı ElevenLabs'ı seçerse (veya kolaylık olsun diye peşinen): Noktalama işaretleri (`...`, `—`, `!`, `?`) ElevenLabs nefes ve tonlamasına göre optimize edilmiş **tek parça kopyala-yapıştır metni** ve önerilen ElevenLabs ayarlarını (`Stability: %40–45`, `Similarity: %80`, `Style Exaggeration: %25–35`) paylaş.
  2. **Seçenek B (Benden / Yerleşik AI Ses Motoru):** *"Yoksa doğrudan benim yerleşik Dükkanım Yanımda Ses Motoru (`dukkanim_voice_engine.py`) ile otomatik seslendirmemi mi istersin?"*
     - Kullanıcı *"Sen seslendir"* derse kök dizindeki `dukkanim_voice_engine.py` motorunu kullanarak 24kHz kalitede Türkçe seslendirmeyi otomatik üret.

### Aşama 4: Sahne Karelerini (Örn. 7-8 Kare) TEK TEK Yükleme ve Sıralı Onay
Senaryo onaylandıktan sonra sahne karelerini (storyboard / sahne görsellerini) hazırlarken **asla tüm kareleri tek seferde üretip atma!**
1. **Tek Tek Üretim ve Onay Döngüsü:**
   - Önce **1. Kareyi (Sahne 1)** hazırla, sohbete yükle ve dur.
   - Kullanıcının **1. kareyi onaylamasını bekle**. İlkinin onayını almadan **kesinlikle 2. kareye geçme!**
   - Kullanıcı 1. karede düzeltme isterse önce 1. kareyi revize edip tekrar onay al.
   - 1. kare onaylandıktan sonra **2. Kareyi**, o onaylandıktan sonra **3. Kareyi**... son kareye (örn. **8. Kare**) kadar **her birini tek tek yükleyip ayrı ayrı onaylat**.
2. **Karakter Tutarlılığı (Hep Aynı Usta Karakteri):**
   - Hazırlanan her karede karakterimiz **birebir aynı Usta karakteri** olmak zorundadır (`usta_vector_puppet.py` / `usta_vector_rig.js`). Kareler arasında karakterin yüzü, sakalı, önlüğü veya vücut oranları asla değişmez.

### Aşama 5: Değişmez Hareketli Usta Karakteri + Üst Seviye 60 FPS Video Render
Tüm kareler kullanıcı tarafından **tek tek onaylandıktan** ve ses dosyası hazır olduktan sonra 60 FPS video birleştirme hattını çalıştır:

1. **Kelime Zamanlaması (Whisper Word-Level Sync):**
   - Ses dosyasını Whisper (`tiny` veya `base`) ile analiz ederek her kelimenin `start` ve `end` saniyesini `timeline.json` olarak çıkar.
2. **Hep Aynı Kod Tabanlı Hareketli 2D Vektör "Usta" Karakter Rigi:**
   - **Statik fotoğraf/kesit veya farklı karakter KULLANMA!** Her zaman bu skill içindeki tek ve sabit eklemli kukla motorlarını kullan:
     - **Python 60 FPS Vektör Kukla Motoru:** [usta_vector_puppet.py](./scripts/usta_vector_puppet.py)
     - **Hyperframes SVG + GSAP 60 FPS Kukla Motoru:** [usta_vector_rig.js](./scripts/usta_vector_rig.js)
   - **Hazır Karakter Pozları & Eklemli Hareketler (`pose` parametresi):**
     - `scissors_and_phone_chaos`: Sağ elinde şık-şık açılıp kapanan berber makası, sol elinde çalan ve ses dalgaları yayan telefon, yorgun/stresli yüz ifadesi.
     - `scissors_cut`: Usta koltuktaki müşterinin arkasında durur; **sağ elindeki berber makasının iki çeliği (`Blade A` ve `Blade B`) 60 FPS'te şık-şık açılıp kapanır**, kesilen saç telleri havaya uçuşur, sol elindeki turuncu tarak saçı tarar!
     - `clipper_cut`: Sağ elinde yüksek frekansla titreşen kablosuz tıraş makinesi ve kıvılcım/saç partikülleri, sol elinde tarak.
     - `phone_dilemma`: Sol elinde çalan ve turuncu ses dalgaları yayan akıllı telefon, sağ eli sakalında/çenesinde düşünür (`thinking`), tek kaşı kalkık.
     - `phone_to_pocket`: Sol kol aşağı iner ve telefonu turuncu esnaf önlüğünün ön cebine kaydırarak bırakır (*"Telefon cebinde kalır!"*), sağ el selam verir.
     - `tablet_showcase`: Telefon önlük cebinde görünürken sol elinde canlı grafikli **Dükkanım Yanımda** tableti, sağ eliyle izleyicilere el sallar veya ekranı işaret eder.
     - `walk_happy`: Kollar ve botlar senkronize yürüyüş döngüsünde (`walk_phase`).
   - **Yüz & Lip-Sync (Ağız Senkronu):**
     - Konuşma anlarında `mouth_open` (`0.0` -> `1.0`) ses yüksekliğine veya kelime hecelerine göre açılıp kapanır; gözler her `3.1` saniyede bir doğal kırpılır; göğüs kafesi nefes alır.
3. **Üst Seviye Hyperframes / 60 FPS Görsel Efekt & Geçiş Standartları:**
   - **Resmi Turuncu & Beyaz Tema:**
     - Ana Turuncu: `#FF6B00` | Koyu Turuncu: `#E85500` | Yumuşak Turuncu: `#FFF3EB`
     - Arka Plan: `#F8FAFC` / `#FAF6F0` (Sıcak Krem & Beyaz) | Koyu Antrasit: `#181C24`
     - Onay Yeşili: `#22C55E` | Vurgu Altın: `#FFBA08`
   - **Geçişler & Efektler:**
     - Sahne geçişlerinde **60 FPS Diagonal Turuncu-Beyaz Kurdele Geçişi (`draw_diagonal_ribbon_wipe`)** veya **Metal Kepenk Geçişi (`draw_metal_shutter_wipe`)**.
     - Cihaz ve Web Ekranlarında `ease_out_back` yaylanma fiziği, canlı sayaçlar (odometer), parlayan rozetler ve patlayan yıldız/konfeti partikülleri.
   - **Kinetik Diyalog Balonları & Kutusuz Karaoke Altyazı (`dukkanim-kinetic-captions`):**
     - **ASLA dikdörtgen altyazı kutusu veya dikdörtgen konuşma kutusu çizme!**
     - Karakter konuşurken `.agents/skills/dukkanim-kinetic-captions/scripts/kinetic_captions.js` (veya Python'da `kinetic_captions_pil.py`) içindeki `comicBubble` (normal konuşmada organik elips balon, bağırma/kriz anında `shout: true` 22 köşeli altın sarısı patlama balonu) kullanılır; balonun sivri kuyruğu konuşan karakterin ağzına bakar.
     - Dış ses (voiceover) olan sahnelerde ise **kutusuz `karaoke`** kullanılır: yazılar kalın `#181C24` konturlu ve `#FF6B00` gölgeli olarak doğrudan sahne üzerinde durur, okunan kelime `#FFBA08` altın sarısı renginde `%118` büyüyerek ve `-2°` dönerek vurgulanır.
     - Sahnedeki nesnelerin (ayna, saat vb.) üzerine `sticker` (`"AYNI SAAT?!"`) ve karakterin şok anlarına `burst` (`"!?"` + radyal hız çizgileri) eklenir.
   - **Zengin Ses Efektleri (SFX Mix):**
     - Konuşma sesinin altına sahneye uygun makas şıkırtısı (`scissor snip`), tıraş makinesi, telefon çalması, düşünce balonu pop, geçiş whoosh, takvim "tık" ding ve bildirim seslerini sentezleyip `master_audio.m4a` olarak birleştir.
   - Detaylı renk, tipografi ve efekt kuralları için [Marka Teması ve Hareket Rehberi](./references/brand_theme_and_motion.md) dosyasına bak.

### Aşama 6: Görsel Kalite Kontrol & Tam Teslimat Paketi
1. Render bittikten sonra `ffmpeg` ile 8 karelik bir **Contact Sheet** çıkar ve hem videoyu hem de üretilen **9:16 Reels Kapağı** ile **1:1 Profil Izgara Kapağını** `read_file` aracıyla bizzat incele:
   - Karakterin saç/kafa kısmı asla kesilmemiş olmalı (`1:1` oran korunmalı).
   - Karakter ile telefon/web mockup arasında en az `90px–165px` ferah boşluk bulunmalı.
   - Metinlerde eksik glif kutusu (`[]`) olmamalı (Unicode emoji yerine vektör ikonlar çizilmeli).
2. Kullanıcıya tıklanabilir `file:///` bağlantılarıyla videoyu, kapakları ve kopyalamaya hazır **Instagram Açıklama Metnini (Caption)** sun.

---

## 🛠️ Hızlı Komutlar ve Yardımcı Scriptler

- **Yeni Hyperframes + Hareketli Usta Projesi Oluşturma:**
  [hyperframes_scaffold.py](./scripts/hyperframes_scaffold.py) scriptini çalıştırarak `hyperframes-videos/<proje_adi>` altında 60 FPS `index.html`, `usta_vector_rig.js` ve `hyperframes.json` yapısını tek komutla kurabilirsin.
- **Python 60 FPS Render Şablonu:**
  Doğrudan Python + FFmpeg rawvideo boru hattında `usta_vector_puppet.py` içindeki `render_usta_rig_frame(...)` fonksiyonunu çağırarak 60 FPS MP4 üretebilirsin.
