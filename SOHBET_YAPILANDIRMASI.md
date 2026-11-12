# 🎯 Dükkanım Yanımda — Antigravity Sohbet ve Ajan Yapılandırma Rehberi

Bu rehber, Antigravity içerisinde **Dükkanım Yanımda** projesini en düzenli, modüler ve yüksek verimle yönetmeniz için hazırlanmıştır.

---

## 🧭 Genel Çalışma Mantığı

Antigravity arayüzünde (sol paneldeki **"+" / New Chat** butonuyla) birbirinden bağımsız **3 Ana Sohbet** açarak konuları birbirinden ayırıyoruz. Böylece hafıza (context) karışmaz, odak dağılmaz ve her konunun uzmanlığı kendi kanalında derinleşir.

```
📁 Dükkanım Yanımda (Antigravity)
│
├── 💬 Sohbet 1: 💻 YAZILIM GELİŞTİRME & MİMARİ
│   ├── 🤖 Sub-Agent 1: seo-uzmani (SEO, Meta, Core Web Vitals, Schema.org)
│   ├── 🤖 Sub-Agent 2: yazilim-gelistirici (Full-Stack Kodlama, React, Node, Randevu Motoru)
│   └── 🤖 Sub-Agent 3: admin-ve-guvenlik (Admin Paneli, RBAC, JWT, API Güvenliği, KVKK)
│
├── 💬 Sohbet 2: 📣 SATIŞ, REKLAM & MÜŞTERİ KAZANIMI
│   └── Odak: Reels videoları, esnaf ikna stratejileri, reklam metinleri, kampanyalar
│
└── 💬 Sohbet 3: 🗺️ YOL HARİTASI & ÜRÜN STRATEJİSİ
    └── Odak: Fazlar (MVP, Faz 1, Faz 2), sprint takvimi, özellik önceliklendirme, gelir modeli
```

---

## 1. 💻 Sohbet 1: Yazılım Geliştirme ve Mimari

Bu sohbet doğrudan kod yazımı, hata çözümü (debugging), performans ve sistem mimarisine ayrılmıştır.

### 🤖 Tanımlanan 3 Uzman Sub-Agent:
1. **`seo-uzmani`**:
   - Google yerel arama optimizasyonu (`LocalBusiness`, `HairSalon` Schema.org JSON-LD).
   - Core Web Vitals (LCP, CLS, INP) optimizasyonu, lazy loading, dinamik `sitemap.xml` ve `robots.txt`.
   - Sosyal medya paylaşım kartları (OpenGraph, Twitter Cards) ve semantik HTML.

2. **`yazilim-gelistirici`**:
   - React + TypeScript + Vite + Tailwind CSS ile esnaf ajandası ve müşteri randevu arayüzü.
   - Node.js / Python FastAPI randevu motoru, slot çakışma kontrolü ve çalışma saatleri mantığı.
   - Sesli asistan (`dukkanim_voice_engine.py`) ve video üretim scriptleri entegrasyonu.
   - Temiz kod (Clean Architecture, SOLID, DRY) ve refactoring.

3. **`admin-ve-guvenlik`**:
   - Süper Admin ve Esnaf rolleri için RBAC (Role-Based Access Control) yetkilendirme matrisi.
   - JWT token rotasyonu, HttpOnly çerezler ve oturum güvenliği.
   - Rate Limiting (DDoS/brute-force önleme), SQLi/XSS/CSRF koruması ve Helmet başlıkları.
   - KVKK / GDPR müşteri verisi gizliliği ve denetim logları (audit logs).

> 💡 **Nasıl Başlatılır? (Örnek Açılış Mesajı):**
> *"Selam, bu sohbeti Dükkanım Yanımda'nın YAZILIM GELİŞTİRME kanalı olarak kullanacağız. İhtiyaca göre seo-uzmani, yazilim-gelistirici ve admin-ve-guvenlik ajanlarımızla kodlarımızı geliştireceğiz. Şimdi ilk olarak [üzerinde çalışılacak konu/dosya] ile başlayalım."*

---

## 2. 📣 Sohbet 2: Satış, Reklam ve Müşteri

Bu sohbet esnafı sisteme çekme (acquisition), sosyal medya tanıtımları, Instagram Reels ve reklam kurguları içindir.

### 📌 Görev Alanları:
- Instagram Reels, TikTok ve YouTube Shorts senaryoları (`dukkanim-video-workflow.md` kuralı devrede).
- Berber ve kuaför esnafının itirazlarını (teknoloji korkusu, vakitsizlik vb.) aşan ikna metinleri ve saha sunumları.
- Müşterilere randevu hatırlatma, sadakat puanı ve kampanya bildirim kurguları.
- Meta / Google Ads reklam metinleri, kancalar (hooks) ve reklam bütçesi optimizasyon önerileri.

> 💡 **Nasıl Başlatılır? (Örnek Açılış Mesajı):**
> *"Selam, bu sohbeti SATIŞ, REKLAM VE MÜŞTERİ KAZANIMI kanalımız olarak açtım. Esnaflara yönelik yeni bir Reels videosu ve saha satış stratejisi üzerine çalışacağız."*

---

## 3. 🗺️ Sohbet 3: Yol Haritası ve Ürün Stratejisi

Bu sohbet projenin büyük resmini, zaman çizelgesini ve özelliklerin doğru sırada çıkmasını yönetir.

### 📌 Görev Alanları:
- **MVP (Minimum Viable Product):** Sistemin sahaya çıkması için olmazsa olmaz çekirdek özellikler (Randevu + SMS Onay + Basit Panel).
- **Faz 1 (Genişleme):** Esnaf detaylı takvimi, gelir/komisyon takibi, QR menü/fiyat panosu.
- **Faz 2 (Ölçeklenme):** Sesli AI randevu asistanı, otomatik esnaf pazarlama videoları, zincir şube desteği.
- Esnaflardan ve müşterilerden gelen taleplerin önceliklendirilmesi (MoSCoW veya RICE skoru).
- Gelir ve fiyatlandırma modelleri (Aylık abonelik vs. randevu başı komisyon).

> 💡 **Nasıl Başlatılır? (Örnek Açılış Mesajı):**
> *"Selam, bu sohbeti YOL HARİTASI VE STRATEJİ kanalımız olarak kullanacağız. Dükkanım Yanımda'nın MVP ve sonraki fazlarının öncelik sırasını, sprint planlarını belirleyeceğiz."*
