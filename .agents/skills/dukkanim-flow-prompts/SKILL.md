---
name: dukkanim-flow-prompts
description: >-
  Dükkanım Yanımda için Google Flow (Veo) kısa Reels video prompt'ları yazma skilli. Kullanıcı
  "Google Flow için prompt", "Flow'a atacağım video", "Veo prompt'u", "kısa reels prompt'u" dediğinde
  aktifleştir. Kullanıcının Flow'a yüklediği SABİT ana karakterle, tek bir site özelliğini gösteren,
  logo efektiyle kapanan 8–20 saniyelik video prompt'ları üretir.
---

# Dükkanım Yanımda — Google Flow Reels Prompt Ajanı

## 🎯 Görev
Her istekte **tek bir Dükkanım Yanımda özelliğini** öne çıkaran, müşteri çeken kısa bir Reels için
Google Flow'a kopyala-yapıştır yapılabilecek prompt paketi üret.

## 🛑 Sabit Kurallar
1. **Tüm videolar %100 ANİMASYONLU olmalı (Gerçek insan / live-action YASAK!).** Her prompt'un başında
   `3D Pixar-style vibrant animated movie, expressive cartoon characters, stylized animated barbershop world, matching the exact animation style of the reference image`
   ifadesi yer alır. Yan karakterler, müşteriler, mekan ve efektler de aynı animasyon evreninde çizilir.
2. **Ana karakter sabittir ve kullanıcı tarafından Flow'a yüklenmiştir.** Karakterin görünüşünü (saç, sakal,
   kıyafet, yaş) prompt'ta **yeniden tarif etme**; sadece `the animated main character from the reference image`
   ifadesini kullan ve her klipte aynen tekrarla. Karakter tipi, kıyafeti veya oranları asla değişmez.
3. **Tek video = tek özellik.** Aynı videoya birden fazla özellik sıkıştırma.
4. **Yapı (20 sn varsayılan — 3 Klip):**
   - **Klip 1 (`0–8 sn`) — Kanca & Kriz:** Esnafın yaşadığı tanıdık dert komik ve abartılı animasyonla gösterilir.
   - **Klip 2 (`8–16 sn`) — Çözüm & Sihir:** Karakter Dükkanım Yanımda özelliğini açar, sistemin nasıl çözdüğü 3D animasyon efektleriyle net gösterilir ve karakter kameraya dönüp repliğini söyler.
   - **Klip 3 (`16–20 sn`) — Efektli Logo Kapanışı & Çağrı (CTA):** Sahne turuncu-beyaz ışık parçacıklarıyla Dükkanım Yanımda logosuna dönüşür, seslendirme ve altyazı `"Yorumlara RANDEVU yaz!"` çağrısını yapar.
5. **Flow sınırı & Zincirleme:** Flow klip başına en fazla 8 sn üretir. 20 sn için **Klip 1 (8 sn) + Klip 2 (8 sn) + Klip 3 Logo (4 sn)** kullanılır. Klip 2 ve Klip 3'ü üretirken `Extend` veya `Frames to Video` (önceki klibin son karesi başlangıç olacak şekilde) kullanılır.
6. **Prompt dili İngilizce, diyaloglar Türkçe** (tırnak içinde, `says in Turkish:` ile). Replik en fazla 6–7 kelime.
7. **Seslendirme ve altyazı prompt'un İÇİNDE yazılır (Flow üretir).** Her klip prompt'unun sonuna şu blokları ekle:
   - `Voiceover (male Turkish narrator, energetic, friendly, clear): "<Türkçe metin>"`
     → Klip başına en fazla 12–14 kelime (8 sn'ye sığmalı). Karakter konuşuyorsa seslendirme o anda susar.
   - `Burned-in animated subtitles at the bottom center, bold white sans-serif uppercase letters with thick black outline and orange drop shadow, no background box, word-by-word bouncy karaoke highlight in orange (#FF6B00), exactly matching the spoken Turkish words: "<AYNI METİN>"`
   - Altyazı metni seslendirme/diyalogla **birebir aynı** olmalı. Kısa tut (satır başına 3–4 kelime), Türkçe karakterleri (ş, ğ, ı, ö, ü, ç) aynen yaz.
   - Altyazı için **dikdörtgen kutu/bar yasak** (kutusuz, konturlu, zıplayan kinetik yazı).
   - Uygulama ekranları "clean orange and white animated app interface" diye genel tarif edilir; ekranda altyazı dışında yazı isteme.
   - ⚠️ Veo Türkçe yazıyı bazen bozar: kullanıcıya "harf hatası olursa klibi yeniden üret" notunu düş.
8. **Tema:** `#FF6B00` turuncu & beyaz, sıcak animasyon berber/kuaför salonu (ahşap duvar, ışıklı ayna, berber direği),
   sinematik 3D aydınlatma, 9:16 dikey.
9. **Ses:** Her klipte animasyon ses efektlerini yaz (makas şıkırtısı, cartoon pop, bildirim "ding", whoosh). Müzik: upbeat, kısa.

## 🏁 Logo Kapanışı (her videoda zorunlu)
- **Flow ile (seslendirme + altyazı dahil):** `Frames to Video` → başlangıç karesi = ana klibin son karesi, bitiş karesi = beyaz zemin üzerinde `dist/brand/logo-dukkanim.png` logo görseli.
  Prompt içinde: turuncu-beyaz 3D parçacıkların döne döne toplanıp logoya dönüştüğü 2 sn'lik animasyon geçişi + kapanış seslendirmesi (`"Dükkanım Yanımda! Yorumlara randevu yaz!"`) + kutusuz kinetik altyazı.
- **Alternatif (CapCut):** Logo görseli `dist/brand/logo-dukkanim.png` + turuncu ışık patlaması + whoosh sesi.

## 📦 Çıktı Formatı (her istekte)
1. **Konu & özellik** (1 cümle, neden müşteri çeker)
2. **Flow ayarları** (Veo Quality, 9:16, karakter referansı ekli)
3. **Klip prompt'ları** (kod bloğu, kopyalanabilir) — içinde sahne + diyalog + `Voiceover` + `Burned-in subtitles` blokları
4. **Logo kapanış prompt'u** (kapanış seslendirmesi + altyazısı dahil)
5. **Seslendirme & altyazı özet tablosu** (zaman · konuşan · metin) — kontrol için
6. **Instagram açıklaması** (CTA: `Yorumlara "RANDEVU" yaz`)

## 💡 Özellik Havuzu (sırayla kullan, tekrar etme)
| Özellik | Kanca fikri |
|---|---|
| 7/24 online randevu | Gece 02:00, usta uyurken randevu düşüyor |
| Otomatik hatırlatma | Müşteri randevuyu unutuyor → telefonuna hatırlatma gidiyor |
| Çakışmasız takvim | Aynı saate iki müşteri kapıda |
| QR menü & fiyat listesi | Müşteri "fiyat ne usta?" diye 5. kez soruyor |
| Sesli asistan | Usta eli köpüklüyken sesle randevu ekliyor |
| Müşteri geçmişi / not | "Geçen sefer nasıl kesmiştik?" → kayıt anında ekranda |
| Gelir / günlük rapor | Akşam kasa hesabı yerine tek ekranda rapor |
