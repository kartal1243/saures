# Dükkanım Yanımda — Resmi Marka Teması, Hyperframes Efektleri ve Ses Tasarımı

## 1. Resmi Renk Paleti (Turuncu & Beyaz Tema)

| Rol | Renk Adı | HEX | RGB | Kullanım Alanı |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Brand** | Ana Turuncu | `#FF6B00` | `(255, 107, 0)` | Ana başlık kapsülleri, Usta önlüğü, vurgu çerçeveleri |
| **Deep Accent** | Koyu Turuncu | `#E85500` | `(232, 85, 0)` | CTA butonları, marka başlığı, gölgeli vurgu |
| **Soft Tint** | Yumuşak Turuncu | `#FFF3EB` | `(255, 243, 235)` | Arka plan dekoratif daireleri, ikincil kart dolguları |
| **Canvas BG** | Sıcak Krem / Beyaz | `#F8FAFC` / `#FFFFFF` | `(248, 250, 252)` | Ana stüdyo arka planı ve temiz kart yüzeyleri |
| **Dark UI / Text** | Koyu Antrasit | `#181C24` | `(24, 28, 36)` | Vektör dış konturları (`outline`), koyu kartlar, ana metin |
| **Success** | Onay Yeşili | `#22C55E` | `(34, 197, 94)` | "Tık Diye Düştü", "Randevu Alındı", DM onay rozetleri |
| **Karaoke Active** | Altın Sarısı | `#FFBA08` | `(255, 186, 8)` | Karaoke altyazıda o an okunan aktif kelime vurgusu |
| **Alert / Stress** | Uyarı Kırmızısı | `#EF4444` | `(239, 68, 68)` | Problem sahnelerindeki "Çakışma Tehlikeli / Kasa Karışık" uyarıları |

---

## 2. "Düz Dikdörtgen Kutu" Yasağı & Zengin UI / Sahne Tasarım Standartları

> [!IMPORTANT]
> Sahnelerde düz arka plan üstüne sadece dikdörtgen kutu (`rounded_rectangle`) çizip içine düz yazı yazmak **YASAKTIR**. Her sahne ve her **Dükkanım Yanımda** arayüzü aşağıdaki zengin görsel katmanlarla oluşturulmalıdır:

1. **Gerçekçi Mekân & Atmosfer Katmanı (Environment Depth):**
   - Berber/kuaför sahnelerinde: Sıcak LED çerçeveli berber aynaları, deri kapitone berber koltuğu, mermer tezgâh, duvarda `17:00` gösteren analog saat, tavandan süzülen sıcak turuncu-kehribar spot ışık hüzmeleri (`radial glow`) ve derinlikli zemin yansımaları.
2. **3D Perspektifli Cihaz & Glassmorphism (Buzlu Cam) UI Tasarımı:**
   - Uygulama ekranları düz bir dikdörtgen kutu olarak değil; **3D perspektif eğimli (`perspective tilt`)**, titanyum gövdeli, ekran üzerinde çapraz cam yansıması (`specular glare`), arkasında yumuşak turuncu ışık halesi (`ambient orange bloom`) ve çok katmanlı derin gölge (`GaussianBlur`) ile çizilir.
   - Uygulama içindeki randevu kartlarında: Müşteri avatar daireleri, saat dilimi ilerleme çubukları, durum rozetleri (`Onaylandı`, `Çakışma Yok`), mini gelir/doluluk dalga grafikleri (`spline area chart`) ve yüzen bildirim kapsülleri (`floating glass toast`) yer alır.
