# 🤖 Dükkânım Yanımda - Uzman Ajanlar Ekibi (Agents Matrix)

Bu belge, **Dükkânım Yanımda** platformundaki geliştirme süreçlerinin izole edilmesi, kodların birbirine karışmaması ve tek bir merkezden (Lead Coordinator / Antigravity) kusursuz yönetilmesi amacıyla kurulmuş özel ajan ekibinin çalışma bölgelerini tanımlar.

---

## 🎯 Komuta Hiyerarşisi
- **Baş Koordinatör (Lead Orchestrator / Antigravity):** Kullanıcıdan gelen emirleri alır, hangi sektöre veya katmana ait olduğunu tespit eder, ilgili uzman ajanı göreve çağırır (`invoke_subagent`), denetler ve sonuçları raporlar.
- **Uzman Sektör Ajanları:** Sadece kendi yetki alanlarındaki dosyalarda kod yazar; diğer sektörlerin kodlarına ASLA dokunmaz.

---

## 👥 1. Berber & Kuaför Ajanı (`berber_agent`)
* **Rol:** Berber, Kuaför ve Randevu Sistemleri Geliştiricisi
* **Sorumlu Olduğu Dosyalar:**
  - `frontend/components/sector/BarberAppointmentsView.tsx`
  - `frontend/components/sector/BarberVoiceAssistant.tsx`
  - `frontend/components/public/PublicBarberBookingView.tsx`
  - `backend/routes/appointments.ts`
* **Temel Görevler:**
  - Koltuk ve usta randevu takvimi, slot hesaplamaları
  - Online randevu müşteri sayfası (`/r/:slug`) ve SMS OTP onay akışı
  - Usta / kalfa koltuk prim dağılımı
  - AI fotoğraf tarife okuyucu entegrasyonu
  - Online randevu kotalarının denetimi (Çırak: 20, Usta: 60, Patron: Sınırsız)

---

## 🛒 2. Market & Hızlı Kasa Ajanı (`market_agent`)
* **Rol:** Bakkal, Market, Manav ve Hızlı Tezgâh Satışı Geliştiricisi
* **Sorumlu Olduğu Dosyalar:**
  - `frontend/components/sector/FastRetailCounterView.tsx`
  - `backend/routes/products.ts`
  - `backend/routes/pos.ts`
* **Temel Görevler:**
  - Hızlı tezgâh sepet satışı ve kamera barkod okuma
  - EAN-13 elektronik terazi barkodu ayrıştırıcı (27/28 gram ağırlık, 29 kuruş tutar)
  - 58mm ve 80mm POS termal fiş yazdırma
  - Stok giriş/çıkış hareketleri ve kritik stok uyarıları
  - Tek tıkla veresiye defterine borç işleme

---

## 🍽️ 3. Restoran & Kafe Ajanı (`restoran_agent`)
* **Rol:** Restoran, Kafe, Masa ve QR Menü Geliştiricisi
* **Sorumlu Olduğu Dosyalar:**
  - `frontend/components/sector/RestaurantTablesView.tsx`
  - `frontend/components/public/PublicQrMenuView.tsx`
  - `backend/routes/tables.ts`
  - `backend/routes/menu.ts`
* **Temel Görevler:**
  - Canlı masa yönetimi, açık hesaplar ve adisyonlar
  - Masalara özel fotoğraflı QR menü sayfası (`/m/:slug`)
  - Masadan canlı garson çağırma ve hesap isteme bildirimleri (`/api/public/menu/:identifier/table-action`)
  - WebSocket anlık masa uyarıları ve yanıp sönen masa bildirimleri

---

## 💎 4. VIP & Gelir Mimarı Ajanı (`vip_revenue_agent`)
* **Rol:** VIP Monetization, Paketler ve Shopier Finans Geliştiricisi
* **Sorumlu Olduğu Dosyalar:**
  - `frontend/components/shop/VipAiConsultantModal.tsx`
  - `frontend/components/auth/LandingPage.tsx` *(Fiyatlandırma & Paketler bölümü)*
  - `backend/routes/vip.ts`
  - `backend/routes/shopierWebhook.ts`
* **Temel Görevler:**
  - 3 Kademeli paket kurgusu (Çırak ₺0, Usta ₺249, Patron VIP ₺499)
  - 14 Gün ücretsiz VIP deneme kampanyası ve sayaç yönetimi
  - Shopier ödeme linkleri ve Shopier OSB webhook entegrasyonu
  - Erken yenilemede gün yanmasını önleme (`Math.max + days`)
  - Özel yazılım paneli talep formu ve bildirimleri

---

## 🛡️ 5. Güvenlik & Altyapı Ajanı (`security_core_agent`)
* **Rol:** Platform Güvenlik, Kimlik ve Sistem Muhafızı
* **Sorumlu Olduğu Dosyalar:**
  - `backend/accounts.ts`
  - `backend/guards.ts`
  - `backend/app.ts`
  - `backend/routes/auth.ts`
  - `backend/routes/admin.ts`
  - `deploy/backup.sh`
* **Temel Görevler:**
  - Kimlik doğrulama, parola hashleme ve oturum yönetimi (`sid`, `aid`)
  - HTTPS 301 zorlaması, HSTS ve Secure/HttpOnly çerez bayrakları
  - IP bazlı rate limiting ve bot korumaları (429 Too Many Requests)
  - AES-256-CBC ile şifreli otomatik yedekleme ve oturum anahtarlarını yedekten ayırma
  - Kaynak kodda sır/anahtar sızıntısı kontrolü ve yetki aşımı (privilege escalation) engelleme
