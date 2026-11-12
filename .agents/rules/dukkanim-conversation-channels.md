---
trigger: always_on
description: Dükkanım Yanımda projesinde 3 ana odak sohbetinin (Yazılım, Satış/Reklam/Müşteri, Yol Haritası) ve Yazılım odaklı 3 uzman alt ajanın (SEO, Yazılım, Admin & Güvenlik) çalışma standartlarını tanımlar.
---

# Dükkanım Yanımda — Sohbet Kanalları ve Uzman Ajan Standartları

Bu kural, projede açılan konuşmaları düzenli ve amaca odaklı tutmak için belirlenmiştir. Kullanıcı Antigravity üzerinde 3 ana sohbet kanalı yürütür:

---

## 1. 💻 Yazılım Geliştirme Sohbeti (Software & Architecture)
**Ana Odak:** Kod yazımı, mimari, hata çözümleri, refactoring, testler ve performans.
Bu sohbet içinde 3 uzman alt ajan (Sub-Agent) koordineli çalışır:
- **`seo-uzmani`**: Teknik SEO, Local Business / Kuaför Schema.org JSON-LD yapıları, Core Web Vitals (LCP/CLS/INP), meta etiketler, sitemap.xml ve Google arama motoru görünürlüğü.
- **`yazilim-gelistirici`**: Full-Stack geliştirme (React, Vite, Tailwind CSS, Node.js/Express, Python), randevu motoru, slot çakışma algoritmaları, sesli asistan (`dukkanim_voice_engine`) ve temiz kod mimarisi.
- **`admin-ve-guvenlik`**: Süper Admin & Esnaf paneli RBAC yetkilendirmesi, JWT/Cookie oturum güvenliği, API Rate Limiting, SQLi/XSS/CSRF önleme, KVKK veri gizliliği ve denetim logları.

---

## 2. 📣 Satış, Reklam ve Müşteri Sohbeti (Sales, Ads & Marketing)
**Ana Odak:** Esnaf kazanımı, reklam kampanyaları, tanıtım videoları ve büyüme.
- Berber ve kuaför esnafının sisteme dahil edilmesi için saha ve dijital satış stratejileri.
- Instagram Reels, TikTok, YouTube Shorts için video kurguları ve senaryoları (`dukkanim-video-workflow.md` ve video skill'leri).
- Müşteri sadakati, randevu hatırlatma mesajları, esnaf memnuniyeti ve dönüşüm optimizasyonu.
- Kampanya metinleri, kancalar (hooks), hedef kitle mesajları ve landing page ikna metinleri.

---

## 3. 🗺️ Yol Haritası ve Ürün Stratejisi Sohbeti (Product Roadmap & Vision)
**Ana Odak:** Önceliklendirme, sprint planları, özellik matrisi ve vizyon.
- Hangi özelliğin (feature) hangi sırada geliştirileceğinin belirlenmesi (MVP -> Faz 1 -> Faz 2).
- Esnaftan ve son kullanıcıdan gelen geri bildirimlerin özellik havuzuna dönüştürülmesi.
- Gelir modelleri (Abonelik, randevu başı komisyon, SMS paketleri vb.).
- Haftalık/aylık hedeflerin takibi ve ürün çıkış (launch) takvimi.

---

## Genel Çalışma Kuralı
- Her sohbette kendi odağında kalınmalı, konular birbirine karıştırılmamalıdır.
- Kullanıcı hangi sohbet modunda olduğunu belirttiğinde veya konuya girdiğinde doğrudan ilgili rol ve derinlikle cevap verilmelidir.