3. **Üst Seviye Hyperframes & 60 FPS Geçiş Efektleri:**
   - **Diagonal Turuncu-Beyaz Kurdele Geçişi (`draw_diagonal_ribbon_wipe`):** Problem sahnesinden çözüm sahnesine geçerken `0.35s–0.40s` sürede ekranı çapraz süpüren 4 katmanlı 60 FPS şerit geçişi.
   - **Kamera Push-In / Orbit & Paralaks:** Arka plandaki berber dükkanı katmanı yavaş hareket ederken ön plandaki karakterler ve 3D uygulama kartları farklı hızda hareket ederek gerçek kamera derinliği verir.
   - **Işık Patlaması (Light Flare) & Ses Dalgaları:** Kapı zili çaldığında veya bildirim düştüğünde yayılan halkalar (`concentric glowing rings`) ve sahne geçişlerinde sıcak turuncu-beyaz `light flare`.
4. **Kinetik Diyalog Balonları & Kutusuz Karaoke Altyazı (`dukkanim-kinetic-captions`):**
   - **Sıfır Dikdörtgen Yazı Kutusu:** Ekranın üstüne sabit dikdörtgen logo barı veya ekranın altına dikdörtgen altyazı kapsülü koymak **kesinlikle yasaktır**!
   - **Diyaloglarda `comicBubble`:** Karakter konuşurken organik elips konuşma balonu (`shout: false`, beyaz dolgulu, kalın `#181C24` konturlu, `#FF6B00` katman gölgeli) veya kriz/bağırma anında 22 köşeli altın sarısı patlama balonu (`shout: true`, `#FFBA08` dolgulu) kullanılır; sivri kuyruk doğrudan konuşan karakterin ağzına (`tailX, tailY`) uzanır ve sol üstünde `-4°` eğimli konuşmacı etiketi (`MÜŞTERİ 1`, `MÜŞTERİ 2`, `USTA`) yer alır.
   - **Dış Seste Kutusuz `karaoke`:** Karakter konuşmuyorsa (dış ses varsa) arka plan kutusu olmadan kalın `#181C24` dış konturlu (`10px stroke`) ve `#FF6B00` gölgeli kutusuz yazı kullanılır; aktif kelime `#FFBA08` altın sarısı renginde `%118` büyür ve `-2°` döner.
   - **Sahne Etiketleri (`sticker`) & Şok Efektleri (`burst`):** Ayna/saat üstüne `6°–8°` eğimli die-cut `sticker` (`"AYNI SAAT?!"`) ve şaşırma anlarında karakterin yanına 24 radyal hız çizgili `burst` (`"!?"`) eklenir.
5. **Sıfır Kırık Karakter Kuralı:**
   - Windows Segoe UI fontunda eksik glif kutusu (`[]`) oluşturabilecek ham Unicode emojiler (`✂`, `✓`, `🎉`, `📲`, `😱`) **asla metin olarak yazılmaz**; bunun yerine özel vektör ikonlar ve ifadeler çizilir.

---

## 3. Senkronize Ses Tasarımı (SFX Katmanları)

Her videoda seslendirme (`voiceover`) altına aşağıdaki ses efektleri zamanlamaya (`timeline.json`) göre otomatik mikslenir:
- **Makas Şıkırtısı (`scissor_snip`):** `scissors_cut` sahnesinde makas her kapandığında (`~0.16s` periyotla) metalik hafif `3.2kHz–6.5kHz` tık/şıkırtı.
- **Tıraş Makinesi (`clipper_buzz`):** `clipper_cut` sahnesinde `115Hz + 230Hz` harmonik hafif motor vızıltısı.
- **Telefon Çalması / Titreşim (`phone_ring`):** `phone_dilemma` sahnesinde çift tonlu (`440Hz + 480Hz`) arama ve titreşim sesi.
- **Düşünce Balonu Pop (`bubble_pop`):** Düşünce bulutları açılırken tatlı `300Hz -> 680Hz` sine sweep pop sesi.
- **Geçiş Whoosh (`ribbon_whoosh`):** Kurdele geçişlerinde filtrelenmiş beyaz gürültü (`bandpass sweep`).
- **Takvim "Tık" & Onay Ding (`snap_ding`):** Randevu veya ciro ekrana düştüğü anda `880Hz + 1320Hz` kristal zil sesi.
